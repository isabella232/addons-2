# Schedule Conflict Detector

Display users with conflicting on-call shifts from two or more schedules

## Usage

Create an add-on within PagerDuty with the following URL. Please note that you must update `ENTER_SUBDOMAIN_HERE` to your account's subdomain and `ENTER_API_KEY_HERE` to a v1 PagerDuty API key:

```
https://pagerduty.github.io/addons/schedule_conflict_detector/public/index.html?subdomain=ENTER_SUBDOMAIN_HERE&apiKey=ENTER_API_KEY_HERE
```

## Local Installation

In the project directory, first install dependencies and build:

```
$ npm install && gulp build
```

Then navigate to `index.html` in your friendly local browser. Note that it expects the `subdomain` and `apiKey` to be passed as get params in the URL.

i.e.:

```
somehost.com/public/index.html?subdomain=ENTER_SUBDOMAIN_HERE&apiKey=ENTER_API_KEY_HERE
```
