var token;

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function PDRequest(token, endpoint, method, options) {

	var merged = $.extend(true, {}, {
		type: method,
		dataType: "json",
		url: "https://api.pagerduty.com/" + endpoint,
		headers: {
			"Authorization": "Token token=" + token,
			"Accept": "application/vnd.pagerduty+json;version=2"
		},
		error: function(err) {
			var alertStr = "Error '" + err.status + " - " + err.statusText + "' while attempting " + method + " request to '" + endpoint + "'";
			try {
				alertStr += ": " + err.responseJSON.error.message;
			} catch (e) {
				alertStr += ".";
			}
			
			try {
				alertStr += "\n\n" + err.responseJSON.error.errors.join("\n");
			} catch (e) {}

			alert(alertStr);
		}
	},
	options);

	$.ajax(merged);
}

function fetch(endpoint, params, callback, progressCallback) {
	var limit = 100;
	var infoFns = [];
	var fetchedData = [];

	var commonParams = {
			total: true,
			limit: limit
	};

	var getParams = $.extend(true, {}, params, commonParams);

	var options = {
		data: getParams,
		success: function(data) {
			var total = data.total;
			Array.prototype.push.apply(fetchedData, data[endpoint]);

			if ( data.more == true ) {
				var indexes = [];
				for ( i = limit; i < total; i += limit ) {
					indexes.push(Number(i));
				}
				indexes.forEach(function(i) {
					var offset = i;
					infoFns.push(function(callback) {
						var options = {
							data: $.extend(true, { offset: offset }, getParams),
							success: function(data) {
								Array.prototype.push.apply(fetchedData, data[endpoint]);
								if (progressCallback) {
									progressCallback(data.total, fetchedData.length);
								}
								callback(null, data);
							}
						}
						PDRequest(getParameterByName('token'), endpoint, "GET", options);
					});
				});

				async.parallel(infoFns, function(err, results) {
					callback(fetchedData);
				});
			} else {
				callback(fetchedData);
			}
		}
	}
	PDRequest(getParameterByName('token'), endpoint, "GET", options);
}

function fetchServices(callback) {
	fetch("services", null, callback);
}

function main() {
	token = getParameterByName('token');
	$('#result').html('');
	
	$('.busy').show();
	fetchServices(function(services) {
		var htmlStr = '';
		services.forEach(function(service) {
			htmlStr += '<div><input type="checkbox" value="' + service.summary + '" id="' + service.id + '"' + (service.status == 'disabled' ? '' : ' checked') + '>';
			htmlStr += '<label for="' + service.id + '">' + service.summary + '</label></div>';
		});
		$('#service-list').html(htmlStr);

		$(':checkbox').change(function() {
			var name = this.value;
			if ( $(this).prop('checked') ) {
				var params = {
					data: {
						service: {
							status: "active"
						}
					},
					success: function() {
						$('#result').append('Service ' + name + ' was enabled<br>\n');
					}
				};
				PDRequest(getParameterByName('token'), 'services/' + this.id, 'put', params);
			} else {
				var params = {
					data: {
						service: {
							status: "disabled"
						}
					},
					success: function() {
						$('#result').append('Service ' + name + ' was disabled<br>\n');
					}
				};
				PDRequest(getParameterByName('token'), 'services/' + this.id, 'put', params);
			}
		});

		$('.busy').hide();
	});
}

$(document).ready(main);
