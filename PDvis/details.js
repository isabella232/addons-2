function showDetails(data, since, until, day, hour) {

	var headline = "Incidents occurring";
	if ( hour > -1 ) { headline += " in the " + hourNumberToString(hour, true) + " hour"; }
	if ( day > -1 ) { headline += " on " + dayNumberToString(day, true) + "s"; }
	headline += " between " + moment(since).format("LLLL") + " and " + moment(until).format("LLLL");
	
	$('#result').html('<h3>' + headline + '</h3>');
	$('#result').append($('<table/>', {
		id: "result-table"
	}));

	var tableData = [];
	Object.keys(data).forEach(function(incidentID) {
		var incident = data[incidentID];
		tableData.push(
			[
				'<a href="' + incident.html_url + '" target="blank">' + incident.incident_number + '</a>',
				(new Date(incident.created_at)).toLocaleString(),
				incident.status,
				incident.service.summary,
				incident.summary
			]
		);
	});
	$('#result-table').DataTable({
		data: tableData,
		columns: [
			{ title: "#" },
			{ title: "Created at" },
			{ title: "Status" },
			{ title: "Service Name" },
			{ title: "Summary" }
		]
	});
	$('.busy').hide();

}

function main() {
	var until = new Date(getParameterByName('until'));
	var since = new Date(getParameterByName('since'));
	var hour = getParameterByName('hour');
	var day = getParameterByName('day');
	
	if ( moment(until).isAfter(moment()) ) {
		until = new Date();
		console.log("until is in the future");
	}
	
	since.setHours(0,0,0,0);
	until.setHours(23,59,59,999);

	if ( day == null ) {
		day = -1;
	}
	
	if ( hour == null ) {
		hour = -1;
	}

	$('.busy').show();

	fetchIncidents(since, until, function(data) {
		showDetails(data, since, until, day, hour);
	});
}

$(document).ready(main);
