var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Sessions = require('./lib/Sessions');
var session = require('express-session');
var passport = require('passport');
var DB = require('./lib/db');
var UserModel = require('./models/User');
require('dotenv').config();
var config = require('./config');
var Logger = require('./lib/Logger');

var routes = require('./routes/index');
var streams = require('./streams/index');

var app = express();

// Start logging service
var logger = Logger.getInstance({enabled: process.env.LOGGER == 1});

// setup db connection
if (process.env.USER_DB_MASTER_SWITCH !== '0'){
  DB.getInstance({
    host: config.get(`db.${process.env.NODE_ENV}.host`),
    port: config.get(`db.${process.env.NODE_ENV}.port`),
    dbname: config.get(`db.${process.env.NODE_ENV}.dbname`),
    user: process.env.DB_USER ? process.env.DB_USER : '',
    pass: process.env.DB_PASS ? process.env.DB_PASS : ''
  }).connect()
  .then(() => {
    logger.log('DB', 'Connection successful', {})
  })
  .catch((err) => {
    logger.log('ERROR!', 'Connection failed with error', {error: err})
  });
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(require('connect-multiparty')());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: process.env.SESSION_SECRET }));

// Setup passport middleware
if (process.env.USER_DB_MASTER_SWITCH !== '0') {
  app.use(passport.initialize());
  app.use(passport.session());
  
  var User = new UserModel(DB);
  passport.use(User.createStrategy());
  
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
}

app.use('/v1', routes);
app.use('/stream', streams);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// session storage
app.locals.sessions = new Sessions();

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
