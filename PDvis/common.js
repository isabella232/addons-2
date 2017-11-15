function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getHashParameterByName(name, isHash) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\#&]" + name + "=([^&#]*)"),
        results = regex.exec(location.hash);
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

function generateRandomState(length) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';

  for (var i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;

}

function requestOAuthToken() {
  var state = generateRandomState(16);
  window.localStorage.setItem('pdvisClientState', state);
  var clientId = "b5236b4b54e5ec7b2b51cccc603174a2ac0b575f33753e04a2924dced669c03b";
  var redirectUri = "https://pagerduty.github.io/addons/PDvis/index.html";
  var oauthRoute = "http://app.pagerduty.com/oauth/authorize?client_id=" + clientId + "&redirect_uri=" + redirectUri + "&response_type=token&state=" + state;
  window.location.href = oauthRoute;
}

function getOAuthResponseParams() {
  var oauthParams = {};
  var token = getHashParameterByName('access_token');
  if (token) oauthParams.token = token;
  var state = getHashParameterByName('state');
  if (state) oauthParams.state = state;

  window.location.hash = '';

  return oauthParams;
}

function receiveOAuthToken(oauthParams) {
  var state = window.localStorage.getItem('pdvisClientState');
  if (oauthParams.state !== state) {
    alert("ERROR: OAuth failed due to bad state. Can't access PagerDuty API without OAuth");
    return;
  }
  window.localStorage.setItem('pdvisOAuthToken', oauthParams.token);
}

function removeOAuthToken() {
  window.localStorage.removeItem('pdvisOAuthToken');
  window.localStorage.removeItem('pdvisClientState');
}

function getToken() {
  return window.localStorage.getItem('pdvisOAuthToken');
}

function PDRequest(token, endpoint, method, options) {

	var merged = $.extend(true, {}, {
		type: method,
		dataType: "json",
		url: "https://api.pagerduty.com/" + endpoint,
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
			removeOAuthToken();
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
