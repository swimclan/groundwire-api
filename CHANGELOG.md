| Version                          | Type         | Description                                                       |
| -------------------------------- | -------------| ----------------------------------------------------------------- |
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
