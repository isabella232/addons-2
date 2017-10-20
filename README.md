# PagerDuty community Add-ons

This is a public repository of add-ons to PagerDuty that have been written by our customers or partners. 

## What's here?

Brief descriptions of some of the projects you will find here:

| Project | Description |
|-----|-----|
| account_overview | Display a graphical overview of the connections between users, schedules, and services in your account |
| hello_world | Sample add-on with a touch of the '90s |
| incident_density | Identify trends around when incidents are being created in your account (note: obsoleted by PDvis) |
| lmgtfy | Web search results in an add-on |
| OkCats | Trigger incidents with cat pictures |
| on_call_hero | A game to demonstrate the trials and tribulations of the unsung on-call heroes |
| PDcal | Make a public web view of a PagerDuty on-call schedule, given the URL of the iCal download found in the export menu. Includes a handy bookmarklet! |
| PDmaintenance | Quickly pause and unpause many services |
| PDoncall | See who's on call for any of your services, without logging in to PagerDuty |
| PDpriority | See a report of incidents within a time range filtered by priority |
| PDtool | PagerDuty multi-tool - View the raw JSON of integrations found in your account, trigger some pre-canned events, view/ack/resolve open incidents, view/export/edit users, and view/add/delete add-ons. |
| PDvis | Show some useful visualizations of PagerDuty activity over time. |
| schedule_conflict_detector | Display users with conflicting on-call shifts from two or more schedules |
| statusbot | Monitor the status of any services available on the Statusbot API |
| user_not_oncall | See which users in your PagerDuty account are never listed as being on-call in any of your schedules or escalation policies |
| user-export | Deprecated. Use PDtool instead |

## Contributing to this repo:
If you've built something on top of PagerDuty's API that we can display in an iframe, please share it with us at developers@pagerduty.com:

* Each add-on should have its own directory with its own README that explains what it does & how to build a valid URL for your add-on
* You must use the v2 API. Please see additional resources here: https://v2.developer.pagerduty.com/v2/page/api-reference#!/Add-ons/get_addons
* Submit a PR

## How do I install an add-on?
Please see the following Support documentation for details on how to install an add-on via our API: https://support.pagerduty.com/docs/extensions-and-add-ons
