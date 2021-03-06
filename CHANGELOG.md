| Version                          | Type         | Description                                                       |
| -------------------------------- | -------------| ----------------------------------------------------------------- |
| **v1.20.1**                      | *Feature*    | Added title to strategies model and implemented rh user auth cookie |
| **v1.20.0**                      | *Feature*    | Robinhood account disconnect route                                |
| **v1.19.0**                      | *Feature*    | Preferences routes for creating updating and fetching             |
| **v1.18.1**                      | *Fix*        | Fixed bug in loggedIn utils check so it returns a valid session if successful |
| **v1.18.0**                      | *Feature*    | Strategies table and api endpoint for getting and saving new strategies |
| **v1.17.2**                      | *Update*     | Updated user check route to also check for valid robinhood token  |
| **v1.17.1**                      | *Fix*        | Fixed api key checker from issuing multiple responses and other misc bug fixes |
| **v1.17.0**                      | *Feature*    | Groundwire tokenize route to handle robinhood auth token for front end |
| **v1.16.0**                      | *Feature*    | Groundiwre user authentication check and logout routes            |
| **v1.15.4**                      | *Update*     | Configured cors to allow specific request origin and added origin domains to config |
| **v1.15.3**                      | *Update*     | Improved login service and introduced memory store for user sessions |
| **v1.15.2**                      | *Feature*    | Passport user login route with DB integration |
| **v1.15.1**                      | *Feature*    | Implemented user db master switch to prevent db connection errors when no db exists |
| **v1.15.0**                      | *Feature*    | Passport user registration route with postgres integration        |
| **v1.14.0**                      | *Feature*    | Postgres database integration and initial create user api route   |
| **v1.13.2**                      | *Feature*    | Subscriber service awareness of client price tracking including current stop |
| **v1.13.1**                      | *Feature*    | Updated queue route to look for `placed` orders as well as `queued` orders |
| **v1.13.0**                      | *Feature*    | Added a subscriber 'boot' method that kicks out socket clients forcefully by id |
| **v1.12.0**                      | *Feature*    | Upgraded the simulator and fixed Yahoo price fetches for simulation |
| **v1.11.1**                      | *Feature*    | Upgraded Robinhood API wrapper dependency to 1.1.1 for recent order functionality |
| **v1.11.0**                      | *Feature*    | Added recent orders method to fetch only orders newer than specified date and for specific instrument |
| **v1.10.2**                      | *Feature*    | Upgraded Robinhood API wrapper dependency to 1.1.0 for logout functionality |
| **v1.10.1**                      | *Fix*        | Guarding against undefined cursor URLs from orders fetching |
| **v1.10.0**                      | *Feature*    | Added support for /logout route that forcefully expires an authenticated RH token |
| **v1.9.0**                       | *Feature*    | Added logging service and robust logging for essential api routes and controllers |
| **v1.8.0**                       | *Feature*    | Added api route to send currently connected list of socket subscribers |
| **v1.7.1**                       | *Update*     | Updated Token authentication to use the Bearer standard           |
| **v1.7.0**                       | *Feature*    | Upgrade Robinhood API wrapper to version 1.0.0 and support RH auth token authentication |
| **v1.6.2**                       | *Feature*    | Added a route to find all filled orders by instrumentId           |
| **v1.6.1**                       | *Feature*    | Ability to get market holiday schedule for the current year (data provided by [tradingeconomics.com](https://tradingeconomics.com)) |
| **v1.6.0**                       | *Feature*    | Implemented GitLab continuous integration build deployment system |
| **v1.5.0**                       | *Feature*    | Added ability to store multiple user sessions to avoid having to refresh an auth token with each API call |
| **v1.4.8**                       | *Fix*        | Optimized the trading route to make less calls to the instrument endpoint.  May be causing failures on the position creation in the trading app |
| **v1.4.7**                       | *Fix*        | Upgraded robinhood.js node lib to 0.10.0 to fix some instability in url instrument queries |
| **v1.4.6**                       | *Feature*    | Supporting the "min tick" NYSE pilot for rounding price to specified increments on market orders |
| **v1.4.5**                       | *Fix*        | Fixed a bug where the price being sent to the market buy order was sub-penny fractional. |
| **v1.4.4**                       | *Feature*    | Moved the production api to `api.groundwire.co` and changed service root to `/v1/` for versioning |
| **v1.4.3**                       | *Fix*        | Fixed a bug with the simulator that was duplicating price action and not allowing for multiple sockets tracking simultaneously |
| **v1.4.2**                       | *Fix*        | Fixed a bug where the iterator was throwing an error if not in simulate mode |
| **v1.4.1**                       | *Feature*    | Improved simulation capability including reading statisical parameters of the simulation from config. |
|                                  | *Fix*        | Fixed a bug where simulation intervals were kept around after the client disconnects thus causing a build up of price simulation intervals. |
| **v1.4.0**                       | *Feature*    | Added a simulation engine that mocks bid, ask and last prices and behaves like a real stock ticker.  Uses the inverse cumulative normal distribution model for randomizing the price action |
| **v1.3.0**                       | *Feature*    | Added an instrument lookup endpoint that gets an instrument by either instrument id or ticker symbol |
| **v1.2.1**                       | *Fix*        | Fixed error handling on instrument fetching |
| **v1.2.0**                       | *Feature*    | Added price quote websocket powered by Intrinio Realtime-Exchange data |
| **v1.1.5**                       | *Feature*    | Added ability to make market sell orders that trigger immediately, to see market sell order in the queue and to cancel a market sell order |
| **v1.1.0**                       | *Feature*    | Improved performance of cancel call and added a new queue method to get single pending stop sell for an instrumentId |
| **v1.0.5**                       | *Feature*    | Allow for multiple users to authenticate to Robinhood using basic HTTP header authorization |
| **v1.0.0**                       | *Feature*    | First major version of the api application includes methods for getting positions, buying positions, setting stops and cancelling orders |
