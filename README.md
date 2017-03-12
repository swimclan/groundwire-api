# Background
This is the Ground Wire trading API.  It uses RestFUL query paradigm and returns JSON responses.  It is a simple set of services that allow the consumer to set trades in Robinhood's (RH) free online trading brokerage.  There are currently methods that enable placing market orders, placing stop sell orders, checking current positions, cancelling stop sell orders (for the purpose of moving a sell position) and other basic infomation data from RH.  These services are intended to allow consumers to build automated trading clients that can manage day/swing trades in the market automatically.
# API
## Service Root URI
The API's service root is at `/api/` and will run the expressJS app on port 80.  Currently there is no support for SSL but that will be coming in future release.

## Methods
| URI                     | HTTP Verb  | Description                            |
| ----------------------- | ---------- | -------------------------------------- |
| `/api/`                 | GET        | Return RH account info for user        |
| `/api/user`             | GET        | Return RH user info                    |
| `/api/accounts`         | GET        | Return user's RH account(s) status(es) |
| `/api/positions`        | GET        | Return user's current RH positions     |
| `/api/queue`            | GET        | Return user's pending orders           |
| `/api/price/<ticker>`   | GET        | Return instrument price by ticker symbol |

## Security

### API Key
API key is required on calls to all API methods.  A `key=<value>` parameter must be included on the query string of all requests to the API:

`http://<server host>/api/<method>?key=<api key>`

### RH Account Credentials
A `credentials.js` file must exist in the application root directory and is a simple exported JS object with the username and password of the target RH account:

```js
module.exports = {
    username: "myusername",
    password: "mypassword"
};
```
## Sample Response
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


