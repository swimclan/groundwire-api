# Background
This is the Ground Wire trading API.  It is a simple set of services that allow the consumer to set trades in Robinhood's (RH) free online trading brokerage.  There are currently methods that enable placing market orders, placing stop sell orders, checking current positions, cancelling stop sell orders (for the purpose of moving a sell position) and other basic infomation data from RH.  These services are intended to allow consumers to build automated trading clients that can manage day/swing trades in the market automatically.
# API
## Service root URI
The API's service root is at `/api/` and will run the expressJS app on port 80.  Currently there is no support for SSL but that will be coming in future release.

## Methods
| URI                     | HTTP Verb  | Description                            |
| ----------------------- | ---------- | -------------------------------------- |
| `/api/`                 | GET        | Return RH account info for user        |
| `/api/user`             | GET        | Return RH user info                    |
| `/api/accounts`         | GET        | Return user's RH account(s) status(es) |
| `/api/positions`        | GET        | Return user's current RH positions     |
| `/api/queue`            | GET        | Return user's pending orders           |
| `/api/price/<ticker>`   | GET        | Return instrument price by ticker symb |

## Security
API key is required on calls to all API methods.  A `key=<value>` parameter must be included on the query string of all requests to the API:

`http://<server host>/api/<method>?key=<api key>`

A `credentials.js` file must exist in the application root directory and is a simple exported JS object with the username and password of the target RH account:

```js
module.exports = {
    username: "myusername",
    password: "mypassword"
};
```

