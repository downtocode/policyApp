var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var connect = require('connect'),
  mongojs = require('mongojs'),
  requireDir = require('requiredir');
var routes = requireDir('./routes');

var app = express();
var server = app.listen(process.env.PORT || 5000)
//var io = require('socket.io').listen(server); // this tells socket.io to use our express server

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
// app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var uri = "mongodb://heroku_app35837312:jfl6ps1binv31ke665qm7ss99f@ds061731.mongolab.com:61731/heroku_app35837312?replicaSet=rs-ds061731",
    db = mongojs.connect(uri, ["test", "questions", "users", "accounts", "userAnswers", "friends", "demographics", "petitions"]);

app.use(function(req,res,next) { 
  req.db = db; 
  next();
}); 

app.use('/', routes.api);
app.use('/', routes.index);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

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
  res.render('error.jade', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
