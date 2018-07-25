var express = require('express');
var md5 = require('md5');



exports.userRegister = function (req, res) {
  console.log("req", req.body);
  var today = new Date();
  var company_id = "";
  // if (req.body.mode == "create") {
  //   var companyInfo = {
  //     'company_name': req.body.company_name,
  //     'company_info': req.body.company_info,
  //     'company_email': req.body.company_email,
  //     'company_phone': req.body.company_phone,
  //     'company_site': req.body.company_site
  //   }
  //   connection.query('INSERT INTO company SET ?', companyInfo, function (error, results, fields) {
  //     if (error) {
  //       console.log("error ocurred", error);
  //       res.render("error", { errorMsg: "Error on insertion into DB Users" })

  //     } else {
  //       var userInfo = {
  //         'company_id': results.insertId,
  //         'firstname': req.body.firstname,
  //         'lastname': req.body.lastname,
  //         'user_name': req.body.user_name,
  //         'user_email': req.body.user_email,
  //         'user_phone': req.body.user_phone,
  //         'password': md5(req.body.password),
  //         'payment_address': req.body.payment_address,
  //         'is_reviewer': req.body.is_reviewer
  //       };

  //       connection.query('INSERT INTO user SET ?', userInfo, function (error, results, fields) {
  //         if (error) {
  //           console.log("error ocurred", error);
  //           res.render("error", { errorMsg: "Error on insertion into DB Users" })

  //         } else {
  //           console.log('The information saved successfully', results);
  //           res.send('success');
  //         }
  //       });
  //     }
  //   });
  // }
  // else if (req.body.mode == "select") {
  var userInfo = {
    'company_id': 0,
    'firstname': "",
    'lastname': "",
    'user_name': req.body.user_name,
    'user_email': req.body.user_email,
    'user_phone': req.body.user_phone,
    'password': md5(req.body.password),
    'payment_address': "",
    'is_reviewer': 0
  };

  connection.query('select COUNT(*) as number from user where `user`.user_email = ?', req.body.user_email, function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.status(500).send({ error: 'you have an error' });

    } else {
      if (results[0].number == 0) {
        connection.query('select COUNT(*) as number from user where `user`.user_name = ?', req.body.user_name, function (error, results, fields) {
          if (error) {
            console.log("error ocurred", error);
            // res.redirect('/error');
            res.status(500).send({ error: 'you have an error' });

          } else {
            if (results[0].number == 0) {
              connection.query('INSERT INTO user SET ?', userInfo, function (error, results, fields) {
                if (error) {
                  // res.render("error", { errorMsg: "Error on insertion into DB Users code " })
                  console.log("error ocurred changes", error);
                  res.status(500).send({ error: 'you have an error' });

                } else {
                  console.log('The information saved successfully', results);
                  res.send({
                    "msg": "success"
                  })
                }
              });
            } else {
              console.log('duplicate user name', req.body.user_name);
              res.send({
                "msg": "duplicateUserName"
              })
            }
          }
        });
      } else {
        console.log('duplicate user Email', req.body.user_email);
        res.send({
          "msg": "duplicateUserEmail"
        })
      }
    }
  });


  // }
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

exports.getRecommendations = function(req, res) {
    var Client = require("node-rest-client").Client
    var client = new Client()
    var solr_host = global.config.search_solr_host
    var session = req.session
    var userID = session.user_id
    new Promise((resolve, reject) => {
        connection.query(
            "select category_id from user_category where user_id=?",
            [userID],
            function(error, results, fields) {
                if (error) {
                    reject(error)
                    res.render("error", {
                        errorMsg: "Error on finding user categories",
                    })
                } else {
                    results = results.map(function(value) {
                        return value["category_id"]
                    })
                    if (results.length == 0) resolve([1, 2])
                    else resolve(results)
                }
            }
        )
    })
        .catch(error => {
            console.log(error)
            console.log("Error reached.")
        })
        .then(results => {
            new Promise((resolve, reject) => {
                connection.query(
                    "select category_name from category where id =" +
                        results.join(" or id="),
                    function(error, results, fields) {
                        if (error) {
                            reject(error)
                        } else {
                            results = results.map(function(value) {
                                return value["category_name"]
                            })
                            resolve(results)
                        }
                    }
                )
            })
                .catch(error => console.log(error))
                .then(keywords => {
                    // some hard coded keywords if keywords can't be retrieved

                    var category = "article"

                    function getLink(keywords, numShow) {
                        var url =
                            solr_host +
                            "/select?fl=title,%20url,%20category&q=category:" +
                            encodeURI(category) +
                            "%20AND%20(search_content:" +
                            encodeURI(
                                " " +
                                    keywords.join(" OR search_content: ") +
                                    ")"
                            ) +
                            "&rows=" +
                            encodeURI(numShow) +
                            "&wt=json"
                        return url
                    }

                    var url = getLink(keywords, 10)

                    function makePromise(url) {
                        var p = new Promise((resolve, reject) => {
                            // request is asynchronous
                            var client = new Client()
                            var r = client.get(url, function(data, response) {
                                var docs = JSON.parse(data).response.docs
                                resolve(docs)
                            })

                            r.on("requestTimeout", function(r) {
                                console.log("request expired.")
                                r.abort()
                                reject()
                            })

                            r.on("error", function(err) {
                                console.log("request error", error)
                                reject()
                            })
                        }).catch(error => {
                            console.log(error)
                        })
                        return p
                    }

                    var combined = makePromise(url)

                    function shuffle(array) {
                        var counter = array.length
                        // While there are elements in the array
                        while (counter > 0) {
                            // Pick a random index
                            var index = Math.floor(Math.random() * counter)

                            // Decrease counter by 1
                            counter--

                            // And swap the last element with it
                            var temp = array[counter]
                            array[counter] = array[index]
                            array[index] = temp
                        }
                        return array
                    }

                    combined
                        .catch(function(error) {
                            console.log(error)
                        })
                        .then(function(values) {
                            var recommendations = shuffle(values).slice(0, 6)
                            res.send(recommendations)
                        })
                })
        })
}

exports.getJobRecommendations = function(req, res) {
    var Client = require("node-rest-client").Client
    var client = new Client()
    var solr_host = global.config.search_solr_host
    var session = req.session
    var userID = session.user_id
    new Promise((resolve, reject) => {
        connection.query(
            "select category_id from user_category where user_id=?",
            [userID],
            function(error, results, fields) {
                if (error) {
                    reject(error)
                    res.render("error", {
                        errorMsg: "Error on finding user categories",
                    })
                } else {
                    results = results.map(function(value) {
                        return value["category_id"]
                    })
                    if (results.length == 0) resolve([1, 2])
                    else resolve(results)
                }
            }
        )
    })
        .catch(error => {
            console.log(error)
            console.log("Error reached.")
        })
        .then(results => {
            new Promise((resolve, reject) => {
                connection.query(
                    "select category_name from category where id =" +
                        results.join(" or id="),
                    function(error, results, fields) {
                        if (error) {
                            reject(error)
                        } else {
                            results = results.map(function(value) {
                                return value["category_name"]
                            })
                            resolve(results)
                        }
                    }
                )
            })
                .catch(error => console.log(error))
                .then(keywords => {
                    // some hard coded keywords if keywords can't be retrieved

                    var category = "job"

                    function getLink(keywords, numShow) {
                        var url =
                            solr_host +
                            "/select?fl=title,%20url,%20category&q=category:" +
                            encodeURI(category) +
                            "%20AND%20(search_content:" +
                            encodeURI(
                                " " +
                                    keywords.join(" OR search_content: ") +
                                    ")"
                            ) +
                            "&rows=" +
                            encodeURI(numShow) +
                            "&wt=json"
                        return url
                    }

                    var url = getLink(keywords, 10)

                    function makePromise(url) {
                        var p = new Promise((resolve, reject) => {
                            // request is asynchronous
                            var client = new Client()
                            var r = client.get(url, function(data, response) {
                                var docs = JSON.parse(data).response.docs
                                resolve(docs)
                            })

                            r.on("requestTimeout", function(r) {
                                console.log("request expired.")
                                r.abort()
                                reject()
                            })

                            r.on("error", function(err) {
                                console.log("request error", error)
                                reject()
                            })
                        }).catch(error => {
                            console.log(error)
                        })
                        return p
                    }

                    var combined = makePromise(url)

                    function shuffle(array) {
                        var counter = array.length
                        // While there are elements in the array
                        while (counter > 0) {
                            // Pick a random index
                            var index = Math.floor(Math.random() * counter)

                            // Decrease counter by 1
                            counter--

                            // And swap the last element with it
                            var temp = array[counter]
                            array[counter] = array[index]
                            array[index] = temp
                        }
                        return array
                    }

                    combined
                        .catch(function(error) {
                            console.log(error)
                        })
                        .then(function(values) {
                            var recommendations = shuffle(values).slice(0, 4)
                            res.send(recommendations)
                        })
                })
        })
}


exports.recordClick = function(req, res) {
    console.log("Starting recording")
    var body = req.body
    var session = req.session
    var userID = session.user_id
    var id = parseInt(body.id);
    connection.query('select id from click where user_id=? && id=?', [userID, id], function(error, results, fields) {
        if (error)
            console.log("error occured", error)
        else if (results.length == 0){
            console.log(userID)
            connection.query('INSERT INTO click (user_id, id) VALUES (?)', [[userID, id]], function (error, results, fields) {
                if (error) {
                    console.log("error ocurred", error)
                }
                else
                    console.log("Success on recoding click");
            })
        }
        else
            console.log(results)
    })
}

exports.userProfile = function (req, res) {
  userID = req.params.user_id;
  resultObj = {}
  connection.query('select * from user where user_id=?', [userID], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on insertion into DB Users" })

    } else {
      resultObj['userProfile'] = results;
      connection.query('SELECT (select count(*) from challenge where challenge.post_user_id = ?) as total_challenge, (select COUNT(*) FROM answer where answer.post_user_id = ?) as total_answer', [userID, userID], function (error, results, fields) {
        if (error) {
          console.log("error ocurred", error);
          res.render("error", { errorMsg: "Error on insertion into DB Users" })

        } else {
          resultObj['questions'] = results[0].total_challenge;
          resultObj['answers'] = results[0].total_answer;
          connection.query('select challenge.*, `user`.user_name, `user`.user_id, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answers from challenge join `user` on challenge.post_user_id = `user`.user_id where `user`.user_id = ? ORDER BY posting_date DESC', [userID], function (error, results, fields) {
            if (error) {
              console.log("error ocurred", error);
              res.render("error", { errorMsg: "Error on insertion into DB Users" })

            } else {
              resultObj['allQuestions'] = results;
              // console.log('Total data from the userProfile request: ', resultObj);
              connection.query('select challenge.*, (select count(*) from answer where answer.challenge_id = challenge.challenge_id) as total_answer  from challenge join answer on challenge.challenge_id = answer.challenge_id where answer.post_user_id = ? GROUP BY challenge_id ORDER BY posting_date', [userID], function (error, results, fields) {
                if (error) {
                  console.log("error ocurred", error);
                  res.render("error", { errorMsg: "Error on insertion into DB Users" })

                } else {
                  resultObj['allansweredQuestions'] = results;
                  // console.log('Total data from the userProfile request: ', resultObj);
                  connection.query('select user_category.category_id, user_category.`level`, category.category_name from user_category join category on user_category.category_id = category.id where user_id = ?', [userID], function (error, results, fields) {
                    if (error) {
                      console.log("error ocurred", error);
                      res.render("error", { errorMsg: "Error on insertion into DB Users" })

                    } else {
                      resultObj['userCategory'] = results;
                      console.log('user category from userProfile request: ', results);

                      res.render('userProfile', { data: resultObj });
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

exports.tokenRanking = function (req, res) {
  connection.query('select `user`.*, ((select count(*) as total from challenge where post_user_id = `user`.user_id) + (select count(*) as total from answer where post_user_id = `user`.user_id)) as total from `user` ORDER BY total DESC limit 5', function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on insertion into DB Users" })

    } else {
      console.log(results)
      res.send({ 'users': results });
    }
  });
}

exports.updatePaymentaddress = function (req, res) {
  let session = req.session;
  userID = session.user_id;
  paymentAddress = req.body.paymentAddress;
  console.log("User ID", userID)
  console.log("payment Address", paymentAddress)
  connection.query('update `user` set `user`.payment_address = ? WHERE user_id = ?', [paymentAddress, userID], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on insertion into DB Users" })

    } else {
      console.log(results)
      res.redirect('/userProfile/' + userID);
    }
  });
}

exports.updateUserProfile = function (req, res) {
  console.log("total Input", req.body);
  var session = req.session;
  var userID = session.user_id;
  var interests = req.body.interest;
  var levels = req.body.level;
  var userCategoryInterest = [];
  if (typeof interests !== 'undefined') {
    for (let i = 0; i < interests.length; i++) {
      var row = []
      row.push(interests[i])
      row.push(userID)
      row.push(levels[interests[i] - 1])

      userCategoryInterest.push(row)
    }
  }

  connection.query('delete from user_category WHERE user_id = ?', [userID], function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on insertion into DB Users" })

    } else {
      if (userCategoryInterest.length > 0) {
        connection.query('INSERT INTO user_category (category_id, user_id, level) VALUES ?', [userCategoryInterest], function (error, results, fields) {
          if (error) {
            console.log("error ocurred", error);
            res.render("error", { errorMsg: "Error on insertion into DB Users" })

          } else {
            connection.query('update `user` set `user`.payment_address = ?, `user`.headline = ? WHERE user_id = ?', [req.body.paymentAddress, req.body.headline, userID], function (error, results, fields) {
              if (error) {
                console.log("error ocurred", error);
                res.render("error", { errorMsg: "Error on insertion into DB Users" })

              } else {
                console.log(results)
                res.redirect('/userProfile/' + userID);
              }
            });
          }
        });
      } else {
        connection.query('update `user` set `user`.payment_address = ?, `user`.headline = ? WHERE user_id = ?', [req.body.paymentAddress, req.body.headline, userID], function (error, results, fields) {
          if (error) {
            console.log("error ocurred", error);
            res.render("error", { errorMsg: "Error on insertion into DB Users" })

          } else {
            console.log(results)
            res.redirect('/userProfile/' + userID);
          }
        });
      }

    }
  });
}


exports.getAllCategory = function (req, res) {

  connection.query('select * from category', function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on insertion into DB Users" })

    } else {
      console.log(results)
      res.send({ 'categories': results });
    }
  });
}

exports.getAllCategoryWithUserCat = function (req, res) {
  var category;
  var userCategory;
  var session = req.session;
  var userID = session.user_id;
  connection.query('select * from category', function (error, results, fields) {
    if (error) {
      console.log("error ocurred", error);
      res.render("error", { errorMsg: "Error on insertion into DB Users" })

    } else {
      category = results;
      connection.query('select * from user_category where user_id = ?', [userID], function (error, results, fields) {
        if (error) {
          console.log("error ocurred", error);
          res.render("error", { errorMsg: "Error on insertion into DB Users" })

        } else {
          userCategory = results;
          res.send({
            "allCategories": category,
            "userCategories": userCategory,
          })
        }
      });
    }
  });
}

// module.exports = router;
