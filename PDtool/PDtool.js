var services;

function PDRequest(endpoint, method, options) {

	var token = localStorage.getItem("token");

	var merged = $.extend(true, {}, {
		type: method,
		dataType: "json",
		url: "https://api.pagerduty.com/" + endpoint,
		headers: {
			"Authorization": "Token token=" + token,
			"Accept": "application/vnd.pagerduty+json;version=2"
		},
		error: function(err) {
			$('.busy').hide();
			alert('Error ' + err.status + ': ' + err.statusText + ' - please check the values in the Authentication tab.');
		}
	},
	options);

	$.ajax(merged);
}

function PDEvent(options) {
	
	var token = localStorage.getItem("token");
	$.ajax($.extend({}, {
		type: "POST",
		dataType: "json",
		url: "https://events.pagerduty.com/generic/2010-04-15/create_event.json",
	},
	options));

}

function populateIntegrationsMenu() {
	$('#integrations-integration-select').html('');
	services[$('#integrations-service-select').val()].integrations.forEach(function(integration) {
		$('#integrations-integration-select').append($('<option/>', {
			value: integration.id,
			text: integration.summary
		}));
	});
	populateIntegrationsResult();
}

function populateIntegrationsResult() {
	$('#integrations-result').html('');
	var serviceID = $('#integrations-service-select').val();
	var integrationID = $('#integrations-integration-select').val();
	var options = {
		success: function(data) {
			$('#integrations-result').JSONView(data);
		}
	}
	PDRequest("/services/" + serviceID + "/integrations/" + integrationID, "GET", options);
}

// find all the generic API integrations, then get the integration keys from those
function populateTriggerSelect(data) {
	var integrationIDs = [];
	async.series([
		function(callback) {
			data.services.forEach(function(service) {
				service.integrations.forEach(function(integration) {
					if ( integration.type == "generic_events_api_inbound_integration_reference" ) {
						integrationIDs.push([service.id, integration.id]);
					}
				});
			});
			callback(null, integrationIDs);
		},
		
		function(callback) {
			var infoFns = [];
			integrationIDs.forEach(function(integrationID) {
				infoFns.push(function(callback) {
					var options = {
						success: function(integrationInfo) {
							callback(null, integrationInfo);
						}
					}
					PDRequest("services/" + integrationID[0] + "/integrations/" + integrationID[1], "GET", options);
				});
			});
			async.parallel(infoFns, 
				function(err, results) {
					results.forEach(function(result) {
						$('#trigger-dest-select').append($('<option/>', {
							value: result.integration.integration_key,
							text: result.integration.service.summary + ": " + result.integration.name
						}));
					})
					$('.busy').hide();
			});
		}
	]);
}

function populateIncidentsResult() {
	$('#incidents-result').html('');
	$('#incidents-result').append($('<table/>', {
		id: "incidents-result-table"
	}));
	
	$('#incidents-result-table').on('click', 'td button.resolve-button', function() {
		var incidentID = $(this).attr('id');
		var requestData = {
				incident: {
					type: "incident",
					status: "resolved",
					resolution: "PDtool"					}
			};

		var options = {
			headers: { "From": localStorage.getItem("userid") },
			data: requestData,
			success: function(data) {
				populateIncidentsResult();
			}
		}
		PDRequest("incidents/" + incidentID, "PUT", options);

	});
	
	$('#incidents-result-table').on('click', 'td button.ack-button', function() {
		var incidentID = $(this).attr('id');
		var requestData = {
				incident: {
					type: "incident",
					status: "acknowledged",
					resolution: "PDtool"					}
			};

		var options = {
			headers: { "From": localStorage.getItem("userid") },
			data: requestData,
			success: function(data) {
				populateIncidentsResult();
			}
		}
		PDRequest("incidents/" + incidentID, "PUT", options);

	});
	
	var options = {
		success: function(data) {
			var tableData = [];
			data.incidents.forEach(function(incident) {
				var actionButtons = '<button class="btn btn-sm resolve-button" id="' + incident.id + '">Resolve</button>';
				if ( incident.status == "triggered" ) {
					actionButtons += ' <button class="btn btn-sm ack-button" id="' + incident.id + '">Ack</button>';
				}
				tableData.push(
					[
						'<a href="' + incident.html_url + '" target="blank">' + incident.incident_number + '</a>',
						(new Date(incident.created_at)).toLocaleString(),
						incident.status,
						incident.service.summary,
						incident.summary,
						actionButtons
						
					]
				);
			});
			$('#incidents-result-table').DataTable({
				data: tableData,
				columns: [
					{ title: "#" },
					{ title: "Created at" },
					{ title: "Status" },
					{ title: "Service Name" },
					{ title: "Summary" },
					{ title: "Actions" }
				]
			});
		},
		data: {
			"statuses[]": ["triggered","acknowledged"]
		}
	}
	PDRequest("incidents", "GET", options);
}

function main() {

	// prepopulate token field if it's been saved
	$("#token").val(localStorage.getItem("token"));
	$("#userid").val(localStorage.getItem("userid"));
	
	// silently save the token if the user types something in
	$('#token').change(function() {
		localStorage.setItem('token', $('#token').val());
	});
	$('#userid').change(function() {
		localStorage.setItem('userid', $('#userid').val());
	});

	// when you change the service select, show the integrations for the selected service
	$('#integrations-service-select').change(function() {
		populateIntegrationsMenu();
	});
	
	// when you change the selected integration, get the details of the selected integration
	$('#integrations-integration-select').change(function() {
		populateIntegrationsResult();
	});

	//show integrations page
	$('#integrations-button').click(function() {
		$('.detail').hide();
		$('#integrations').show();
		
		var options = {
			success: function(data) {
				$('#integrations-service-select').html('');
				services = {};
				data.services.forEach(function(service) {
					services[service.id] = service;
					$('#integrations-service-select').append($('<option/>', {
						value: service.id,
						text: service.name
					}));
				});
				populateIntegrationsMenu();
				populateIntegrationsResult();
			}
		};
		PDRequest("services", "GET", options);

	});
	
	// show trigger page
	$('#trigger-button').click(function() {
		$('.detail').hide();
		$('#trigger').show();
		$('.busy').show();
		$('#trigger-dest-select').html('');
		var options = {
			success: function(data) {
				populateTriggerSelect(data);
			}
		};
		$('.busy').show();
		PDRequest("services", "GET", options);
	});
	
	$('#incidents-button').click(function() {
		$('.detail').hide();
		$('#incidents').show();
		populateIncidentsResult();
	});

	$('#auth-button').click(function() {
		$('.detail').hide();
		$('#auth').show();
		populateIncidentsResult();
	});
	
	// send trigger button
	$('#trigger-send-button').click(function() {
		var eventData = $.extend(PDtoolevents[$('#trigger-event-select').val()], { "service_key": $('#trigger-dest-select').val() });
		var options = {
			success: function() {
				$('#trigger-result').append($('#trigger-event-select').val() + " event sent to " + 
								$("#trigger-dest-select option:selected").text() + "<br>");
			},
			data: JSON.stringify(eventData)
		}
		PDEvent(options);
	});
	
	// put pre-canned events into the select in the trigger page
	var keys = Object.keys(PDtoolevents);
	keys.sort();
	keys.forEach(function(event) {
		$('#trigger-event-select').append($('<option/>', {
			value: event,
			text: event
		}));
	});
}

$(document).ready(main);