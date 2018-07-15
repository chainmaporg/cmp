var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var fs = require('fs');
var mysql = require('mysql');


// var usersRouter = require('./routes/users');

//var configFile = '../' + require('os').hostname() + '.js';
configFile = '../local-deploy.js';
console.log(">>Check your local deploy env loca and file for deployment (see template in env/local-deploy.js.sample)",  configFile)
console.log(">>Copy/Paste: cp env/loc-deploy.js.sample ../local-deploy.js and change the DB password for your own DB")

configFile = fs.existsSync(configFile) ? configFile : '../server.js';

console.log(">>The server is picking this configuration:",  configFile)

var config = require(configFile);
global.config = config;

//load chain service
require('./libs/ChainService');

//create db connection one time
var startMysqlConnection=function(){
	global.connection = mysql.createConnection(config.db);
	connection.connect(function (err) {
		if (err) {
			console.log('error when connecting to db:', err);
			// We introduce a delay before attempting to reconnect,
			setTimeout(handleDisconnect, 2000);
		}
	});
	connection.on('error', function (err) {
		console.log('db error', err);
		if (err.code === 'PROTOCOL_CONNECTION_LOST') {
			startMysqlConnection();
		} else {
			throw err;
		}
	});
}
startMysqlConnection();


require('./libs/UserBalanceService');
userBalanceService.user(18).then((data)=>{
	console.log(18+' wallet balance is ',data);
})

userBalanceService.user(1).then((data)=>{
	console.log(1+' wallet balance is ',data);
})


var app = express();
app.use(session({
	secret: 'chainmapsecret',
	resave: false,
	saveUninitialized: true
}));

// middleware to make 'user' available to all templates

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

// app.set('view engine', 'pug');
app.set('view engine', 'ejs');
// app.use(express.static('public'))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// app.use('/img',express.static(path.join(__dirname, 'public/images')));
// app.use('/js',express.static(path.join(__dirname, 'public/javascripts')));
// app.use('/css',express.static(path.join(__dirname, 'public/stylesheets')));
app.use(express.static('image'));


var indexRouter = require('./routes/index');

app.use('/', indexRouter);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
/**
app.use(function(req, res, next) {
  next(createError(404));
});
**/
// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	console.log("app:error -", err.message)
	//res.locals.error = req.app.get('env') === 'development' ? err : {};
	res.locals.error = err

	// render the error page
	res.status(err.status || 500);
	res.render('error', { errorMsg: err });
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
	res.status(404).render('notFound', { title: "Sorry, page not found" });
});
module.exports = app;
