var mysql      = require('mysql');

/*
var db_config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
};
*/

//**
 var db_config = {
   host     : '107.181.170.169 ',
   user     : 'dbuser',
   password : 'telenav123',
   database : 'rsdb'
 };
//**/

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



exports.challenge = function(req,res){
	console.log("dddd:challenge")
	session = req.session;
	/**GZ: no session management for now
	if(!session.email) {
		return res.redirect("/")
		req.session.error="need to login first"
	}
	**/
	
  connection.query('SELECT * FROM challenges',[], function (error, results, fields) {
  if (error) {
    console.log("error ocurred",{title: 'Error on handling challenge events'});
    res.send({
      "code":400,
      "failed":"error ocurred"
    })
    //res.render('error');
  }else{
    console.log('The solution is: ', results);
    if(results.length >0){
    	res.render('challenge', { data:results });
    }
  }
  });
}

