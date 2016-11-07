var apps;
var resultsArr;
var fetchedDetails;
var summaries = {};
var user, pass, clientID;

var takeLogin = function() {
	user = $("#user").val();
	pass = $("#pass").val();
	clientID = $("#clientID").val();

	localStorage.setItem("clientID", clientID);
	localStorage.setItem("user", user);

	$('.login').hide();
	$('.busy').show();

	getToken(clientID, user, pass, function(err, bearer) {
		if (err) {
			$('.busy').hide();
			console.log(JSON.stringify(err, null, '  '));
			$('.login-error').html($('<p>').text('Error logging in: ' + 
				err.statusText));
			$('.login').show();
		} else {
			$('.login-error').html('');
			token = bearer.access_token;
			sessionStorage.setItem("token", token);
			listApps(token, function(err, data) {
				$('.busy').hide();
				if (err) {
					alert('failed!\n' + JSON.stringify(err, null, '  '));
				} else {
					apps = data;
					populateAppsMenu();
					$('.content').show();
				}
			});
		}
	});
}

var takeToken = function() {
	token = $("#token").val();
	sessionStorage.setItem("token", token);

	$('.login').hide();
	$('.busy').show();

	console.log('using OAuth2 token provided ' + token);
	listApps(token, function(err, data) {
		$('.busy').hide();
		if (err) {
			sessionStorage.removeItem("token");
			if ( err.responseJSON && err.responseJSON.message ) {
				$('.login-error').html($('<p>').text('Error logging in: ' + err.responseJSON.message));
			} else {
				$('.login-error').html($('<p>').text('Error logging in - check your token'));
			}
			$('.login').show();
		} else {
			apps = data;
			populateAppsMenu();
			$('.content').show();
		}
	});
}

var populateAppsMenu = function() {
	var user = localStorage.getItem("user");

	for (app in apps) {
		$('.app-select').append($('<option/>', {
			value: app,
			text: apps[app].appName
		}));
	}
	populateVersionsMenu();
	
	$('.app-select').change(function() {
		populateVersionsMenu();
	});
	
	$('#crashes-button').click(function() {
		getData($('#crashOrException-select').val(), $('.app-select').val());
	});
	
	$('#rangeStart').datepicker();
	$('#rangeEnd').datepicker();

	var d = new Date();
	$('#rangeStart').datepicker('setDate', d);
	
	d.setDate(d.getDate() + 1);
	$('#rangeEnd').datepicker('setDate', d);
	
	$('#range-select').change(function() {
		if ( $('#range-select').val() === 'none' ) {
			$('#rangeStart').hide();
			$('#rangeEnd').hide();
		} else {
			$('#rangeStart').show();
			$('#rangeEnd').show();
		}
	});
	
	$('#view-select').change(function() {
		if (resultsArr && resultsArr.length > 0) {
			showResults($('#view-select').val());
		}
	});
	
	$('#sortBy-select').change(function() {
		if ( $('#sortBy-select').val() === 'none' ) {
			$('#sortOrder-select').hide();
		} else {
			$('#sortOrder-select').show();
		}
	});
	
	$('#logout-button').click(function() {
		sessionStorage.removeItem('token');
		location.reload();
	});
}

var populateVersionsMenu = function() {
	$('#version-select').html('');
	$('#version-select').append($('<option/>', {
			value: 'all',
			text: 'Any version'
		}));

	for (version in apps[$('.app-select').val()].appVersions) {
		$('#version-select').append($('<option/>', {
			value: apps[$('.app-select').val()].appVersions[version],
			text: apps[$('.app-select').val()].appVersions[version]
		}));
	}
}

var getSummaries = function(crashOrException, token, params, appSelectors, callback) {
	if ( crashOrException == 'crash' ) {
		getCrashSummaries(token, params, appSelectors, callback);
	} else {
		getExceptionSummaries(token, params, appSelectors, callback);		
	}
}

var getData = function(crashOrException, appID, wantLots) {
	var appSelectors = {};
	var responseAppID = appID;
	var version = $('#version-select').val(); 
	
	if ( version === 'all' ) {
		appSelectors = {
			appSelectors: [
				{
					appId: appID
				}
			]
		};
	} else {
		responseAppID = appID + '-' + version;
		appSelectors = {
			appSelectors: [
				{
					appId: appID,
					appVersion: version
				}
			]
		};
	}
	
	var params = {};
	if ( $('#range-select').val() === 'firstOccurred' ) {
		var start = new Date($('#rangeStart').datepicker('getDate'));
		var end = new Date($('#rangeEnd').datepicker('getDate'));
		params.firstOccurredStart = start.toISOString();
		params.firstOccurredEnd = end.toISOString();
	} else if ( $('#range-select').val() === 'lastOccurred' ) {
		var start = new Date($('#rangeStart').datepicker('getDate'));
		var end = new Date($('#rangeEnd').datepicker('getDate'));
		params.lastOccurredStart = start.toISOString();
		params.lastOccurredEnd = end.toISOString();
	}

	$('.busy').show();
	$('.content').show();
	$('.progress').show();

	var results = {};
	fetchedDetails = {};
	var outstanding = 0;
	getSummaries(crashOrException, token, params, appSelectors, function(err, summaries) {
		if (err) {
			$('.busy').hide();
			$('.progress').hide();
			alert('failed to get summaries: \n' + JSON.stringify(err, null, '  '));
		} else {
			if ( summaries[responseAppID].length === 0 ) {
				$('.busy').hide();
				$('.progress').hide();
				$('#pie').hide();
				$('#table').hide();
				$('#message').html('<h1>No ' + crashOrException + ' groups matched the search criteria. Please try broadening your search.</h1>')
				$('#message').show();
			} else if ( (summaries[responseAppID].length > 100) && ! wantLots ) {
				$('.busy').hide();
				$('.progress').hide();
				$('#pie').hide();
				$('#table').hide();
				$('#message').html('<h1>There are ' + summaries[responseAppID].length + ' ' + crashOrException + ' groups matching the search criteria. This could take a long time! Please consider narrowing your search.</h1>');
				$('#message').append('<button id="do-it-anyway">Nah, do it anyway!</button>');
				$('#do-it-anyway').click(function() {
					getData(crashOrException, appID, true);
				});
				$('#message').show();		
				return;		
			}
			$('.progress').progressbar({
				max: summaries[responseAppID].length
			});
			summaries[responseAppID].forEach(function(summary) {
				outstanding++;
				getDetails(crashOrException, token, summary.hash, function(err, details) {
					if (err) {
						console.log('Failed to get details for hash ' + summary.hash);
					} else if ( details && details.diagnostics && details.diagnostics.discrete_diagnostic_data ) {
						fetchedDetails[summary.hash] = details;
						if ( details.diagnostics.discrete_diagnostic_data.platform ) {
							modelsData = details.diagnostics.discrete_diagnostic_data.platform;
						} else if ( details.diagnostics.discrete_diagnostic_data.model ) {
							modelsData = details.diagnostics.discrete_diagnostic_data.model;
						} else {
							console.log('hash ' + summary.hash + ' has diagnostics but no model diagnostics');
						}
						modelsData.forEach(function(modelArray) {
							var model = modelArray[0];
							var count = modelArray[1];
							if ( ! results[model] ) {
								results[model] = { count: 0, crashes: [] };
							}
							results[model].count += count;
							results[model].crashes.push({ hash: summary.hash, count: count})
						});
					} else {
						console.log('hash ' + summary.hash + ' has no discrete_diagnostic_data');
					}
					outstanding--;
					$('.progress').progressbar('option', 'value', summaries[responseAppID].length - outstanding);
					if ( outstanding == 0 ) {
						$('.busy').hide();
						$('.progress').hide();
						resultsArr = [];
						for ( result in results ) {
							var resultElem = results[result];
							resultElem.device = result;
							resultsArr.push(resultElem);
						}
						resultsArr.sort(function(a, b) {
							return(b.count - a.count);
						});
						showResults($('#view-select').val());
						makePie(crashOrException, resultsArr);
						makeTable(crashOrException, resultsArr);
					}
				});
			});
		}
	});
}

var showResults = function(tableOrPie) {
	$('.content').show();
	$('#message').hide();
	if ( tableOrPie === 'pie' ) {
		$('#table').hide();
		$('#pie').show();
		makePie($('#crashOrException-select').val(), resultsArr);
	} else if ( tableOrPie === 'table' ) {
		$('#pie').hide();
		$('#table').show();		
	}
}

var makePie = function(crashOrException, resultsArr) {
	var seriesDict = {
		name: "Devices",
		colorByPoint: true,
		data: []
	};
	
	var series = [];
	var drilldownSeries = [];

	resultsArr.forEach(function(result) {
		var device = result.device;
		var count = result.count;
		var crashes = result.crashes;

		seriesDict.data.push({
			name: device,
			y: count,
			groups: crashes.length,
			drilldown: device
		});
		
		var drilldown = {
			name: device,
			id: device,
			data: []
		};

		crashes.sort(function(a, b) {
			return(b.count - a.count);
		});

		crashes.forEach(function(crash) {
			drilldown.data.push({
				name: fetchedDetails[crash.hash].name,
				reason: fetchedDetails[crash.hash].reason,
				y: crash.count,
				hash: crash.hash,
				uri: '/developers/' + crashOrException + '-details/' + crash.hash,
				firstOccurred: new Date(fetchedDetails[crash.hash].firstOccurred).toLocaleString(),
				lastOccurred: new Date(fetchedDetails[crash.hash].lastOccurred).toLocaleString(),
				events: {
            		click: function() {
            			window.open(this.uri);			            		
            		}
				}
			});
		});
		drilldownSeries.push(drilldown);
	});

	series.push(seriesDict);

	$('#pie').highcharts({
		chart: {
			type: 'pie',
	        events: {
         		drilldown: function(e) {
         			this.setTitle({text: crashOrException.charAt(0).toUpperCase() + crashOrException.slice(1) + ' breakdown for ' + e.point.name},
         				{text: 'Click a slice to view the ' + crashOrException + ' in Crittercism'});
         		},
         		drillup: function(e) {
     				this.setTitle({text: crashOrException.charAt(0).toUpperCase() + crashOrException.slice(1) + ' breakdown by device'},
     					{text: 'Click a slice to view ' + crashOrException + ' breakdown for that device'});
         		}
	        }
		},
		title: {
			text: crashOrException.charAt(0).toUpperCase() + crashOrException.slice(1) + ' breakdown by device'
		},
		subtitle: {
			text: 'Click a slice to view ' + crashOrException + ' breakdown for that device'
		},
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    format: '{point.name}: {point.y}'
                }
            }
        },
        tooltip: {
	        formatter: function() {
		        if ( this.series.name === 'Devices' ) {
			        return('<b>' + this.point.name + ': ' + this.point.y + '</b> occurrences in <b>' + this.point.groups + 
			        		'</b> groups in the past <b>30</b> days<br/>');
		        } else {
			        return('Name: <b>' + this.point.name + '</b><br/>' + 
			        		'Reason: <b>' + this.point.reason + '</b><br/>' + 
			        		'<b>' + this.point.y + '</b> ' + 'occurrences on <b>' + this.series.name + '</b> in the past <b>30</b> days<br/>' +
			        		'First Occurred: <b>' + this.point.firstOccurred + '</b><br/>' +
			        		'Last Occurred: <b>' + this.point.lastOccurred + '</b><br/>' +
			        		'Click to view in Crittercism<br/>');
		        }
	        }
        },
        series: series,
        drilldown: {
	        series: drilldownSeries
        }
	});
}

var makeTable = function(crashOrException, resultsArr) {
	$('#table').html('');
	$('#table').append($('<p class="search-header"><a href="#" class="export">Export to CSV</a></p>'));
	$(".export").on('click', function (event) {
	    exportTableToCSV.apply(this, [$('#table>table'), 'export.csv']);
	});
	$('#table').append($('<table class="results-table" id="exportTable"></table>'));
	$('#exportTable').append('<tr>'
		+ '<td>Device</td>'
		+ '<td>Name</td>'
		+ '<td>Reason</td>'
		+ '<td>First Occurred</td>'
		+ '<td>Last Occurred</td>'
		+ '<td>Count for Device</td>'
		+ '<td>URL</td>'
		+ '</tr>');

	resultsArr.forEach(function(result) {
		var device = result.device;
		var crashes = result.crashes;

		crashes.sort(function(a, b) {
			return(b.count - a.count);
		});

		crashes.forEach(function(crash) {
			$('#exportTable').append('<tr>'
				+ '<td>' + device + '</td>'
				+ '<td>' + fetchedDetails[crash.hash].name + '</td>'
				+ '<td>' + fetchedDetails[crash.hash].reason + '</td>'
				+ '<td>' + new Date(fetchedDetails[crash.hash].firstOccurred).toLocaleString() + '</td>'
				+ '<td>' + new Date(fetchedDetails[crash.hash].lastOccurred).toLocaleString() + '</td>'
				+ '<td>' + crash.count + '</td>'
				+ '<td>' + 'https://app.crittercism.com/developers/' + crashOrException + '-details/' + crash.hash + '</td>'
				+ '</tr>');
		});
	});
	
	$('#exportTable').append('</table>');
}

var exportTableToCSV = function($table, filename) {

    var $rows = $table.find('tr:has(td)'),

        // Temporary delimiter characters unlikely to be typed by keyboard
        // This is to avoid accidentally splitting the actual contents
        tmpColDelim = String.fromCharCode(11), // vertical tab character
        tmpRowDelim = String.fromCharCode(0), // null character

        // actual delimiter characters for CSV format
        colDelim = '","',
        rowDelim = '"\r\n"',

        // Grab text from table into CSV formatted string
        csv = '"' + $rows.map(function (i, row) {
            var $row = $(row),
                $cols = $row.find('td');

            return $cols.map(function (j, col) {
                var $col = $(col),
                    text = $col.text();

                return text.replace(/"/g, '""'); // escape double quotes

            }).get().join(tmpColDelim);

        }).get().join(tmpRowDelim)
            .split(tmpRowDelim).join(rowDelim)
            .split(tmpColDelim).join(colDelim) + '"',

        // Data URI
        csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);

    $(this)
        .attr({
        'download': filename,
            'href': csvData,
            'target': '_blank'
    });
}

var main = function() {

	$('#takeLogin').click(takeLogin);
	$('#takeToken').click(takeToken);

	$("#clientID").val(localStorage.getItem("clientID"));
	$("#user").val(localStorage.getItem("user"));

	token = sessionStorage.getItem("token");
	if ( token ) {
		$('.busy').show();

		listApps(token, function(err, data) {
			$('.busy').hide();
			if (err) {
				alert('failed!\n' + JSON.stringify(err, null, '  '));
			} else {
				apps = data;
				populateAppsMenu();
				$('.content').show();
			}
		});
	} else {
		$('.login').show();
	}
}

$(document).ready(main);