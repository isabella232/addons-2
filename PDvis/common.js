function getParameterByName(name, source) {
    if (typeof source === 'undefined') {
      source = location.search;
    }
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(source);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getParametersByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var matches = [];
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)", "g");
    var match = regex.exec(location.search);
    while (match != null) {
	    matches.push(match[1]);
	    match = regex.exec(location.search);
    }
    if ( matches.length < 1 ) {
	    return null;
    }

    return matches.map(function(match) {
	    return decodeURIComponent(match.replace(/\+/g, " "));
    });
}

function requestOAuthToken() {
  var client_state = "xyzABC123";
  window.localStorage.setItem('pdvisClientState', client_state);
  var client_id = "b5236b4b54e5ec7b2b51cccc603174a2ac0b575f33753e04a2924dced669c03b";
  var redirect_uri = "http://localhost:8000";
  var oauth_route = "http://app.pagerduty.net/oauth/authorize?client_id=" + client_id + "&redirect_uri=" + redirect_uri + "&response_type=token&state=" + client_state;
  window.location.href = oauth_route;
}

function getOAuthResponseParams() {
  var oauth_params = [];
	var hash = window.location.hash.replace(/^#/, '?');
	var param_token = getParameterByName('access_token', hash);
  if (param_token) oauth_params.push(param_token);
	var param_state = getParameterByName('state', hash);
  if (param_state) oauth_params.push(param_state);
  return oauth_params;
}

function receiveOAuthToken(oauthParams) {
  var param_token = oauthParams[0];
  var param_state = oauthParams[1];
  var client_state = window.localStorage.getItem('pdvisClientState');
  if (param_state != client_state) {
    alert("ERROR: OAuth failed due to bad state. Can't access PagerDuty API without OAuth");
    return;
  }
  window.localStorage.setItem('pdvisOAuthToken', param_token);
}

function getToken() {
  return window.localStorage.getItem('pdvisOAuthToken');
}

function PDRequest(token, endpoint, method, options) {

	var merged = $.extend(true, {}, {
		type: method,
		dataType: "json",
		url: "http://api.pagerduty.net/" + endpoint,
		headers: {
			"Authorization": "Bearer " + token,
			"Accept": "application/vnd.pagerduty+json;version=2"
		},
		error: function(err, textStatus) {
			$('.busy').hide();
			var alertStr = "Error '" + err.status + " - " + err.statusText + "' while attempting " + method + " request to '" + endpoint + "'";
			try {
				alertStr += ": " + err.responseJSON.error.message;
			} catch (e) {
				alertStr += ".";
			}

			try {
				alertStr += "\n\n" + err.responseJSON.error.errors.join("\n");
			} catch (e) {}

			console.log(alertStr);

      console.log("Attempting to get new OAuth token");
      window.localStorage.removeItem('pdvisOAuthToken');
      requestOAuthToken();
		}
	},
	options);

	$.ajax(merged);
}

function hourNumberToString(n, long) {
	var m = (n > 12) ? "p" : "a";
	var h = (n % 12 == 0) ? 12 : n % 12;

	if (long) { return h + ":00" + m + "m"; }
	else { return h + m }
}

function dayNumberToString(n, long) {
	var dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

	if (long) { return dayNames[n]; }
	else { return dayNamesShort[n]; }
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
						PDRequest(getToken(), endpoint, "GET", options);
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
	PDRequest(getToken(), endpoint, "GET", options);
}

function fetchLogEntries(since, until, callback, progressCallback) {
	var params = {
		since: since.toISOString(),
		until: until.toISOString(),
		is_overview: false
	}
	fetch('log_entries', params, callback, progressCallback);
}

function fetchIncidents(since, until, callback, progressCallback) {
	var params = {
		since: since.toISOString(),
		until: until.toISOString(),
		'statuses[]': 'resolved'
	}
	fetch('incidents', params, callback, progressCallback);
}
