
var mysql      = require('mysql');


var db_config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
};



var connection;

function handleDisconnect() {
  // Recreate the connection, since
  connection = mysql.createConnection(db_config); 
                                                 

  connection.connect(function(err) {              
    if(err) {                                     
      console.log('error when connecting to db:', err);
      // We introduce a delay before attempting to reconnect,
      setTimeout(handleDisconnect, 2000); 
    }                                     
  });                                     
                                         
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { 
      handleDisconnect();                         
    } else {                                     
      throw err;                                 
    }
  });
}

handleDisconnect();

exports.register = function(req,res){
  // console.log("req",req.body);
  var today = new Date();
  var users={
    "email":req.body.email,
    "password":req.body.password,
    "primarycat":req.body.primarycat,
    "partneryes":req.body.partneryes,
    "teamneeds":req.body.teamneeds,
    "location":req.body.location,
    "created":today,
    "modified":today
  }
  connection.query('INSERT INTO users SET ?',users, function (error, results, fields) {
  if (error) {
    console.log("error ocurred",error);
    res.render("error", {errorMsg: "Error on insertion into DB Users"})

  }else{
    console.log('The solution is: ', results);
    //res.render('challenge', { title: 'Challenge' });
    session = req.session;
	session.email = req.body.email

    res.redirect('challenge');

  }
  });

}


exports.login = function(req,res){
  var email= req.body.email;
  var password = req.body.password.trim();
  connection.query('SELECT * FROM users WHERE email = ?',[email], function (error, results, fields) {
  if (error) {
    console.log("error ocurred",error);
    res.render("error", {errorMsg: "Error on selecting from DB Users"})
  }else{
    console.log('The solution is: ', results);
    console.log('[0]=',[0]);
    if(results.length >0){
      if(results[0].password == password){
        //res.render('challenge', { title: 'Challenge' });
        session = req.session;
		session.email = req.body.email
		
        res.redirect('challenge');
        
        //res.send({
        //  "code":200,
        //  "success":"login sucessfull"
        //    });
      }
      else{
        console.log("password=",password);
        res.render("error", {errorMsg: "Email and password does not match"})
      }
    }
    else{
    	res.render("error", {errorMsg: "Email does not exits"})
     }
  }
  });
}

