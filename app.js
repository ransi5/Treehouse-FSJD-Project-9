var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var { sequelize, models } = require('./models');

// sequelize authentication and sync 
sequelize.authenticate()
  .then((result) => {
    console.log("Connection to db established.");
  })
  .then(() => {
    sequelize.sync()
      .then((res) => {
        console.log("Sync to db complete")
      })
      .catch((err) => {
        console.log("Sync to db failed: ", err)
      })
  })
  .catch((error) => {
    console.log("Unable to connect to db: ", error);
  });

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
