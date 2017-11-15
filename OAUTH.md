Addons can now use PagerDuty's OAuth service to authenticate users and get API tokens. PagerDuty uses the [OAuth2 Implicit Grant Flow](https://www.quora.com/How-does-OAuth-2-0-work/answer/Miguel-Paraz) for authentication.

The PDvis addon gives an [example](https://github.com/PagerDuty/addons/pull/23) of how to add OAuth2 to your addon. Here's how the OAuth flow works from a high-level:
1. Your addon requests an OAuth token by redirecting the user to PagerDuty's OAuth service (http://app.pagerduty.com/oauth/authorize) and supplying your app's `client_id`, `redirect_uri` and `state`. The user will then Authorize the addon. See [`requestOAuthToken`](https://github.com/PagerDuty/addons/pull/23/files#diff-073f48c76203d07dc39b9549aa405ff4R45).
2. PagerDuty's OAuth service will then redirect the user back to your addon which will receive the generated OAuth `token` and `state` as hash parameters. Your addon must verify the `state` received from PagerDuty's OAuth service matches the state your addon sent in 1. Then it will store the `token` and use it to make API requests. See [`receiveOAuthToken`](https://github.com/PagerDuty/addons/pull/23/files#diff-073f48c76203d07dc39b9549aa405ff4R66).

See [`main`](https://github.com/PagerDuty/addons/pull/23/files#diff-d4165290cddbf3212be36d99822dd88aR828) for an example of the flow from steps 1 and 2. When the addon is loaded, first it checks to see if a token already exists. If no token exists, it will check if the page is being loaded normally by a user trying to access the addon or if it's being loaded by a redirect
from PagerDuty's OAuth service (step 2 above). If it's a normal page load, the addon starts the OAuth flow to request an OAuth token. If it's a redirect from PagerDuty's OAuth service, the addon receives the OAuth token and stores it so it can be used in API requests.

Some notes:
* If your addon gets an error with an API request about having a bad token, you can try to generate the token again by going back to step 1 from above. See [`PDRequest`](https://github.com/PagerDuty/addons/pull/23/files#diff-073f48c76203d07dc39b9549aa405ff4R104).
* The `Authorization` header used in API requests is slightly different from before. See [`PDRequest`](https://github.com/PagerDuty/addons/pull/23/files#diff-073f48c76203d07dc39b9549aa405ff4R86)
