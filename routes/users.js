var express = require('express');
var md5 = require('md5');
var mysql = require('mysql');
// var router = express.Router();
var db_config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'chainmap'
};

/*
var db_config = {

  host: '107.181.170.169',
  user: 'dbuser',
  password: 'telenav123',
  database: 'cmpdb'
}
*/

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

exports.userRegister = function (req, res) {
  console.log("req", req.body);
  var today = new Date();
  var company_id = "";
  if (req.body.mode == "create") {
    var companyInfo = {
      'company_name': req.body.company_name,
      'company_info': req.body.company_info,
      'company_email': req.body.company_email,
      'company_phone': req.body.company_phone,
      'company_site': req.body.company_site
    }
    connection.query('INSERT INTO company SET ?', companyInfo, function (error, results, fields) {
      if (error) {
        console.log("error ocurred", error);
        res.render("error", { errorMsg: "Error on insertion into DB Users" })

      } else {
        var userInfo = {
          'company_id': results.insertId,
          'firstname': req.body.firstname,
          'lastname': req.body.lastname,
          'user_name': req.body.user_name,
          'user_email': req.body.user_email,
          'user_phone': req.body.user_phone,
          'password': md5(req.body.password),
          'payment_address': req.body.payment_address,
          'is_reviewer': req.body.is_reviewer
        };

        connection.query('INSERT INTO user SET ?', userInfo, function (error, results, fields) {
          if (error) {
            console.log("error ocurred", error);
            res.render("error", { errorMsg: "Error on insertion into DB Users" })

          } else {
            console.log('The information saved successfully', results);
            res.send('success');
          }
        });
      }
    });
  }
  else if (req.body.mode == "select") {
    var userInfo = {
      'company_id': req.body.company_id,
      'firstname': req.body.firstname,
      'lastname': req.body.lastname,
      'user_name': req.body.user_name,
      'user_email': req.body.user_email,
      'user_phone': req.body.user_phone,
      'password': md5(req.body.password),
      'payment_address': req.body.payment_address,
      'is_reviewer': req.body.is_reviewer
    };

    connection.query('INSERT INTO user SET ?', userInfo, function (error, results, fields) {
      if (error) {
        console.log("error ocurred", error);
        res.render("error", { errorMsg: "Error on insertion into DB Users" })

      } else {
        console.log('The information saved successfully', results);
        res.send('success');
      }
    });
  }
}

exports.getCompanies = function (req, res) {
  connection.query('select company_id, company_name from company', function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on insertion into DB Users" })

    } else {
      console.log(results)
      res.send(results);
    }
  });
}

// module.exports = router;