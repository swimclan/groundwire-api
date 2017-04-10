# Background
This is the Ground Wire trading API.  It uses RestFUL query paradigm and returns JSON responses.  It is a simple set of services that allow the consumer to set trades in Robinhood's (RH) free online trading brokerage.  There are currently methods that enable placing market orders, placing stop sell orders, checking current positions, cancelling stop sell orders (for the purpose of moving a sell position) and other basic infomation data from RH.  These services are intended to allow consumers to build automated trading clients that can manage day/swing trades in the market automatically.

# Version
1.1.5
<br>
<em>See</em> [`CHANGELOG.md`](./CHANGELOG.md) <em>for more detailed view of all versions</em>

# API
## Service Root URI
The API's service root is at `/api/` and will run the expressJS app on port 80.  Currently there is no support for SSL but that will be coming in future release.

## Methods
| URI                     | HTTP Verb  | Request Body                      | Description                                              |
| ----------------------- | ---------- | --------------------------------- | -------------------------------------------------------- |
| `/api/`                 | GET        | None                              | Return RH account setup info for user                    |
| `/api/user`             | GET        | None                              | Return RH user information                               |
| `/api/accounts`         | GET        | None                              | Return user's RH account(s) status(es) including account balance |
| `/api/positions`        | GET        | None                              | Return user's current RH positions                       |
| `/api/queue`            | GET        | None                              | Return user's pending orders                             |
| `/api/queue/stop/<instrumentId>`| GET        | None                              | Return user's pending stop sell order for an instrumentId             |
| `/api/queue/immediate/<instrumentId>`| GET        | None                              | Return user's pending market sell order for an instrumentId             |     
| `/api/price/<ticker>`   | GET        | None                              | Return instrument price by ticker symbol                 |
| `/api/watchlist`        | GET        | None                              | Return all instruments on the user's watchlist           |
| `/api/trade`            | POST       | * `symbol` [optional ticker symbol]<br>* `instrumentId` [optional RH instrumentID]<br>* `quantity` [integer]<br>* `type` [buy/sell]<br>* `stop_price` [optional float] | Execute either a buy or sell trade.  Buy trades will all be market buy orders and sell trades will all be stop-loss sell orders.  If sending a stop loss sell order you must send in a `stop_price` value. |
| `/api/cancel`           | DELETE     | * `instrumentId` [RH instrumentID]<br>* `trigger` [stop/immediate] | Cancel any pending market (trigger `immediate`) or stop (trigger `stop`) sell order that is in the queue.  Can be used to move a stop loss position that is managed by RH. |

***

## Sample Response
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
***

## Security

### API Key
API key is required on calls to all API methods.  A `key=<value>` parameter must be included on the query string of all requests to the API:

`http://<server host>/api/<method>?key=<api key>`

Make sure to obtain a key from application admin if using the API on production.

### API Key Definitions
API keys are defined in the `.env` environment config file that is required in the root of the application when running locally.  It must be included in the application in order for the API to function in your dev environment.  Here is an example `.env` that contains the API keys definition:

```
API_KEYS=87wef87hwef87hwef,98wef9h8we9hwewef8,8932h4gfi9uwhdgf98s
```
On production, the `API_KEYS` definition is specified in the startup script.  Please contact application admin for more information about production `API_KEYS` definition.

Note that the `API_KEYS` is definition is a simple comma-separated list of alpha-numeric strings.

### RH Account Credentials
#### Credentials file
A `credentials.js` file optionally may exist in the application root directory. This file is a simple exported JS object with the username and password of the target RH account.  Here is an example of the file:

```js
module.exports = {
    username: "myusername",
    password: "mypassword"
};
```

#### Authorization Header
The `credentials.js` file is not required to target a specific account in Robinhood.  You may also send a base64 encoded username and password in the `Authorization` header of each API request.  The credentials must be sent as a single string concatenated with a `:` such as: `username:password`.  A sample of the header containing a base 64 encoded username and password looks like:

```
Authorization: Basic 298fhq3rg9h3=
```

# Installing Locally

To install and run this API application locally on your development machine you simply need to clone down the repository and run the NodeJS application with access to the internet.

### System Requirements
* NodeJS version 6.x and above
* NPM version 4.x and above

### Security and Environment Files
* A `credentials.js` file in the root of the application directory (see above [Security] section for more details)
* A `.env` file in the root of the application folder that contains to port number to run the application and the API keys definition (see above in [Security] section for more info)

### Steps
1. Clone this repository to your local working directory
2. Run `npm install` from the newly cloned application directory
3. Run `sudo npm start` and enter your computer credentials with admin privileges.  Sudo is required to run the app on port 80.
4. Done!  Start querying the endpoints from your favorite tool.  Remember to put one of the API keys you have defined in your `.env` file

