
var md5 = require('md5');
var mysql = require('mysql');

var index = require('../routes/index');

var db_config = index.db_config

var connection;

function handleDisconnect() {
  // Recreate the connection, since
  connection = mysql.createConnection(db_config);


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
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

exports.login = function (req, res) {
  var email = req.body.email;
  var password = md5(req.body.password);
  console.log("login info-", email, "/", password);
  connection.query('SELECT * FROM user WHERE user_email = ?', [email], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on selecting from DB Users" })
    } else {
      console.log('The solution is: ', results);
      console.log('[0]=', [0]);
      if (results.length > 0) {
        if (results[0].password == password) {
          session = req.session;
          session.email = req.body.email
          session.user_id = results[0].user_id
          session.wallet = results[0].payment_address.trim()
          console.log("logged in ");
          res.redirect('/questionBoard');
        }
        else {
          console.log("Not successful");
          res.render("loginRegister", { errorMsg: "Password did not match" })
        }
      } else {
        console.log("Not successful");
          res.render("loginRegister", { errorMsg: "Email does not exist" })
      }

    }
  });
}

