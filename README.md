# Background
This is the Ground Wire trading API.  It uses RestFUL query paradigm and returns JSON responses.  It is a simple set of services that allow the consumer to set trades in Robinhood's (RH) free online trading brokerage.  There are currently methods that enable placing market orders, placing stop sell orders, checking current positions, cancelling stop sell orders (for the purpose of moving a sell position) and other basic infomation data from RH.  These services are intended to allow consumers to build automated trading clients that can manage day/swing trades in the market automatically.

# Version
1.20.0
<br>
<em>See</em> [`CHANGELOG.md`](./CHANGELOG.md) <em>for more detailed view of all versions</em>

# API
## Service Root URI
The API's service root is at `/v1/` and will run the expressJS app on port 3000.  Currently there is support for SSL on production.

## API Methods
| URI                     | HTTP Verb  | Request Body                      | Description                                               |
| ----------------------- | ---------- | --------------------------------- | --------------------------------------------------------- |
| `/v1/`                 | GET         | None                              | Return RH account setup info for user                     |
| `/v1/user`             | GET         | None                              | Return RH user information and authenticated RH api token |
| `/v1/accounts`         | GET         | None                              | Return user's RH account(s) status(es) including account balance |
| `/v1/positions`        | GET         | None                              | Return user's current RH positions                        |
| `/v1/queue`            | GET         | None                              | Return user's pending orders                              |
| `/v1/orders/<instrumentId>` | GET         | None                         | Return user's filled orders for a specific instrumentId   |
| `/v1/orders/recent/<instrumentId>/<date>` | GET         | None           | Return user's filled orders for a specific instrumentId and newer than specified date (date is sent in ISO 8601 format)   |
| `/v1/instrument/<type>/<id>` | GET         | None                        | Get a Robinhood instrument object by sneding either a known instrument id or a ticker symbol. `type` is either `symbol` or `instrument` and `id` is either the ticker symbol or the instrument id (respectively) |
| `/v1/queue/stop/<instrumentId>`| GET         | None                              | Return user's pending stop sell order for an instrumentId |
| `/v1/queue/immediate/<instrumentId>`| GET         | None                              | Return user's pending market sell order for an instrumentId |
| `/v1/price/<ticker>`   | GET         | None                              | Return instrument price by ticker symbol                  |
| `/v1/watchlist`        | GET         | None                              | Return all instruments on the user's watchlist            |
| `/v1/trade`            | POST        | * `symbol` [optional ticker symbol]<br>* `instrumentId` [optional RH instrumentID]<br>* `quantity` [integer]<br>* `type` [buy/sell]<br>* `stop_price` [optional float] | Execute either a buy or sell trade.  Buy trades will all be market buy orders and sell trades will either be stop-loss or market sell orders depending on whether a `stop_price` value is sent in the request.  If sending a stop loss sell order you must send in a `stop_price` value. |
| `/v1/cancel`           | DELETE      | * `instrumentId` [RH instrumentID]<br>* `trigger` [stop/immediate] | Cancel any pending market (trigger `immediate`) or stop (trigger `stop`) sell order that is in the queue.  Can be used to move a stop loss position that is managed by RH. |
| `/v1/holidays`         | GET         | None                              | Returns a JSON list of all market holidays for the current year |
| `/v1/subscribers`      | GET         | None                              | Returns the current list of connected socket clients and which tickers they are subscribed to as well as what the current stop loss is set to for that ticker. |
| `/v1/subscriber`       | DELETE      | * `id` [socket client id]         | Forcefully removes a client connection to the socket by supplying a socket client id |
| `/v1/user/register`      | POST        | * `first`<br>* `last`<br>* `email`<br>* `password`<br> | Creates a user in the database for Groundwire (not Robinhood).  Hashes the password for security purposes |
| `/v1/user/login`| POST        | * `emailAddress` [string]<br>* `password` [string] | Login to GroundWire Account.  Returns 200 `OK` if successful or 401 `Unauthorized` if unsuccessful |
| `/v1/user/check`       | GET         | None                              | Session check service Returns 200 `{"authorized": true}` if valid session or  `{"authorized": false}` if invalid session |
| `/v1/user/logout`      | GET         | None                              | Destroys the session via the request cookie (logs the user out).  Route returns `{}` |
| `/v1/user/tokenize`    | GET         | None                              | Sets the Robinhood auth token in the db for Groundwire users sending Robinhood credentials to the api |
| `/v1/strategy`         | GET         | None                              | Gets the current list of active strategies for the front end app |
| `/v1/strategy`         | POST        | * `name` [string]                 | Creates a new strategy for front end consumption in preferences and sets it to active |
| `/v1/preferences`      | POST        | * `<All required preference properties>` See below for details | Creates a new preference list for the logged in user (requires login) |
| `/v1/preferences`      | GET         | None                              | Fetches the preference list for logged in user |
| `/v1/user/disconnect`  | GET         | None                              | Logs out and expires an authenticated RH auth token.  Deactivates token from DB. Renders token unusable thus requiring a new username & password login |
## Preference properties
Here is a list of all the required properties for the `/v1/preferences` POST route:

```js
  [
    'c',
    'stopMargin',
    'minStop',
    'maxSpread',
    'strategy',
    'profitLock',
    'exclusions',
    'screenerMax',
    'screenerRanges',
    'screenerFilters',
    'active'
  ]
```

## Sample API Response
Here is a sample JSON response that is returned from the GET `/api/price/<ticker>` method:
```js
{
  "ask_price": "139.1300",
  "ask_size": 500,
  "bid_price": "139.0800",
  "bid_size": 100,
  "last_trade_price": "139.1400",
  "last_extended_hours_trade_price": "139.0800",
  "previous_close": "138.6800",
  "adjusted_previous_close": "138.6800",
  "previous_close_date": "2017-03-09",
  "symbol": "AAPL",
  "trading_halted": false,
  "last_trade_price_source": "consolidated",
  "updated_at": "2017-03-11T01:00:00Z",
  "instrument": "https://api.robinhood.com/instruments/450dfc6d-5510-4d40-abfb-f633b7d9be3e/"
}
```

# Websocket
The API now supports a websocket connection to deliver realtime price quote data powered by Intrinio Realtime Exchange data.  An api route exists (`/subscribers`) that will return the currently connected list of socket subscribers (clients).

## Websocket URI
Connect to the websocket at the root `/`.  User must send both a valid stock exchange ticker symbol and a valid API key (see 'API Key' below for more info).  

Production websocket URL exmaple: `https://api.groundwire.co?ticker=<ticker>&key=<api_key>`

## Websocket Events & Data

Web socket will trigger a `quote` event with an object hash containing the following price data with every change in the market:

| Key                     | Description                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `type`                  | One of three different price types: `ask`, `bid` or `last`                                                |
| `timestamp`             | The epoch timestamp of when the price was observed on the market                                          |
| `ticker`                | The ticker symbol of the stock instrument in question                                                     |
| `size`                  | The volume of transactions that occured since the last tick                                               |
| `price`                 | The price value for the quote

## Sample Response
Here is a sample of frames of data that will be returned from the websocket on the `quote` event:
```sh
Connected to the Groundwire socket
{ type: 'ask',
  timestamp: 1492113599.925394,
  ticker: 'GOOG',
  size: 100,
  price: 823.7 }
{ type: 'bid',
  timestamp: 1492113595.844749,
  ticker: 'GOOG',
  size: 200,
  price: 823.63 }
{ type: 'last',
  timestamp: 1492113592.6201143,
  ticker: 'GOOG',
  size: 33,
  price: 824.07 }
```

## Simulation

Web socket will support a `simulate` mode which will simulate the price action of stock ticker that is supplied.  Simply add a `simulate` parameter on the URL query string when connecting to the socket.  `0` means do not simulate, whereas `1` means enable simulate.  See below for details on specifying simulate on connection URL.

Simulations will use the latest Yahoo price for the incoming requested ticker symbol and **will not** spawn a connection to the Intrinio IEX stream.

# Groundwire Front End

This api application also supports calls being made from the Groundwire front end trading admin application.  These routes are used exclusively for the purpose of managing the user interaction on the front end and integrate with a PostgreSQL database to store data like user credentials, Robinhood auth tokens and other user preferences related to the the trading strategy.

# Security

## API Key
API key is required on calls to all API methods and websocket (except for the groundwire front end app calls).  A `key=<value>` parameter must be included on the query string of all requests to the API and websocket:

| Endpoint Type | API Key Delivery                         |
| --- | -------------------------------------------------- |
| API | `https://<server host>/v1/<method>?key=<api_key>` |
| Websocket | `https://<server host>/?ticker&key=<api_key>&simulate=<0 or 1>` |

Make sure to obtain a key from application admin if using the API on production.

## API Key Definitions
API keys are defined in the `.env` environment config file that is required in the root of the application when running locally.  It must be included in the application in order for the API to function in your dev environment.  Here is an example `.env` that contains the API keys definition:

```
API_KEYS=87wef87hwef87hwef,98wef9h8we9hwewef8,8932h4gfi9uwhdgf98s
```
On production, the `API_KEYS` definition is specified in the startup script.  Please contact application admin for more information about production `API_KEYS` definition.

Note that the `API_KEYS` is definition is a simple comma-separated list of alpha-numeric strings.

## RH & Intrinio Account Credentials
### Credentials files
A `robinhood.js` file optionally may exist in the `/credentials/` directory under root. This file is a simple exported JS object with the username and password of the target RH account.  Here is an example of the file:

```js
module.exports = {
    username: "myusername",
    password: "mypassword"
};
```

An `intrinio.js` file must exist in the `/credentials/` directory under root if the Websocket is to be used.  It is also a simple exported js object with the Intrinio username and password as seen above.  This credentials file must exist for the websocket to function.

### Authorization Header
The `credentials.js` file is not required to target a specific account in Robinhood.  You may also send a base64 encoded username and password in the `Authorization` header of each API request.  The credentials must be sent as a single string concatenated with a `:` such as: `username:password`.  A sample of the header containing a base 64 encoded username and password looks like:

```
Authorization: Basic 298fhq3rg9h3=
```

*UPDATE* You can also now send a RH auth token in place of an encoded username and password.  Simply send the previously authenticated RH token in the Authorization header with the `Bearer` classification like this:

```js
Authorization: Bearer 98h34g98u3g9iwrgijn398
```

## Logout
Logging out an existing auth token is supported through the `/logout` route.  Simply make a GET request with the auth_token as the Authorization `Bearer` token and the token will be forcefully expired with Robinhood.  This is helpful to prevent any kind of unwanted distribution or reuse of a token if being stored in a user db.

# Logging

The api application has a built in logging service for basic console logging.  It does not yet support logging levels and all logs will be output unless the logger is not enabled.  Enabling the logging service is done with an environment variable switch in `.env`:

```
LOGGER=1
```

(1) is on and (0) is off.

# Continuous Deployment 

This server is configured to utilize the GitLab Continuous Integration (CI) service.  All commits on the master branch within the source code repository hosted at GitLab will automatically trigger a build/deploy procedure on GitLab and on the Groundwire Trading API server.

# Installing Locally

To install and run this API application locally on your development machine you simply need to clone down the repository and run the NodeJS application with access to the internet.

## System Requirements
* NodeJS version 6.x and above
* NPM version 4.x and above

## Security and Environment Files
* An optional `robinhood.js` file in the `/credentials/` directory (see above [Security] section for more details)
* A required `intrinio.js` file in the `/credentials/` directory  if the websocket is to be functional
* A `.env` file in the root of the application folder that contains to port number to run the application and the API keys definition (see above in [Security] section for more info)

## Steps
1. Clone this repository to your local working directory
2. Run `npm install` from the newly cloned application directory
3. Run `sudo npm start` and enter your computer credentials with admin privileges.  Sudo is required to run the app on port 80.
4. Done!  Start querying the endpoints from your favorite tool.  Remember to put one of the API keys you have defined in your `.env` file

