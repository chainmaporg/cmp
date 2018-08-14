
var md5 = require('md5');

exports.login = function (req, res) {
  var email = req.body.email;
  var password = md5(req.body.password);
  console.log("login info-", email, "/", password);
  
  var qry='';
  if(email.includes("@")) {
  	 qry = 'SELECT * FROM user WHERE (user_email = ?) ';
  }
  else {
  	 qry = 'SELECT * FROM user WHERE (user_name = ?) ';
  }  
  	
  console.log("login query=",qry);
  
  connection.query(qry, [email], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on selecting from DB Users" });
    } else {
      console.log('The solution is: ', results);
      console.log('[0]=', [0]);
      if (results.length > 0) {
        if (results[0].password === password) {
          const session = req.session;
          session.email = req.body.email;
          session.user_id = results[0].user_id;
          session.wallet = results[0].payment_address.trim();
          console.log("logged in ");
          res.redirect("/userProfile/" + session.user_id);
        }
        else {
          console.log("Not successful");
          res.render("loginRegister", { errorMsg: "Password did not match" });
        }
      } else {
        console.log("Not successful");
          res.render("loginRegister", { errorMsg: "Email does not exist" });
      }

    }
  });
};

