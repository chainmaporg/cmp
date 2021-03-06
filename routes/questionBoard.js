var index = require('../routes/index');

var Nebulas = index.Nebulas;
var smartContract_address = index.smartContract_address;
var chainmapServerWallet = index.chainmapServerWallet;

function changeLevelNames(level) {
    switch (level)
    {
        case "Brozen":
            return ("Easy")
            break
        case "Silver":
            return ("Average")
            break
        case "Gold":
            return ("Hard")
            break 
        case "Diamond":
            return ("Very Hard")
            break
    }
    return ""
}


function handChallengeSmartContract(address, challengeId, challengeLevel, challenge, timeEstimation) {
	console.log("PostChallenge--", address, challengeId, challengeLevel, challenge, timeEstimation);
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

	chainService.builder().
		to(smartContract_address).
		contractCall('RewardAll', address, challengeId).
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
            // change display title
            results.forEach(dict => {
                dict.level = changeLevelNames(dict.level)
            })
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
                    // change display title
                    results.forEach(dict => {
                        dict.level = changeLevelNames(dict.level)
                    })
					resultObj['mostResponse'] = results;
					connection.query('select * from (select challenge.*, `user`.user_name, `user`.user_id, (SELECT max(answer.posting_date) as maximum FROM answer WHERE answer.challenge_id = challenge.challenge_id) as recent_answer, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answers from challenge join `user` on challenge.post_user_id = `user`.user_id) as innerTable where innerTable.recent_answer is not null', [], function (error, results, fields) {
						if (error) {
							console.log("error ocurred", { title: 'Error on handling challenge events' });
							res.send({
								"code": 400,
								"failed": "error ocurred"
							})
							//res.render('error');
						} else {
                            // change display title
                            results.forEach(dict => {
                                dict.level = changeLevelNames(dict.level)
                            })
							resultObj['mostRecentAnswered'] = results;
							connection.query('select * from (select challenge.*, `user`.user_name, `user`.user_id, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answers from challenge join `user` on challenge.post_user_id = `user`.user_id) as innerTable where total_answers = 0', [], function (error, results, fields) {
								if (error) {
									console.log("error ocurred", { title: 'Error on handling challenge events' });
									res.send({
										"code": 400,
										"failed": "error ocurred"
									})
									//res.render('error');
								} else {
                                    // change display title
                                    results.forEach(dict => {
                                        dict.level = changeLevelNames(dict.level)
                                    })
									resultObj['NoAnswers'] = results;
									console.log('Not answered challenges are: ', results);
									connection.query('select * from (select category.id , challenge.*, `user`.user_name, `user`.user_id, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answers from challenge join `user` on challenge.post_user_id = `user`.user_id JOIN category on category.category_name = challenge.category) as innerTable ORDER BY id', [], function (error, results, fields) {
										if (error) {
											console.log("error ocurred", { title: 'Error on handling challenge events' });
											res.send({
												"code": 400,
												"failed": "error ocurred"
											})
											//res.render('error');
										} else {
											resultObj['categoryChallenges'] = results;
											//console.log('Challenges are showing in order to the category id: ', results);	
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
	});
}

exports.likeAnswer = function (req, res) {
	var answer_id = req.params.answer_id;
    var challenge_id = req.params.challenge_id;
    var session = req.session;
    var userID = req.session.user_id;
    var address = session.wallet;
    var canVote = false;

    connection.query(
        "select vote_direction from answer_votes where user_id=? and answer_id=?",
        [userID, answer_id],
        function(error, results, fields) {
            if (error) {
                console.log("error: ", error);
                res.render("error", {
                    errorMsg: "Error.",
                });
            } else {
                console.log("Found results: ", results);
                // check no previous vote
                if (results.length == 0) {
                    connection.query(
                        "INSERT INTO answer_votes (user_id, answer_id, vote_direction) VALUES (?)",
                        [[userID, answer_id, 1]],
                        function(error, results, fields) {
                            if (error) console.log("error: ", error);
                            else {
                                console.log("user can upvote");
                                connection.query(
                                    "update answer set upvote_count=upvote_count+1 where answer_id=?",
                                    [answer_id],
                                    function(error, results, fields) {
                                        console.log(
                                            "inside query.................."
                                        );
                                        if (error) {
                                            console.log("error ocurred", error);
                                            res.render("error", {
                                                errorMsg:
                                                    "Error on selecting from DB Users",
                                            });
                                        } else {
                                            console.log(
                                                "Update Up Votes successfully for answer:" +
                                                    answer_id,
                                                results
                                            );

                                            handleVoteSmartContract(
                                                address,
                                                challenge_id,
                                                answer_id,
                                                true
                                            );
                                            res.redirect(
                                                "/getChallengebyID/" +
                                                    challenge_id
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                // check if user's first vote was downvote, if downvote, then allow upvote
                } else if (results[0].vote_direction == 0) {
                    connection.query(
                        "UPDATE answer_votes SET vote_direction = ? WHERE user_id = ? AND answer_id = ?",
                        [1, userID, answer_id],
                        function(error, results, fields) {
                            if (error) console.log("error: ", error);
                            else {
                                connection.query(
                                    "UPDATE answer SET upvote_count=upvote_count+1, downvote_count=downvote_count-1 WHERE answer_id=?",
                                    [answer_id],
                                    function(error, results, fields) {
                                        if (error) {
                                            console.log("error ocurred", error);
                                            res.render("error", {
                                                errorMsg:
                                                    "Error on selecting from DB Users",
                                            });
                                        } else {
                                            console.log(
                                                "Update Up Votes successfully for answer:" +
                                                    answer_id,
                                                results
                                            );

                                            res.redirect(
                                                "/getChallengebyID/" +
                                                    challenge_id
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            }
        }
    );
};

exports.dislikeAnswer = function (req, res) {
	var answer_id = req.params.answer_id;
    var challenge_id = req.params.challenge_id;
    var session = req.session;
    var address = session.wallet;
    var userID = req.session.user_id;

    connection.query(
        "select vote_direction from answer_votes where user_id=? and answer_id=?",
        [userID, answer_id],
        function(error, results, fields) {
            if (error) {
                console.log("error: ", error);
                res.render("error", {
                    errorMsg: "Error.",
                });
            } else {
                console.log("Found results: ", results);
                // check no previous vote
                if (results.length == 0) {
                    connection.query(
                        "INSERT INTO answer_votes (user_id, answer_id, vote_direction) VALUES (?)",
                        [[userID, answer_id, 0]],
                        function(error, results, fields) {
                            if (error) console.log("error: ", error);
                            else {
                                console.log("user can downvote");
                                connection.query(
                                    "update answer set downvote_count=downvote_count+1 where answer_id=?",
                                    [answer_id],
                                    function(error, results, fields) {
                                        if (error) {
                                            console.log("error ocurred", error);
                                            res.render("error", {
                                                errorMsg:
                                                    "Error on selecting from DB Users",
                                            });
                                        } else {
                                            console.log(
                                                "Update Down Votes successfully for answer:" +
                                                    answer_id,
                                                results
                                            );
                                            handleVoteSmartContract(
                                                address,
                                                challenge_id,
                                                answer_id,
                                                false
                                            );
                                            res.redirect(
                                                "/getChallengebyID/" +
                                                    challenge_id
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                // check if previous vote was upvote, if upvote, allow downvote
                } else if (results[0].vote_direction == 1) {
                    connection.query(
                        "UPDATE answer_votes SET vote_direction = ? WHERE user_id = ? AND answer_id = ?",
                        [0, userID, answer_id],
                        function(error, results, fields) {
                            if (error) console.log("error: ", error);
                            else {
                                connection.query(
                                    "UPDATE answer SET upvote_count=upvote_count-1, downvote_count=downvote_count+1 WHERE answer_id=?",
                                    [answer_id],
                                    function(error, results, fields) {
                                        if (error) {
                                            console.log("error ocurred", error);
                                            res.render("error", {
                                                errorMsg:
                                                    "Error on selecting from DB Users",
                                            });
                                        } else {
                                            console.log(
                                                "Update Down Votes successfully for answer:" +
                                                    answer_id,
                                                results
                                            );

                                            res.redirect(
                                                "/getChallengebyID/" +
                                                    challenge_id
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            }
        }
    );
};

exports.likeChallenge = function (req, res) {
	var challenge_id = req.params.challenge_id;
    var userID = req.session.user_id;

    connection.query(
        "select vote_direction from challenge_votes where user_id=? and challenge_id=?",
        [userID, challenge_id],
        function(error, results, fields) {
            if (error) {
                console.log("error: ", error);
                res.render("error", {
                    errorMsg: "Error.",
                });
            } else {
                console.log("Found results: ", results);
                // check no previous vote
                if (results.length == 0) {
                    connection.query(
                        "INSERT INTO challenge_votes (user_id, challenge_id, vote_direction) VALUES (?)",
                        [[userID, challenge_id, 1]],
                        function(error, results, fields) {
                            if (error) console.log("error: ", error);
                            else {
                                console.log("user can upvote");
                                connection.query(
                                    "update challenge set upvote_count=upvote_count+1 where challenge_id=?",
                                    [challenge_id],
                                    function(error, results, fields) {
                                        if (error) {
                                            console.log("error ocurred", error);
                                            res.render("error", {
                                                errorMsg:
                                                    "Error on selecting from DB Users",
                                            });
                                        } else {
                                            console.log(
                                                "Update Up Votes successfully for challenge:" +
                                                    challenge_id,
                                                results
                                            );

                                            res.redirect(
                                                "/getChallengebyID/" +
                                                    challenge_id
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                // check if previous vote was downvote, if downvote, then allow upvote
                } else if (results[0].vote_direction == 0) {
                    connection.query(
                        "UPDATE challenge_votes SET vote_direction = ? WHERE user_id = ? AND challenge_id = ?",
                        [1, userID, challenge_id],
                        function(error, results, fields) {
                            if (error) console.log("error: ", error);
                            else {
                                connection.query(
                                    "UPDATE challenge SET upvote_count=upvote_count+1, downvote_count=downvote_count-1 WHERE challenge_id=?",
                                    [challenge_id],
                                    function(error, results, fields) {
                                        if (error) {
                                            console.log("error ocurred", error);
                                            res.render("error", {
                                                errorMsg:
                                                    "Error on selecting from DB Users",
                                            });
                                        } else {
                                            console.log(
                                                "Update Up Votes successfully for challenge:" +
                                                    challenge_id,
                                                results
                                            );

                                            res.redirect(
                                                "/getChallengebyID/" +
                                                    challenge_id
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            }
        }
    );
};

exports.dislikeChallenge = function(req, res) {
    var challenge_id = req.params.challenge_id;
    var userID = req.session.user_id;
    connection.query(
        "select vote_direction from challenge_votes where user_id=? and challenge_id=?",
        [userID, challenge_id],
        function(error, results, fields) {
            if (error) {
                console.log("error: ", error);
                res.render("error", {
                    errorMsg: "Error.",
                });
            } else {
                console.log("Found results: ", results);
                // check no previous vote
                if (results.length == 0) {
                    connection.query(
                        "INSERT INTO challenge_votes (user_id, challenge_id, vote_direction) VALUES (?)",
                        [[userID, challenge_id, 0]],
                        function(error, results, fields) {
                            if (error) console.log("error: ", error);
                            else {
                                console.log("user can downvote");
                                connection.query(
                                    "update challenge set downvote_count=downvote_count+1 where challenge_id=?",
                                    [challenge_id],
                                    function(error, results, fields) {
                                        if (error) {
                                            console.log("error ocurred", error);
                                            res.render("error", {
                                                errorMsg:
                                                    "Error on selecting from DB Users",
                                            });
                                        } else {
                                            console.log(
                                                "Update Down Votes successfully for challenge:" +
                                                    challenge_id,
                                                results
                                            );

                                            res.redirect(
                                                "/getChallengebyID/" +
                                                    challenge_id
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                // check if previous vote was upvote, if upvote, then allow downvote
                } else if (results[0].vote_direction == 1) {
                    connection.query(
                        "UPDATE challenge_votes SET vote_direction = ? WHERE user_id = ? AND challenge_id = ?",
                        [0, userID, challenge_id],
                        function(error, results, fields) {
                            if (error) console.log("error: ", error);
                            else {
                                connection.query(
                                    "UPDATE challenge SET upvote_count=upvote_count-1, downvote_count=downvote_count+1 WHERE challenge_id=?",
                                    [challenge_id],
                                    function(error, results, fields) {
                                        if (error) {
                                            console.log("error ocurred", error);
                                            res.render("error", {
                                                errorMsg:
                                                    "Error on selecting from DB Users",
                                            });
                                        } else {
                                            console.log(
                                                "Update Down Votes successfully for challenge:" +
                                                    challenge_id,
                                                results
                                            );

                                            res.redirect(
                                                "/getChallengebyID/" +
                                                    challenge_id
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            }
        }
    );
};


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
                // change display title
                results.forEach(dict => {
                    dict.level = changeLevelNames(dict.level)
                })
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
