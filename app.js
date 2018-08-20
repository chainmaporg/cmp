var createError = require("http-errors");
var express = require("express");
var session = require("express-session");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var fs = require("fs");
var mysql = require("mysql");

var logIP = function(req, res) {
    if (!req.session.logged) {
        console.log("New unique session.");
        console.log(req.connection.remoteAddress);
        req.session.logged = true;
        connection.query("INSERT INTO ip (ip, timestamp) VALUES (?, NOW())", [req.connection.remoteAddress], function(
            error,
            results,
            fields,
        ) {
            if (error) console.log("Error: ", error);
        });
    }
};

// var usersRouter = require('./routes/users');

//var configFile = '../' + require('os').hostname() + '.js';

serverConfigFile = "../cmap-2-0-config.js";
localConfigFile = "./local-deploy.js";
console.log(">>Check your local config file and DB settings under ./local-deploy.js)", localConfigFile);

configFile = fs.existsSync(serverConfigFile) ? serverConfigFile : localConfigFile;

console.log(">>The server is picking this configuration:", configFile);

var config = require(configFile);
global.config = config;

//load chain service
require("./libs/ChainService");

//create db connection one time
var startMysqlConnection = function() {
    global.connection = mysql.createConnection(config.db);
    connection.connect(function(err) {
        if (err) {
            console.log("error when connecting to db:", err);
            // We introduce a delay before attempting to reconnect,
            setTimeout(handleDisconnect, 2000);
        }
    });
    connection.on("error", function(err) {
        console.log("db error", err);
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
            startMysqlConnection();
        } else {
            throw err;
        }
    });
};
startMysqlConnection();

require("./libs/UserBalanceService");
var indexRouter = require("./routes/index");

var app = express();
app.use(
    session({
        secret: "chainmapsecret",
        resave: false,
        saveUninitialized: true,
    }),
);

// run once at the beginning
console.log("Updating graph.");
const outputGraph = require("./utils/outputGraph");
const id_dict = outputGraph.getGraph();
id_dict
    .then(dict => {
        const importancePromise = outputGraph.runPPR();
        importancePromise
            .then(importances => {
                outputGraph.getMappings(dict, importances);
            })
            .catch(error => {
                console.log("Error:", error);
            });
    })
    .catch(error => {});

// schedule recommendation updates every half day
setInterval(() => {
    console.log("Updating graph.");
    const outputGraph = require("./utils/outputGraph");
    const id_dict = outputGraph.getGraph();
    id_dict
        .then(dict => {
            const importancePromise = outputGraph.runPPR();
            importancePromise
                .then(importances => {
                    outputGraph.getMappings(dict, importances);
                })
                .catch(error => {
                    console.log("Error:", error);
                });
        })
        .catch(error => {});
}, 3.6e6);

// middleware to make 'user' available to all templates

app.use(function(req, res, next) {
    res.locals.session = req.session;
    logIP(req, res);
    next();
});

// app.set('view engine', 'pug');
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// app.use('/img',express.static(path.join(__dirname, 'public/images')));
// app.use('/js',express.static(path.join(__dirname, 'public/javascripts')));
// app.use('/css',express.static(path.join(__dirname, 'public/stylesheets')));
app.use(express.static("image"));

app.use("/", indexRouter);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
/**
app.use(function(req, res, next) {
  next(createError(404));
});
**/
// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    console.log("app:error -", err.message);
    //res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.locals.error = err;

    // render the error page
    res.status(err.status || 500);
    res.render("error", { errorMsg: err });
});

app.use(express.static(path.join(__dirname, "public")));

app.use(function(req, res, next) {
    res.status(404).render("notFound", { title: "Sorry, page not found" });
});
module.exports = app;
