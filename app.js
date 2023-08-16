const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const handleWeatherData = require('./routes/weatherData');
const paramsRouter = require('./routes/parameters');

const app = express();
const router = express.Router();

app.use(cors({
  origin: '*'
}));

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(logger('dev'));
app.use(logger(':method :url :status :res[content-length] - :response-time ms'))

handleWeatherData(router);

app.use('/', cors(), router);
app.get('/', cors(), (req, res) => {
  res.send('Weathermap data API')
})
app.use('/parameters', cors(), paramsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.set('etag', false)

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
