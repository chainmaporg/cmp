var index = require('../routes/index');

var Nebulas = index.Nebulas;
var cmAccount = index.cmAccount;
var fromAddress = cmAccount.getAddressString();
var envChainId = index.envChainId;
var smartContract_address = index.smartContract_address;
var Neb = Nebulas.Neb;
var neb = new Neb();
var chainmapServerWallet = index.chainmapServerWallet;

neb.setRequest(new Nebulas.HttpRequest(index.chainUrl))

//   PostChallenge: function(address, challengeId, challengeLevel, challenge, timeEstimation){
//   AnswerChallenge: function(address,challengeId, answerId, answer){
//   VoteAnswer: function(address,challengeId,answerId,result){


function handSmartContract(nonce, contractParms) {
	console.log(contractParms)
	var tx = new Nebulas.Transaction({
		chainID: envChainId,
		from: cmAccount,
		to: smartContract_address,
		value: 0,
		nonce: nonce,
		gasPrice: 1000000,
		gasLimit: 1000000,
		contract: contractParms,
	});

	console.log("working...signTransaction()")
	tx.signTransaction();
	console.log("working...sendTx")
	waitSmartContractReceipt(neb, tx)
	console.log("Finishing waiting!")
}


function waitSmartContractReceipt(neb, tx) {
	//send a transfer request to the NAS node
	neb.api.sendRawTransaction({
		data: tx.toProtoString()
	}).then((result) => {
		let txhash = result.txhash;
		let trigger = setInterval(() => {
			neb.api.getTransactionReceipt({ hash: txhash }).then((receipt) => {
				console.log("txhash:", txhash)
				console.log('status', receipt.status);
				if (receipt.status != 2) //not in pending
				{
					console.log(JSON.stringify(receipt));
					clearInterval(trigger);
				}
			});
		}, 2000);

	});
}




function handChallengeSmartContract(address, challengeId, challengeLevel, challenge, timeEstimation) {
	console.log("PostChallenge--", address, challengeId, challengeLevel, challenge, timeEstimation);
	/*contractParms = {
		function: "PostChallenge",
		args: JSON.stringify([address, challengeId, challengeLevel, challenge, timeEstimation])
	}
	neb.api.getAccountState(fromAddress).then((accstate) => {
		console.log(JSON.stringify(accstate));
		let _nonce = parseInt(accstate.nonce) + 1;
		handSmartContract(_nonce, contractParms);
	});*/
	chainService.builder().
		to(smartContract_address).
		contractCall('PostChallenge', address, challengeId, challengeLevel, challenge, timeEstimation).
		send((err, data) => {
			if (err) {
				//sending error
				return console.error(err);
			}
			chainService.txStatus(data.txhash).then((data) => {
				//transaction accepted
				console.log(data);
			}).catch((err) => {
				//error
				console.error(err);
			})
		});
}



function handleAnswerSmartContract(address, challengeId, answerId, answer) {
	console.log("AnswerChallenge--", address, challengeId, answerId, answer);
	/*	contractParms = {
			function: "AnswerChallenge",
			args: JSON.stringify([address, challengeId, answerId, answer])
		}
	
	
		neb.api.getAccountState(fromAddress).then((accstate) => {
			console.log(JSON.stringify(accstate));
			let _nonce = parseInt(accstate.nonce) + 1;
			handSmartContract(_nonce, contractParms);
		});*/

	chainService.builder().
		to(smartContract_address).
		contractCall('AnswerChallenge', address, challengeId, answerId, answer).
		send((err, data) => {
			if (err) {
				//sending error
				return console.error(err);
			}
			chainService.txStatus(data.txhash).then((data) => {
				//transaction accepted
				console.log(data);
			}).catch((err) => {
				//error
				console.error(err);
			})
		});

}

function handleVoteSmartContract(address, challengeId, answerId, result) {
	console.log("VoteAnswer--", address, challengeId, answerId, result);
	/*contractParms = {
		function: "VoteAnswer",
		args: JSON.stringify([address, challengeId, answerId, result])
	}
	neb.api.getAccountState(fromAddress).then((accstate) => {
		console.log(JSON.stringify(accstate));
		let _nonce = parseInt(accstate.nonce) + 1;
		handSmartContract(_nonce, contractParms);
	});*/
	chainService.builder().
		to(smartContract_address).
		contractCall('VoteAnswer', address, challengeId, answerId, result).
		send((err, data) => {
			if (err) {
				//sending error
				return console.error(err);
			}
			chainService.txStatus(data.txhash).then((data) => {
				//transaction accepted
				console.log(data);
			}).catch((err) => {
				//error
				console.error(err);
			})
		});


}

function handleRewardAllSmartContract(challengeId, callback) {
	console.log("RewardAll--", challengeId);
	/*contractParms = {
		function: "RewardAll",
		args: JSON.stringify([challengeId])
	}
	neb.api.getAccountState(fromAddress).then((accstate) => {
		console.log(JSON.stringify(accstate));
		let _nonce = parseInt(accstate.nonce) + 1;
		handSmartContract(_nonce, contractParms);
	});*/

}









exports.postChallenge = function (req, res) {
	console.log("req", req.body);
	session = req.session;
	var today = new Date();
	var session = req.session;
	var address = session.wallet;


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
			insertId = results.insertId;
			//Handle the challenge
			insertIdStr = insertId.toString();
			handChallengeSmartContract(address, insertIdStr, ChallengeQuestionInfo.level, ChallengeQuestionInfo.description, 0);
			res.redirect('questionBoard');

		}
	});


}

exports.postanswer = function (req, res) {
	console.log("req", req.body);
	session = req.session;
	var today = new Date();
	var session = req.session;
	var address = session.wallet;

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
			//Handle the answer

			id = results.insertId;
			idStr = id.toString();
			handleAnswerSmartContract(address, ChallengeAnswerInfo.challenge_id, idStr, ChallengeAnswerInfo.description)

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
			//This line can cause lots of logs
			//console.log('The recent challenges are: ', results);
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
					connection.query('select * from (select challenge.*, `user`.user_name, `user`.user_id, (SELECT max(answer.posting_date) as maximum FROM answer WHERE answer.challenge_id = challenge.challenge_id) as recent_answer, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answers from challenge join `user` on challenge.post_user_id = `user`.user_id) as innerTable where innerTable.recent_answer is not null', [], function (error, results, fields) {
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
							connection.query('select * from (select challenge.*, `user`.user_name, `user`.user_id, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answers from challenge join `user` on challenge.post_user_id = `user`.user_id) as innerTable where total_answers = 0', [], function (error, results, fields) {
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
	var session = req.session;
	var address = session.wallet;

	connection.query("update answer set upvote_count=upvote_count+1 where answer_id=?", [answer_id], function (error, results, fields) {
		if (error) {
			console.log("error ocurred", error);
			res.render("error", { errorMsg: "Error on selecting from DB Users" })
		}
		else {
			console.log('Update Up Votes successfully for answer:' + answer_id, results);

			handleVoteSmartContract(address, challenge_id, answer_id, true);

			res.redirect('/getChallengebyID/' + challenge_id);
		}
	});


}

exports.dislikeAnswer = function (req, res) {
	answer_id = req.params.answer_id;
	challenge_id = req.params.challenge_id;
	var session = req.session;
	var address = session.wallet;
	connection.query("update answer set downvote_count=downvote_count+1 where answer_id=?", [answer_id], function (error, results, fields) {
		if (error) {
			console.log("error ocurred", error);
			res.render("error", { errorMsg: "Error on selecting from DB Users" })
		}
		else {
			console.log('Update Down Votes successfully for answer:' + answer_id, results);
			handleVoteSmartContract(address, challenge_id, answer_id, false);
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

	chainService.builder().
		to(smartContract_address).
		contractCall('RewardAll', challenge_id).
		send((err, data) => {
			if (err) {
				//sending error
				return console.error(err);
			}
			chainService.txStatus(data.txhash).then((data) => {
				//transaction accepted
				console.log(data);
				if (data.execute_error == "") {
					connection.query("update challenge set is_closed=1 where challenge_id=?", [challenge_id], function (error, results, fields) {
						if (error) {
							console.log("error ocurred", error);
							res.render("error", { errorMsg: "Error on selecting from DB Users" })
						}
						else {
							console.log('Update Up Votes successfully for challenge:' + challenge_id, results);
						}
					});
				}

			}).catch((err) => {
				//error
				console.error(err);
			})
		});


	res.redirect('/getChallengebyID/' + challenge_id);
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
