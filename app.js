'use strict';

// load modules
const express = require('express');
var path = require('path');
const morgan = require('morgan');
var { sequelize, models } = require('./models');
var indexRouter = require('./routes/index');

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

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
const app = express();

// setup morgan which gives us http request logging
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set our port
app.set('port', process.env.PORT || 5000);

// start listening on our port
const server = app.listen(app.get('port'), () => {
  console.log(`Express server is listening on port ${server.address().port}`);
});
