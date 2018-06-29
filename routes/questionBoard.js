
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





exports.postChallenge = function (req, res) {
  console.log("req", req.body);
  session = req.session;
  var today = new Date();
  var ChallengeQuestionInfo = {
    "post_user_id": session.user_id,
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
      res.render("error", { errorMsg: "Error on insertion into Db challenges" })

    } else {
      console.log('The information saved successfully', results);
      res.redirect('questionBoard');

    }
  });

}

exports.postanswer = function (req, res) {
  console.log("req", req.body);
  session = req.session;
  var today = new Date();
  var ChallengeAnswerInfo = {
    "post_user_id": session.user_id,
    "description": req.body.description,
    "challenge_id": req.body.challenge_id,
    "downvote_count": 0,
    "view_count": 0,
    "upvote_count": 0,
    "posting_date": today
  }

  connection.query('INSERT INTO answer SET ?', ChallengeAnswerInfo, function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on insertion into DB Users" })

    } else {
      console.log('The information saved successfully', results);
      res.send('success');

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
  var resultObj = {};
  connection.query('select challenge.*, `user`.user_name, `user`.user_id, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answers from challenge join `user` on challenge.post_user_id = `user`.user_id ORDER BY posting_date DESC', [], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", { title: 'Error on handling challenge events' });
      res.send({
        "code": 400,
        "failed": "error ocurred"
      })
      //res.render('error');
    } else {
      resultObj['mostRecent'] = results;
      console.log('The recent challenges are: ', results);
      connection.query('select challenge.*, `user`.user_name, `user`.user_id, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answers from challenge join `user` on challenge.post_user_id = `user`.user_id ORDER BY view_count+upvote_count-downvote_count DESC', [], function (error, results, fields) {
        if (error) {
          console.log("error ocurred", { title: 'Error on handling challenge events' });
          res.send({
            "code": 400,
            "failed": "error ocurred"
          })
          //res.render('error');
        } else {
          resultObj['mostResponse'] = results;
          console.log('The Most response challenges are: ', results);
          connection.query('select * from (select challenge.*, `user`.user_name, `user`.user_id, (SELECT max(answer.posting_date) as maximum FROM answer WHERE answer.challenge_id = challenge.challenge_id) as recent_answer, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answer from challenge join `user` on challenge.post_user_id = `user`.user_id) as innerTable where innerTable.recent_answer is not null', [], function (error, results, fields) {
            if (error) {
              console.log("error ocurred", { title: 'Error on handling challenge events' });
              res.send({
                "code": 400,
                "failed": "error ocurred"
              })
              //res.render('error');
            } else {
              resultObj['mostRecentAnswered'] = results;
              console.log('The Most recent answered challenges are: ', results);
              connection.query('select * from (select challenge.*, `user`.user_name, `user`.user_id, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answer from challenge join `user` on challenge.post_user_id = `user`.user_id) as innerTable where total_answer = 0', [], function (error, results, fields) {
                if (error) {
                  console.log("error ocurred", { title: 'Error on handling challenge events' });
                  res.send({
                    "code": 400,
                    "failed": "error ocurred"
                  })
                  //res.render('error');
                } else {
                  resultObj['NoAnswers'] = results;
                  console.log('Not answered challenges are: ', results);
                  res.render('questionBoard', { data: resultObj });
                }
              });
            }
          });
        }
      });
    }
  });
}

exports.likeAnswer = function (req, res) {
  answer_id = req.params.answer_id;
  challenge_id = req.params.challenge_id;
  connection.query("update answer set upvote_count=upvote_count+1 where answer_id=?", [answer_id], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on selecting from DB Users" })
    }
    else {
      console.log('Update Up Votes successfully for answer:' + answer_id, results);
      res.redirect('/getChallengebyID/' + challenge_id);
    }
  });
}

exports.dislikeAnswer = function (req, res) {
  answer_id = req.params.answer_id;
  challenge_id = req.params.challenge_id;
  connection.query("update answer set downvote_count=downvote_count+1 where answer_id=?", [answer_id], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on selecting from DB Users" })
    }
    else {
      console.log('Update Down Votes successfully for answer:' + answer_id, results);
      res.redirect('/getChallengebyID/' + challenge_id);
    }
  });
}

exports.likeChallenge = function (req, res) {
  challenge_id = req.params.challenge_id;
  connection.query("update challenge set upvote_count=upvote_count+1 where challenge_id=?", [challenge_id], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on selecting from DB Users" })
    }
    else {
      console.log('Update Up Votes successfully for challenge:' + challenge_id, results);
      res.redirect('/getChallengebyID/' + challenge_id);
    }
  });
}

exports.dislikeChallenge = function (req, res) {
  challenge_id = req.params.challenge_id;
  connection.query("update challenge set downvote_count=downvote_count+1 where challenge_id=?", [challenge_id], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on selecting from DB Users" })
    }
    else {
      console.log('Update Up Votes successfully for challenge:' + challenge_id, results);
      res.redirect('/getChallengebyID/' + challenge_id);
    }
  });
}

exports.closeChallenge = function (req, res) {
  challenge_id = req.params.challenge_id;
  connection.query("update challenge set is_closed=1 where challenge_id=?", [challenge_id], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on selecting from DB Users" })
    }
    else {
      console.log('Update Up Votes successfully for challenge:' + challenge_id, results);
      res.redirect('/getChallengebyID/' + challenge_id);
    }
  });
}

exports.getDetailsChallenge = function (req, res) {

  session = req.session
  console.log("printing user ID");
  console.log(session);

  if (typeof session.user_id === "undefined") {
    console.log("You are not logged in");
    res.redirect('/loginRegister');
  } else {
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

    connection.query("select challenge.*, `user`.user_name, `user`.user_id, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answers  from challenge join `user` on challenge.post_user_id = `user`.user_id where challenge_id=?", [challenge_id], function (error, results, fields) {
      if (error) {
        console.log("error ocurred", { title: 'Error on handling challenge events 1' });
        res.send({
          "code": 400,
          "failed": "error ocurred"
        })
        res.render('error');
      } else {
        console.log('Challenge Details: ', results);
        if (results.length > 0) {
          resultObj['challengedetails'] = results
          connection.query('select answer.*, `user`.user_name, `user`.user_id  from answer join `user` on answer.post_user_id = `user`.user_id where answer.challenge_id=?', [challenge_id], function (error, results, fields) {
            if (error) {
              console.log("error ocurred", { title: 'Error on handling challenge events 2' });
              res.send({
                "code": 400,
                "failed": "error ocurred"
              })
              res.render('error');
            } else {
              console.log('Answer details of that challenge: ', results);
              if (results.length > 0) {
                resultObj['answers'] = results
                // console.log(resultObj);
              } else {
                resultObj['answers'] = []
              }
              connection.query("update challenge set view_count=view_count+1 where challenge_id=?", [challenge_id], function (error, results, fields) {
                if (error) {
                  console.log("error ocurred", error);
                  res.render("error", { errorMsg: "Error on selecting from DB Users" })
                }
                else {
                  console.log('update view count for challenge:' + challenge_id, results);
                }
              });
              console.log(JSON.stringify(resultObj));
              res.render('questionDetails', { data: resultObj });
            }
          });

        }
      }
    });
  }


}
exports.totalQuestionAnswer = function (req, res) {
  connection.query("SELECT (select count(*) from challenge) as total_challenge, (select COUNT(*) FROM answer) as total_answer", function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on selecting from DB Users" })
    }
    else {
      console.log('GET total answers and questions', results);
      res.send({
        "Questions": results[0].total_challenge,
        "Answers": results[0].total_answer,
      })
    }
  });
}
