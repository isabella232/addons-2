var servicesDict, usersDict, subdomain;
var incidents;

function visualize(data, metric, since, until, includeLowUrgency) {

	$('#headline').html('<h1>Incident summary report for ' + subdomain + '</h1>');

	var punchcard = [];
	for ( i = 0; i < 7; i++) {
		punchcard[i] = [];
		for ( j = 0; j < 24; j++ ) {
			punchcard[i][j] = {
				day: i,
				hour: j,
				count: 0,
				TTR: [],
				TTA: []
			};
		}
	}

	var weekly = {};

	var resolvers = {},
		services = {},
		servicesTTR = {},
		servicesTTA = {},
		servicesLookup = {},
		usersLookup = {};

	var a = moment(since);
	a.weekday(0);
	var b = moment(until);
	b.weekday(6);

	while ( a.isBefore(b) ) {
		var c = moment(a);
		var weekOf = c.weekday(0).format('L');
		var weekOfLong = c.weekday(0).format('LL');

		weekly[a.year() + "-" + a.week()]  = {
			week: a.week(),
			year: a.year(),
			weekOf: weekOf,
			weekOfLong: weekOfLong,
			count: 0,
			TTR: [],
			TTA: []
		}
		a.add(1, 'w');
	}

	Object.keys(data).forEach(function(incidentID) {
		var incident = data[incidentID];

		if ( ! includeLowUrgency && incident.urgency == 'low' ) {
			return;
		}

		if ( ! incident.log_entries.resolve_log_entry ) {
			console.log(`Incident ${incident.id} has no resolve log entries, skipped.`);
			return;
		}

		var created = moment(incident.created_at);

		punchcard[created.day()][created.hour()].count++;

		var resolved = moment(incident.log_entries.resolve_log_entry[0].created_at);
		var seconds_to_resolve = resolved.diff(created, 'seconds');
		var resolved_by = incident.log_entries.resolve_log_entry[0].agent;
		var resolved_by_user_name = 'Auto-resolved';
		var resolved_by_user_id = 'AUTO';

		if ( resolved_by.type == 'user_reference' ) {
			resolved_by_user_name = resolved_by.summary;
			resolved_by_user_id = resolved_by.id;
		}

		var acknowledged;
		var seconds_to_first_ack = -1;

		if (incident.log_entries.acknowledge_log_entry) {
			acknowledged = moment(incident.log_entries.acknowledge_log_entry[0].created_at);
			seconds_to_first_ack = acknowledged.diff(created, 'seconds');
		}

		if ( seconds_to_resolve >= 0 ) {
			punchcard[created.day()][created.hour()].TTR.push(seconds_to_resolve);

			if ( ! servicesTTR[incident.service.id] ) { servicesTTR[incident.service.id] = []; }
			servicesTTR[incident.service.id].push(seconds_to_resolve);

			weekly[created.year() + "-" + created.week()].TTR.push(seconds_to_resolve);
		}

		if ( seconds_to_first_ack >= 0 ) {
			punchcard[created.day()][created.hour()].TTA.push(seconds_to_first_ack);

			if ( ! servicesTTA[incident.service.id] ) { servicesTTA[incident.service.id] = []; }
			servicesTTA[incident.service.id].push(seconds_to_first_ack);

			weekly[created.year() + "-" + created.week()].TTA.push(seconds_to_resolve);
		}

		if ( ! resolvers[resolved_by_user_id] ) { resolvers[resolved_by_user_id] = 0; }
		resolvers[resolved_by_user_id]++;

		if ( ! usersLookup[resolved_by_user_id] ) {
			usersLookup[resolved_by_user_id] = resolved_by_user_name;
		}

		if ( ! servicesLookup[incident.service.id] ) {
			servicesLookup[incident.service.id] = incident.service.summary;
		}

		if ( ! services[incident.service.id] ) { services[incident.service.id] = 0; }
		services[incident.service.id]++;

		weekly[created.year() + "-" + created.week()].count++;
	});

	var punchcardForD3 = [];
	var dailyTotals = [];
	var hourlyTotals = [];
	for ( i = 0; i < 7; i++) {
		if ( dailyTotals[i] == undefined ) { dailyTotals[i] = { count: 0, TTR: [], TTA: [] } }
		for ( j = 0; j < 24; j++ ) {
			if ( hourlyTotals[j] == undefined ) { hourlyTotals[j] = { count: 0, TTR: [], TTA: [] }; }

			dailyTotals[i].count += punchcard[i][j].count;
			hourlyTotals[j].count += punchcard[i][j].count;

			if ( punchcard[i][j].TTR.length ) {
				dailyTotals[i].TTR = dailyTotals[i].TTR.concat(punchcard[i][j].TTR);
				hourlyTotals[j].TTR = hourlyTotals[j].TTR.concat(punchcard[i][j].TTR);
			}

			if ( punchcard[i][j].TTA.length ) {
				dailyTotals[i].TTA = dailyTotals[i].TTA.concat(punchcard[i][j].TTA);
				hourlyTotals[j].TTA = hourlyTotals[j].TTA.concat(punchcard[i][j].TTA);
			}

			var v = {
				day: punchcard[i][j].day,
				hour: punchcard[i][j].hour,
				count: punchcard[i][j].count,
				MTTR: punchcard[i][j].TTR.length ? d3.mean(punchcard[i][j].TTR) : null,
				MTTA: punchcard[i][j].TTA.length ? d3.mean(punchcard[i][j].TTA) : null
			}

			punchcardForD3.push(v);
		}
	}

	hourlyTotals = hourlyTotals.map(function(d) {
		return $.extend({}, true, {
			MTTR: d.TTR.length ? d3.mean(d.TTR) : null,
			MTTA: d.TTA.length ? d3.mean(d.TTA) : null
		},
		d);
	});

	dailyTotals = dailyTotals.map(function(d) {
		return $.extend({}, true, {
			MTTR: d.TTR.length ? d3.mean(d.TTR) : null,
			MTTA: d.TTA.length ? d3.mean(d.TTA) : null
		},
		d);
	});

	var weeklyForD3 = [];
	Object.keys(weekly).forEach(function(key) {
		weeklyForD3.push(weekly[key]);
	});
	weeklyForD3.forEach(function(week) {
		week.MTTR = week.TTR.length ? d3.mean(week.TTR) : null;
		week.MTTA = week.TTA.length ? d3.mean(week.TTA) : null;
	});

	var resolversSorted = Object.keys(resolvers).map(function(key) {
	    return [key, resolvers[key]];
	});
	resolversSorted.sort(function(a, b) {
		return b[1] - a[1];
	});

	var servicesSorted = Object.keys(services).map(function(key) {
	    return [key, services[key]];
	});
	servicesSorted.sort(function(a, b) {
		return b[1] - a[1];
	});

	var servicesMTTR = [];
	Object.keys(servicesTTR).map(function(key) {
		servicesMTTR.push([key, d3.mean(servicesTTR[key])]);
	});
	servicesMTTR.sort(function(a, b) {
		return b[1] - a[1];
	});

	var servicesMTTA = [];
	Object.keys(servicesTTA).map(function(key) {
		servicesMTTA.push([key, d3.mean(servicesTTA[key])]);
	});
	servicesMTTA.sort(function(a, b) {
		return b[1] - a[1];
	});

	drawWeekly($('#weekly'), since, until, weeklyForD3, metric, null)
	drawPunchcard($('#chart'), since, until, punchcardForD3, metric, dailyTotals, hourlyTotals);
	drawTop($('#topservices'), servicesLookup, servicesSorted.slice(0, 10));
	drawTop($('#topresolvers'), usersLookup, resolversSorted.slice(0, 10));
	drawTop($('#topservicesmttr'), servicesLookup, servicesMTTR.slice(0, 10), function(d) { return secondsToHMS(d) });
	drawTop($('#topservicesmtta'), servicesLookup, servicesMTTA.slice(0, 10), function(d) { return secondsToHMS(d) });

	var msg = "";
	["count", "MTTA", "MTTR"].forEach(function(m) {
		var maxVal = d3.max(punchcardForD3, function(d) { return d[m] });
		var maxValCells = punchcardForD3.filter(function(e) { return e[m] == maxVal; });
		var maxValTimeStrs = maxValCells.map(function(e) { return dayNumberToString(e.day, true) + " at " + hourNumberToString(e.hour, true) });

		msg += "Highest <b>" + m + "</b> was <b>" + formatMetricValueForMessages(m, maxVal) + "</b>, seen " + maxValTimeStrs.join(", ") + ". ";
	});

	$('#punchcardmessages').html("<p>&nbsp;</p>" + msg + "<p>&nbsp;</p>");

	var latestWeekCount = weeklyForD3[weeklyForD3.length-1].count;
	var previousWeekCount = weeklyForD3[weeklyForD3.length-2].count;
	var percentChangeCount = Math.round(((latestWeekCount/previousWeekCount) - 1.00) * 100);

	var msg = "There were <b>" + weeklyForD3[weeklyForD3.length-1].count + " incidents triggered</b> in the week of " + weeklyForD3[weeklyForD3.length-1].weekOfLong;
	if ( percentChangeCount > 0 ) {
		msg += ", <b>up " + percentChangeCount + "%</b>";
	} else if ( percentChangeCount < 0 ) {
		msg += ", <b>down " + Math.abs(percentChangeCount) + "%</b>";
	} else {
		msg += ", unchanged";
	}
	msg += " from the previous week. ";

	["MTTA", "MTTR"].forEach(function(m) {
		if ( ! weeklyForD3[weeklyForD3.length-1][m] ) {
			return;
		}
		var latestWeek = weeklyForD3[weeklyForD3.length-1][m];
		var previousWeek = weeklyForD3[weeklyForD3.length-2][m];
		var percentChange = Math.round(((latestWeek/previousWeek) - 1.00) * 100);

		msg += "<b>" + m + "</b> was <b>" + formatMetricValueForMessages(m, weeklyForD3[weeklyForD3.length-1][m]);

		if ( percentChange > 0 ) {
			msg += ", up " + percentChange + "%";
		} else if ( percentChange < 0 ) {
			msg += ", down " + Math.abs(percentChange) + "%";
		} else {
			msg += ", unchanged";
		}
		msg += "</b> from the previous week. "
	});
	$('#weeklymessages').html("<p>&nbsp;</p>" + msg + "<p>&nbsp;</p>");

}

function drawTop(element, lookup, topThings, hoverFormatter) {
	var divWidth = element.width();
	var margin = {
		top: 10,
		bottom: 10,
		right: 10,
		left: 10
	};
	var chartWidth = divWidth - margin.left - margin.right;
	var chartHeight = Math.round(chartWidth * 1.3);
	var barWidth = 	Math.floor(chartWidth * 2/3);
	var barHeight = Math.floor(chartHeight / topThings.length);
	var labelWidth = chartWidth - barWidth;
	var cellPadding = 1;

	if ( ! hoverFormatter ) {
		hoverFormatter = function(d) {
			return d;
		}
	}

	element.html('');
	var chart = d3.select(element[0]).append('svg')
		.attr('width', chartWidth)
		.attr('height', chartHeight)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	var max = d3.max(topThings, function(d) { return d[1]; });
	chart.selectAll(".bar")
		.data(topThings)
		.enter()
		.append("rect")
		.attr("x", labelWidth + cellPadding)
		.attr("y", function(d, i) { return barHeight * i + cellPadding; })
		.attr("width", function(d) { return (d[1] / max) * barWidth - cellPadding * 2; })
		.attr("height", barHeight - cellPadding * 2 )
		.attr("class", "bar")
		.style("fill", "#8d8db3");

	chart.selectAll(".barlabel")
		.data(topThings)
		.enter()
		.append("text")
		.text(function(d) { return lookup[d[0]] ? lookup[d[0]] : (d[0] ? "ID: " + d[0] : "None"); })
		.attr("x", labelWidth - cellPadding)
		.attr("y", function(d, i) { return ( barHeight * i ) + (barHeight / 2) })
		.attr("class", "barlabel")
        .style('text-anchor', 'end')
        .style('alignment-base', 'middle')
        .style('fill', '#000');

    var hovers = chart.selectAll("hover")
    	.data(topThings);

    var hoversEnter = hovers.enter()
    	.append("g")
    	.attr("class", "hover")
    	.on("mouseover", function(d) {
	    	var selection = d3.select(this);
	    	selection.select("rect").transition().duration(100).style("opacity", 0.6);
	    	selection.select("text").transition().duration(100).style("opacity", 1);
    	})
    	.on("mouseout", function(d) {
	    	var selection = d3.select(this);
	    	selection.select("rect").transition().style("opacity", 0);
	    	selection.select("text").transition().style("opacity", 0);
    	});

		hoversEnter
			.append("rect")
			.attr("x", labelWidth + cellPadding)
			.attr("y", function(d, i) { return barHeight * i + cellPadding; })
			.attr("width", barWidth)
			.attr("height", barHeight - cellPadding * 2 )
			.style("fill", "#000022")
			.style("opacity", 0);

		hoversEnter
			.append("text")
			.text(function(d) { return hoverFormatter(d[1]); })
			.attr("x", labelWidth + cellPadding + barWidth / 2)
			.attr("y", function(d, i) { return barHeight * i + cellPadding + barHeight / 2; })
			.style("text-anchor", "middle")
			.style("alignment-base", "middle")
			.style("fill", "#ffffff")
			.style("font-weight", "bold")
			.style("opacity", 0);

		hovers.exit().remove();

}

function drawWeekly(element, since, until, data, metric, hoverFormatter) {
	var divWidth = element.width();
	var margin = {
		top: 10,
		bottom: 10,
		right: 10,
		left: 10
	};
	var labelHeight = 80;
	var chartWidth = divWidth - margin.left - margin.right;
	var chartHeight = chartWidth * 0.2;
	var barWidth = Math.floor(chartWidth / (data.length + 1));
	var barHeight = chartHeight - labelHeight;
	var cellPadding = 1;

	if ( ! hoverFormatter ) {
		hoverFormatter = function(d) {
			return d;
		}
	}

	element.html('<h3>Incident ' + metric + ' by week between ' + moment(since).format('ll LT') + ' and ' + moment(until).format('ll LT') + '</h3>');

	var chart = d3.select(element[0]).append('svg')
		.attr('width', chartWidth)
		.attr('height', chartHeight)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	var max = d3.max(data, function(d) { return d ? d[metric] : 0; });
	chart.selectAll(".bar")
		.data(data)
		.enter()
		.append("rect")
		.attr("x", function(d, i) { return barWidth * i + cellPadding; })
		.attr("y", function(d) { return barHeight - (d[metric] / max) * barHeight + cellPadding })
		.attr("width", barWidth - cellPadding * 2)
		.attr("height", function(d) { return  (d[metric] / max) * barHeight - cellPadding * 2; })
		.attr("class", "bar")
		.style("fill", "#8d8db3");

    var hovers = chart.selectAll("hover")
    	.data(data);

    var hoversEnter = hovers.enter()
    	.append("g")
    	.attr("class", "hover")
    	.on("mouseover", function(d) {
	    	var selection = d3.select(this);
	    	selection.select("rect").transition().duration(100).style("opacity", 0.6);
	    	selection.select("text").transition().duration(100).style("opacity", 1);
    	})
    	.on("mouseout", function(d) {
	    	var selection = d3.select(this);
	    	selection.select("rect").transition().style("opacity", 0);
	    	selection.select("text").transition().style("opacity", 0);
    	})
        .on("click", function(d) {
	        if ( d[metric] > 0 ) {
		        var params = {
			        token: getToken(),
			        since: moment(d.weekOfLong, "MMMM DD, YYYY").weekday(0).toISOString(),
			        until: moment(d.weekOfLong, "MMMM DD, YYYY").weekday(6).toISOString()
		        }
		        window.open("details.html?" + $.param(params));
	        }
	    });

		hoversEnter
			.append("rect")
			.attr("x", function(d, i) { return barWidth * i + cellPadding; })
			.attr("y", 0 )
			.attr("width", barWidth - cellPadding * 2 )
			.attr("height", barHeight - cellPadding * 2 )
			.style("fill", "#000022")
			.style("opacity", 0);

		hoversEnter
			.append("text")
	    	.text(function(d) { return (metric == "count" || d[metric]) ? formatMetricValueForPunchcard(metric, d[metric]) : "n/a"; })
			.attr("x", function(d, i) { return barWidth * i + cellPadding + barWidth / 2; } )
			.attr("y", barHeight / 2)
			.style("text-anchor", "middle")
			.style("alignment-base", "middle")
			.style("fill", "#ffffff")
			.style("font-weight", "bold")
			.style("opacity", 0);

		hovers.exit().remove();

		var xScale = d3.scale.linear().domain([0, data.length - 1]).range([0, barWidth * (data.length - 1)]);

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom")
		    .ticks(data.length)
		    .tickFormat(function(d) {
				return data[d].weekOf;
		    });

		chart.append("g")
		    .attr("class", "axis")
		    .attr("transform", "translate(0, " + barHeight + ")")
		    .call(xAxis)
			.selectAll("text")
			.attr("y", 0)
			.attr("x", -9)
			.attr("dy", ".35em")
			.attr("transform", "rotate(270)")
			.style("text-anchor", "end");
}

function secondsToHMS(seconds, long) {
	var d = Number(seconds);
	var h = Math.floor(d / 3600);
	var m = Math.floor(d % 3600 / 60);
	var s = Math.floor(d % 3600 % 60);

	if ( long ) {
		return (h > 0 ? h + " hours, " : "") + ((h > 0 || m > 0) ? m + " minutes, " : "") + s + " seconds";
	} else {
		return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
	}
}

function formatMetricValueForPunchcard(metric, value) {
	switch ( metric ) {
		case "count": return value;
			break;
		case "MTTR": return secondsToHMS(value);
			break;
		case "MTTA": return secondsToHMS(value);
			break;
	}
}

function formatMetricValueForMessages(metric, value) {
	switch ( metric ) {
		case "count": return value;
			break;
		case "MTTR": return secondsToHMS(value, true);
			break;
		case "MTTA": return secondsToHMS(value, true);
			break;
	}
}

function drawPunchcard(element, since, until, punchcard, metric, dailyTotals, hourlyTotals) {
	var maxvalue = d3.max(punchcard, function(d) { return d[metric]; });
	var dailymax = d3.max(dailyTotals, function(d) { return d[metric]; });
	var hourlymax = d3.max(hourlyTotals, function(d) { return d[metric]; });

	var divWidth = element.width();
	var margin = {
		top: 10,
		bottom: 10,
		right: 10,
		left: 10
	};
	var yLabelWidth = 60;
	var xLabelHeight = 40;
	var chartWidth = divWidth - margin.left - margin.right;
	var dailyBarWidth = chartWidth * 0.1;
	var hourlyBarHeight = dailyBarWidth;
	var cellSize = Math.floor((chartWidth - dailyBarWidth - yLabelWidth) / 24);
	var chartHeight = hourlyBarHeight + xLabelHeight + ( cellSize * 7 );
	var cellPadding = 1;

	element.html('<h3>Incident ' + metric + ' by day and hour between ' + moment(since).format('ll LT') + ' and ' + moment(until).format('ll LT') + '</h3>');
	var chart = d3.select(element[0]).append('svg')
		.attr('width', chartWidth)
		.attr('height', chartHeight)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	var colorScale = d3.scale.linear()
		.domain([0, maxvalue])
		.range(["#f8f8ff", "#000044"]);

	chart.selectAll(".cell")
		.data(punchcard)
		.enter()
		.append("rect")
		.attr("x", function(d) { return d.hour * cellSize + dailyBarWidth + cellPadding; })
		.attr("y", function(d) { return d.day * cellSize + hourlyBarHeight + cellPadding; })
		.attr("width", cellSize - cellPadding * 2)
		.attr("height", cellSize - cellPadding * 2)
		.attr("class", "cell")
		.style("fill", function(d) { return d[metric] ? colorScale(d[metric]) : "#fbfbfb"; });

	chart.selectAll(".dailytotal")
		.data(dailyTotals)
		.enter()
		.append("rect")
		.attr("x", function(d) { return dailyBarWidth - ((d[metric] / dailymax) * dailyBarWidth); })
		.attr("y", function(d, i) { return hourlyBarHeight + (cellSize * i) + cellPadding; })
		.attr("width", function(d) { return d[metric] ? (d[metric] / dailymax) * dailyBarWidth - cellPadding : 0; })
		.attr("height", function() { return cellSize - cellPadding * 2; })
		.attr("class", "dailytotal")
		.style("fill", "#8d8db3");

	chart.selectAll(".hourlytotal")
		.data(hourlyTotals)
		.enter()
		.append("rect")
		.attr("x", function(d, i) { return dailyBarWidth + (cellSize * i) + cellPadding; })
		.attr("y", function(d) { return hourlyBarHeight - ((d[metric] / hourlymax) * hourlyBarHeight); })
		.attr("width", function() { return cellSize - cellPadding * 2; })
		.attr("height", function(d) { return d[metric] ? (d[metric] / hourlymax) * hourlyBarHeight - cellPadding : 0; })
		.attr("class", "hourlytotal")
		.style("fill", "#8d8db3");

	var cellLabels = chart.selectAll(".celllabel")
		.data(punchcard);

	var cellLabelsEnter = cellLabels.enter()
		.append("g")
		.attr("class", "celllabel")
        .on('mouseover', function(d){
            var selection = d3.select(this)
            selection.select("rect").transition().duration(100).style('opacity', 0.6)
            selection.select("text").transition().duration(100).style('opacity', 1)
        })
        .on('mouseout', function(d){
            var selection = d3.select(this)
            selection.select("rect").transition().style('opacity', 0)
            selection.select("text").transition().style('opacity', 0)
        })
        .on("click", function(d) {
	        if ( d[metric] > 0 ) {
		        var params = {
			        token: getToken(),
			        since: $('#since').datepicker("getDate").toISOString(),
			        until: $('#until').datepicker("getDate").toISOString(),
			        day: d.day,
			        hour: d.hour
		        }
		        window.open("details.html?" + $.param(params));
	        }
	    });

    var rects = cellLabelsEnter
        .append("rect")
		.attr("x", function(d) { return d.hour * cellSize + dailyBarWidth + cellPadding; })
		.attr("y", function(d) { return d.day * cellSize + hourlyBarHeight + cellPadding; })
		.attr("width", cellSize - cellPadding * 2)
		.attr("height", cellSize - cellPadding * 2)
    	.style("fill", "#000022")
    	.style("opacity", 0)

    var text = cellLabelsEnter
    	.append('text')
    	.text(function(d) { return (metric == "count" || d[metric]) ? formatMetricValueForPunchcard(metric, d[metric]) : "n/a"; })
		.attr("x", function(d) { return d.hour * cellSize + dailyBarWidth + cellPadding + cellSize / 2; })
		.attr("y", function(d) { return d.day * cellSize + hourlyBarHeight + cellPadding + cellSize / 2; })
        .style('text-anchor', 'middle')
        .style('alignment-base', 'middle')
        .style('fill', '#fff')
        .style('font-size', '11px')
        .style('opacity', 0)

    cellLabels.exit().remove();

    var rowLabels = chart.selectAll("rowlabel")
    	.data(dailyTotals);

    var rowLabelsEnter = rowLabels.enter()
    	.append("g")
    	.attr("class", "rowlabel")
    	.on("mouseover", function(d) {
	    	var selection = d3.select(this);
	    	selection.select("rect").transition().duration(100).style("opacity", 0.6);
	    	selection.select("text").transition().duration(100).style("opacity", 1);
    	})
    	.on("mouseout", function(d) {
	    	var selection = d3.select(this);
	    	selection.select("rect").transition().style("opacity", 0);
	    	selection.select("text").transition().style("opacity", 0);
    	})
        .on("click", function(d, i) {
	        if ( d[metric] > 0 ) {
		        var params = {
			        token: getToken(),
			        since: $('#since').datepicker("getDate").toISOString(),
			        until: $('#until').datepicker("getDate").toISOString(),
			        day: i
		        }
		        window.open("details.html?" + $.param(params));
	        }
	    });

		rowLabelsEnter
			.append("rect")
			.attr("x", 0)
			.attr("y", function(d, i) { return hourlyBarHeight + cellSize * i + cellPadding; })
			.attr("width", dailyBarWidth - cellPadding )
			.attr("height", cellSize - cellPadding * 2)
			.style("fill", "#000022")
			.style("opacity", 0);

		rowLabelsEnter
			.append("text")
			.text(function(d) { return (metric == "count" || d[metric]) ? formatMetricValueForPunchcard(metric, d[metric]) : "n/a"; })
			.attr("x", dailyBarWidth / 2)
			.attr("y", function(d, i) { return hourlyBarHeight + cellSize * i + cellSize / 2; })
			.style("text-anchor", "middle")
			.style("alignment-base", "middle")
			.style("fill", "#ffffff")
	        .style("font-size", "11px")
			.style("opacity", 0);

		rowLabels.exit().remove();

    var colLabels = chart.selectAll("collabel")
    	.data(hourlyTotals);

    var colLabelsEnter = colLabels.enter()
    	.append("g")
    	.attr("class", "collabel")
    	.on("mouseover", function(d) {
	    	var selection = d3.select(this);
	    	selection.select("rect").transition().duration(100).style("opacity", 0.6);
	    	selection.select("text").transition().duration(100).style("opacity", 1);
    	})
    	.on("mouseout", function(d) {
	    	var selection = d3.select(this);
	    	selection.select("rect").transition().style("opacity", 0);
	    	selection.select("text").transition().style("opacity", 0);
    	})
        .on("click", function(d, i) {
	        if ( d[metric] > 0 ) {
		        var params = {
			        token: getToken(),
			        since: $('#since').datepicker("getDate").toISOString(),
			        until: $('#until').datepicker("getDate").toISOString(),
			        hour: i
		        }
		        window.open("details.html?" + $.param(params));
	        }
	    });

		colLabelsEnter
			.append("rect")
			.attr("x", function(d, i) { return dailyBarWidth + cellSize * i + cellPadding; })
			.attr("y", 0)
			.attr("width", cellSize - cellPadding * 2 )
			.attr("height", hourlyBarHeight - cellPadding )
			.style("fill", "#000022")
			.style("opacity", 0);

		colLabelsEnter
			.append("text")
			.text(function(d) { return (metric == "count" || d[metric]) ? formatMetricValueForPunchcard(metric, d[metric]) : "n/a"; })
			.attr("x", function(d, i) { return dailyBarWidth + cellSize * i + cellSize / 2; })
			.attr("y", hourlyBarHeight / 2 )
			.style("text-anchor", "middle")
			.style("alignment-base", "middle")
			.style("fill", "#ffffff")
	        .style("font-size", "11px")
			.style("opacity", 0);

		colLabels.exit().remove();

		var xScale = d3.scale.linear().domain([0, 23]).range([dailyBarWidth + cellSize / 2, dailyBarWidth + cellSize * 24 - cellSize / 2]),
		    yScale = d3.scale.linear().domain([0, 6]).range([hourlyBarHeight + cellSize / 2, hourlyBarHeight + cellSize * 7 - cellSize / 2]);

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom")
		    .ticks(24)
		    .tickFormat(function(d) {
		        return hourNumberToString(d);
		    }),
		    yAxis = d3.svg.axis().scale(yScale).orient("right")
		    .ticks(7)
		    .tickFormat(function(d) {
		        return dayNumberToString(d);
		    });

		chart.append("g")
		    .attr("class", "axis")
		    .attr("transform", "translate(0, " + (hourlyBarHeight + cellSize * 7) + ")")
		    .call(xAxis);

		chart.append("g")
		    .attr("class", "axis")
		    .attr("transform", "translate(" + (dailyBarWidth + cellSize * 24) + ", 0)")
		    .call(yAxis);
}

function fetchReportData(since, until, callback) {
	var progress = {
		incidents: {
			total: 0,
			done: 0
		},
		log_entries: {
			total: 0,
			done: 0
		}
	};

	async.parallel([
		function(callback) {
			fetchLogEntries(since, until, function(data) {
				callback(null, data);
			},
			function(total, done) {
				progress.log_entries.total = total;
				progress.log_entries.done = done;
				progress_percent = Math.round(( progress.incidents.done + progress.log_entries.done ) / ( progress.incidents.total + progress.log_entries.total ) * 100);
				$('#busy-percent').html(`<h1>${progress_percent}%</h1>`);
			});
		},
		function(callback) {
			fetchIncidents(since, until, function(data) {
				callback(null, data);
			},
			function(total, done) {
				progress.incidents.total = total;
				progress.incidents.done = done;
				progress_percent = Math.round(( progress.incidents.done + progress.log_entries.done ) / ( progress.incidents.total + progress.log_entries.total ) * 100);
				$('#busy-percent').html(`<h1>${progress_percent}%</h1>`);
			});
		}
	],
	function(err, results) {
		callback(results);
	});
}

function parseReportData(log_entries, fetchedIncidents) {
	$('#busy-message').html('<h1>Parsing incidents...</h1>');
	incidents = {};
	fetchedIncidents.forEach(function (incident) {
		incidents[incident.id] = incident;
		incidents[incident.id].log_entries = {};
	});

	$('#busy-message').html('<h1>Adding log entries to incidents...</h1>');
	log_entries.forEach(function(le) {
		if ( incidents[le.incident.id] ) {
			if ( ! incidents[le.incident.id]['log_entries'][le.type] ) {
				incidents[le.incident.id]['log_entries'][le.type] = [];
			}
			incidents[le.incident.id]['log_entries'][le.type].push(le);
		}
	});

	$('#busy-message').html('<h1>Sorting incident log entries...</h1>');
	Object.keys(incidents).forEach(function(id) {
		Object.keys(incidents[id]['log_entries']).forEach(function(leType) {
			incidents[id]['log_entries'][leType].sort(compareCreatedAt);
		});

		incidents[id].ttr = moment(incidents[id].last_status_change_at).diff(moment(incidents[id].created_at), 'seconds');

		if ( incidents[id]['log_entries']['acknowledge_log_entry'] ) {
			incidents[id].tta = moment(incidents[id]['log_entries']['acknowledge_log_entry'][0].created_at).diff(moment(incidents[id].created_at), 'seconds');
		}
	});
}

function compareCreatedAt(a, b) {
	return moment(a.created_at).diff(moment(b.created_at));
}

function setProgressBar(progress) {
	$('#progressbar').attr("aria-valuenow", "" + progress);
	$('#progressbar').attr("style", "width: " + progress + "%;");
	$('#progressbar').html("" + progress + "%");
}

function main() {
	debugger
	if (!getToken()) {
		var oauthResponseParams = getOAuthResponseParams();
		if (!oauthResponseParams.token && !oauthResponseParams.state) {
			requestOAuthToken();
			return;
		} else {
			receiveOAuthToken(oauthResponseParams);
		}
	}

	$('#since').datepicker();
	$('#until').datepicker();

	if (getParameterByName('hideControls') == 'true') {
		$('#controls').hide();
	}

	var fetchedData;
	var metric = "count";
	var until = new Date();
	var since = new Date();
	since.setMonth(since.getMonth() - 1);

	since.setHours(0,0,0,0);
	until.setHours(23,59,59,999);

	$('#since').datepicker("setDate", since);
	$('#until').datepicker("setDate", until);

	async.series([
		function(callback) {
			$('#busy-message').html('<h1>Getting subdomain...</h1>');
			$('.busy').show();
			var options = {
				limit: 1,
				success: function(data) {
					subdomain = data.users[0].html_url.split(/[\/]+/)[1];
					callback(null, 'yay');
				}
			}
			PDRequest(getToken(), 'users', 'GET', options);
		},
		function(callback) {
			$('#busy-message').html('<h1>Getting incidents and log entries...</h1>');
			fetchReportData(since, until, function(data) {
				callback(null, data);
			});
		}
	],
	function(err, results) {
		var log_entries = results[1][0];
		var fetchedIncidents = results[1][1];

		parseReportData(log_entries, fetchedIncidents);
		visualize(incidents, metric, since, until, false);
		$('.busy').hide();
	});

	$('#since').change(function() {
		since = $('#since').datepicker("getDate");
		since.setHours(0,0,0,0);
		$('#busy-message').html('<h1>Getting incidents and log entries...</h1>');
		$('.busy').show();
		fetchReportData(since, until, function(data) {
			parseReportData(data[0], data[1]);
			visualize(incidents, metric, since, until, false);
			$('.busy').hide();
		});
	});

	$('#until').change(function() {
		until = $('#until').datepicker("getDate");
		until.setHours(23,59,59,999);
		$('#busy-message').html('<h1>Getting incidents and log entries...</h1>');
		$('.busy').show();
		fetchReportData(since, until, function(data) {
			parseReportData(data[0], data[1]);
			visualize(incidents, metric, since, until, false);
			$('.busy').hide();
		});
	});

	$('.metric-button').click(function(e) {
		$('.metric-button').removeClass('active');
		$(this).addClass('active');

		metric = this.id;
		visualize(incidents, metric, since, until, false);
	});
}

$(document).ready(main);
