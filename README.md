# Background
This is the Ground Wire trading API.  It uses RestFUL query paradigm and returns JSON responses.  It is a simple set of services that allow the consumer to set trades in Robinhood's (RH) free online trading brokerage.  There are currently methods that enable placing market orders, placing stop sell orders, checking current positions, cancelling stop sell orders (for the purpose of moving a sell position) and other basic infomation data from RH.  These services are intended to allow consumers to build automated trading clients that can manage day/swing trades in the market automatically.

# Version
1.6.1
<br>
<em>See</em> [`CHANGELOG.md`](./CHANGELOG.md) <em>for more detailed view of all versions</em>

# API
## Service Root URI
The API's service root is at `/v1/` and will run the expressJS app on port 3000.  Currently there is support for SSL on production.

## API Methods
| URI                     | HTTP Verb  | Request Body                      | Description                                              |
| ----------------------- | ---------- | --------------------------------- | -------------------------------------------------------- |
| `/v1/`                 | GET        | None                              | Return RH account setup info for user                    |
| `/v1/user`             | GET        | None                              | Return RH user information                               |
| `/v1/accounts`         | GET        | None                              | Return user's RH account(s) status(es) including account balance |
| `/v1/positions`        | GET        | None                              | Return user's current RH positions                       |
| `/v1/queue`            | GET        | None                              | Return user's pending orders                             |
| `/v1/instrument/<type>/<id>` | GET        | None                        | Get a Robinhood instrument object by sneding either a known instrument id or a ticker symbol. `type` is either `symbol` or `instrument` and `id` is either the ticker symbol or the instrument id (respectively) |
| `/v1/queue/stop/<instrumentId>`| GET        | None                              | Return user's pending stop sell order for an instrumentId             |
| `/v1/queue/immediate/<instrumentId>`| GET        | None                              | Return user's pending market sell order for an instrumentId             |
| `/v1/price/<ticker>`   | GET        | None                              | Return instrument price by ticker symbol                 |
| `/v1/watchlist`        | GET        | None                              | Return all instruments on the user's watchlist           |
| `/v1/trade`            | POST       | * `symbol` [optional ticker symbol]<br>* `instrumentId` [optional RH instrumentID]<br>* `quantity` [integer]<br>* `type` [buy/sell]<br>* `stop_price` [optional float] | Execute either a buy or sell trade.  Buy trades will all be market buy orders and sell trades will either be stop-loss or market sell orders depending on whether a `stop_price` value is sent in the request.  If sending a stop loss sell order you must send in a `stop_price` value. |
| `/v1/cancel`           | DELETE     | * `instrumentId` [RH instrumentID]<br>* `trigger` [stop/immediate] | Cancel any pending market (trigger `immediate`) or stop (trigger `stop`) sell order that is in the queue.  Can be used to move a stop loss position that is managed by RH. |
| `/v1/holidays`         | GET        | None                             | Returns a JSON list of all market holidays for the current year |

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
The API now supports a websocket connection to deliver realtime price quote data powered by Intrinio Realtime Exchange data.  

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

# Security

## API Key
API key is required on calls to all API methods and websocket.  A `key=<value>` parameter must be included on the query string of all requests to the API and websocket:

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

