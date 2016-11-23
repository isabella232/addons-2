# PDtool

This is a standalone tool that can view the raw JSON of integrations found in your account, trigger some pre-canned events, and view/ack/resolve open incidents.

## How to use

* index.html is standalone - enter a v2 API token and a valid PagedDuty login ID (an email address) on the Authentication tab and the rest of the tabs will start working.
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