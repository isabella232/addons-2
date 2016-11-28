# PDtool

This is a standalone tool, suitable for use as a PD add-on, that can view the raw JSON of integrations found in your account, trigger some pre-canned events, view/ack/resolve open incidents, view/export users, and view/add/delete add-ons.

## How to use

* index.html is standalone - enter a v2 API token and a valid PagerDuty login ID (an email address) on the Authentication tab and the rest of the tabs will start working.
```
https://pagerduty.github.io/addons/PDtool/index.html
```
* or pass a token and user id in the URL like so:
```
https://pagerduty.github.io/addons/PDtool/index.html?token=<TOKEN>&userid=<USERID>
```
* you can also pass a features= parameter to specify which tabs to turn on or off, using a concatenation of the following:
```
a: Authentication
i: Integrations
t: Trigger Events
n: Manage Incidents
u: Export Users
d: Manage Add-Ons
```
for example, to specify only incidents, users and add-ons tab:
```
https://pagerduty.github.io/addons/PDtool/index.html?token=<TOKEN>&userid=<USERID>&features=nud
```
if you don't specify features, all tabs will be visible.