
var mysql = require('mysql');


var db_config = {
  host: '107.181.170.169',
  user: 'root',
  password: '',
  database: 'cmpdb'
};



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





exports.postChallenge = function (req, res) {
  console.log("req", req.body);
  var today = new Date();
  var ChallengeQuestionInfo = {
    "post_user_id": 1,
    "description": req.body.ChallengeQuestion,
    "upvote_count": 0,
    "downvote_count": 0,
    "view_count": 0,
    "category": req.body.category,
    "level": req.body.level,
    "title": req.body.ChallengeHeader,
    "posting_date": today
  }
  connection.query('INSERT INTO challenge SET ?', ChallengeQuestionInfo, function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on insertion into DB Users" })

    } else {
      console.log('The information saved successfully', results);
      return 'success'
      // res.redirect('getAllChallenge');

    }
  });

}

exports.getAllChallenge = function (req, res) {
  console.log("Get All Challenges")
  session = req.session;
	/**GZ: no session management for now
	if(!session.email) {
		return res.redirect("/")
		req.session.error="need to login first"
	}
	**/

  connection.query('select challenge.*, `user`.user_name, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answers from challenge join `user` on challenge.post_user_id = `user`.user_id', [], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", { title: 'Error on handling challenge events' });
      res.send({
        "code": 400,
        "failed": "error ocurred"
      })
      //res.render('error');
    } else {
      console.log('The solution is: ', results);
      if (results.length > 0) {
        res.render('questionBoard', { data: results });
      }
    }
  });
}

exports.getDetailsChallenge = function (req, res) {

  challenge_id = req.params.challenge_id;
  console.log("Get details information of a specific challenge. Challenge Id is " + challenge_id);
  session = req.session;
	/**GZ: no session management for now
	if(!session.email) {
		return res.redirect("/")
		req.session.error="need to login first"
	}
	**/
  var resultObj = {};

  connection.query("select challenge.*, `user`.user_name  from challenge join `user` on challenge.post_user_id = `user`.user_id where challenge_id=?", [challenge_id], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", { title: 'Error on handling challenge events 1' });
      res.send({
        "code": 400,
        "failed": "error ocurred"
      })
      //res.render('error');
    } else {
      // console.log('The solution is: ', results);
      if (results.length > 0) {
        resultObj['challengedetails'] = results
      }
    }
  });

  connection.query('select * from answer where challenge_id=? ', [challenge_id], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", { title: 'Error on handling challenge events 2' });
      res.send({
        "code": 400,
        "failed": "error ocurred"
      })
      //res.render('error');
    } else {
      // console.log('The solution is: ', results);
      if (results.length > 0) {
        resultObj['answers'] = results
        // console.log(resultObj);
        console.log(JSON.stringify(resultObj));
        res.render('questionDetails', { data: resultObj });
      }
    }
  });


}


