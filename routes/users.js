var express = require("express");
var md5 = require("md5");
var ubs = require("../libs/UserBalanceService");

exports.userRegister = function(req, res) {
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
        company_id: 0,
        firstname: "",
        lastname: "",
        user_name: req.body.user_name,
        user_email: req.body.user_email,
        user_phone: req.body.user_phone,
        password: md5(req.body.password),
        payment_address: "",
        is_reviewer: 0,
    };

    connection.query("select COUNT(*) as number from user where `user`.user_email = ?", req.body.user_email, function(
        error,
        results,
        fields,
    ) {
        if (error) {
            console.log("error ocurred", error);
            res.status(500).send({ error: "you have an error" });
        } else {
            if (results[0].number == 0) {
                connection.query(
                    "select COUNT(*) as number from user where `user`.user_name = ?",
                    req.body.user_name,
                    function(error, results, fields) {
                        if (error) {
                            console.log("error ocurred", error);
                            // res.redirect('/error');
                            res.status(500).send({
                                error: "you have an error",
                            });
                        } else {
                            if (results[0].number == 0) {
                                connection.query("INSERT INTO user SET ?", userInfo, function(error, results, fields) {
                                    if (error) {
                                        // res.render("error", { errorMsg: "Error on insertion into DB Users code " })
                                        console.log("error ocurred changes", error);
                                        res.status(500).send({
                                            error: "you have an error",
                                        });
                                    } else {
                                        console.log("The information saved successfully", results);
                                        res.send({
                                            msg: "success",
                                        });
                                    }
                                });
                            } else {
                                console.log("duplicate user name", req.body.user_name);
                                res.send({
                                    msg: "duplicateUserName",
                                });
                            }
                        }
                    },
                );
            } else {
                console.log("duplicate user Email", req.body.user_email);
                res.send({
                    msg: "duplicateUserEmail",
                });
            }
        }
    });

    // }
};

exports.getCompanies = function(req, res) {
    connection.query("select company_id, company_name from company", function(error, results, fields) {
        if (error) {
            console.log("error ocurred", error);
            res.render("error", {
                errorMsg: "Error on insertion into DB Users",
            });
        } else {
            //console.log(results)
            res.send(results);
        }
    });
};

exports.getRecommendations = function(req, res) {
    var resData = {};
    var Client = require("node-rest-client").Client;
    var client = new Client();
    var solr_host = global.config.search_solr_host;
    var session = req.session;
    var userID = session.user_id;
    new Promise((resolve, reject) => {
        connection.query("select category_id from user_category where user_id=?", [userID], function(
            error,
            results,
            fields,
        ) {
            if (error) {
                reject(error);
                res.render("error", {
                    errorMsg: "Error on finding user categories",
                });
            } else {
                results = results.map(function(value) {
                    return value["category_id"];
                });
                if (results.length == 0) resolve([1, 2]);
                else resolve(results);
            }
        });
    })
        .catch(error => {
            console.log(error);
            console.log("Error reached.");
        })
        .then(results => {
            new Promise((resolve, reject) => {
                connection.query(
                    "select keyword from keywords where category_id =" + results.join(" or category_id="),
                    function(error, results, fields) {
                        if (error) {
                            reject(error);
                        } else {
                            results = results.map(function(value) {
                                return value["keyword"];
                            });
                            resolve(results);
                        }
                    },
                );
            })
                .catch(error => console.log(error))
                .then(all => {
                    function getRandom() {
                        var randomIndex = Math.floor(Math.random() * all.length);
                        return all.splice(randomIndex, 1)[0];
                    }
                    var keywords = [];
                    var maxLength = all.length;
                    for (var i = 0; i < Math.min(maxLength, 5); i++) {
                        keywords.push(getRandom());
                    }

                    var category = "article";

                    function getLink(keywords, numShow) {
                        var url =
                            solr_host +
                            "/select?fl=title,%20url,%20category&q=category:" +
                            encodeURI(category) +
                            "%20AND%20(search_content:" +
                            encodeURI(" " + keywords.join(" OR search_content: ") + ")") +
                            "&rows=" +
                            encodeURI(numShow) +
                            "&wt=json";
                        return url;
                    }
                    keywords = new Set(keywords);
                    keywords = [...keywords];
                    resData.keywords = keywords;
                    var url = getLink(keywords, 10);

                    function makePromise(url) {
                        var p = new Promise((resolve, reject) => {
                            // request is asynchronous
                            var client = new Client();
                            console.log("dddd---url:", url);
                            var r = client.get(url, function(data, response) {
                                var docs = JSON.parse(data).response.docs;
                                resolve(docs);
                            });

                            r.on("requestTimeout", function(r) {
                                console.log("request expired.");
                                r.abort();
                                reject();
                            });

                            r.on("error", function(err) {
                                console.log("request error", error);
                                reject();
                            });
                        }).catch(error => {
                            console.log(error);
                        });
                        return p;
                    }

                    var combined = makePromise(url);

                    function shuffle(array) {
                        var counter = array.length;
                        // While there are elements in the array
                        while (counter > 0) {
                            // Pick a random index
                            var index = Math.floor(Math.random() * counter);

                            // Decrease counter by 1
                            counter--;

                            // And swap the last element with it
                            var temp = array[counter];
                            array[counter] = array[index];
                            array[index] = temp;
                        }
                        return array;
                    }

                    combined
                        .catch(function(error) {
                            console.log(error);
                        })
                        .then(function(values) {
                            var recommendations = shuffle(values).slice(0, 6);
                            resData.recommendations = recommendations;
                            res.send(resData);
                        });
                });
        });
};

exports.getJobRecommendations = function(req, res) {
    var Client = require("node-rest-client").Client;
    var client = new Client();
    var solr_host = global.config.search_solr_host;
    var session = req.session;
    var userID = session.user_id;
    new Promise((resolve, reject) => {
        connection.query("select category_id from user_category where user_id=?", [userID], function(
            error,
            results,
            fields,
        ) {
            if (error) {
                reject(error);
                res.render("error", {
                    errorMsg: "Error on finding user categories",
                });
            } else {
                results = results.map(function(value) {
                    return value["category_id"];
                });
                if (results.length == 0) resolve([1, 2]);
                else resolve(results);
            }
        });
    })
        .catch(error => {
            console.log(error);
            console.log("Error reached.");
        })
        .then(results => {
            new Promise((resolve, reject) => {
                connection.query(
                    "select keyword from keywords where category_id =" + results.join(" or category_id="),
                    function(error, results, fields) {
                        if (error) {
                            reject(error);
                        } else {
                            results = results.map(function(value) {
                                return value["keyword"];
                            });
                            resolve(results);
                        }
                    },
                );
            })
                .catch(error => console.log(error))
                .then(all => {
                    function getRandom() {
                        var randomIndex = Math.floor(Math.random() * all.length);
                        return all.splice(randomIndex, 1)[0];
                    }
                    var keywords = [];
                    var maxLength = all.length;
                    for (var i = 0; i < Math.min(maxLength, 5); i++) {
                        keywords.push(getRandom());
                    }

                    var category = "job";

                    function getLink(keywords, numShow) {
                        var url =
                            solr_host +
                            "/select?fl=title,%20url,%20category&q=category:" +
                            encodeURI(category) +
                            "%20AND%20(search_content:" +
                            encodeURI(" " + keywords.join(" OR search_content: ") + ")") +
                            "&rows=" +
                            encodeURI(numShow) +
                            "&wt=json";
                        return url;
                    }

                    var url = getLink(keywords, 10);

                    function makePromise(url) {
                        var p = new Promise((resolve, reject) => {
                            // request is asynchronous
                            var client = new Client();
                            var r = client.get(url, function(data, response) {
                                var docs = JSON.parse(data).response.docs;
                                resolve(docs);
                            });

                            r.on("requestTimeout", function(r) {
                                console.log("request expired.");
                                r.abort();
                                reject();
                            });

                            r.on("error", function(err) {
                                console.log("request error", error);
                                reject();
                            });
                        }).catch(error => {
                            console.log(error);
                        });
                        return p;
                    }

                    var combined = makePromise(url);

                    function shuffle(array) {
                        var counter = array.length;
                        // While there are elements in the array
                        while (counter > 0) {
                            // Pick a random index
                            var index = Math.floor(Math.random() * counter);

                            // Decrease counter by 1
                            counter--;

                            // And swap the last element with it
                            var temp = array[counter];
                            array[counter] = array[index];
                            array[index] = temp;
                        }
                        return array;
                    }

                    combined
                        .catch(function(error) {
                            console.log(error);
                        })
                        .then(function(values) {
                            var recommendations = shuffle(values).slice(0, 4);
                            res.send(recommendations);
                        });
                });
        });
};

exports.recordClick = function(req, res) {
    var body = req.body;
    var session = req.session;
    var session_id = req.sessionID;
    var userID = session.user_id;
    var id = body.id;
    var type = body.type;

    String.prototype.hashCode = function() {
        var hash = 0;
        if (this.length == 0) {
            return hash;
        }
        for (var i = 0; i < this.length; i++) {
            var char = this.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    };

    var hashID = id.hashCode();

    connection.query("select doc_id from documents where doc_id=?", [hashID], function(error, results, fields) {
        if (error) console.log("error occured", error);
        else if (results.length == 0) {
            connection.query("INSERT INTO documents (doc_id, type, link) VALUES (?)", [[hashID, type, id]], function(
                error,
                results,
                fields,
            ) {
                if (error) {
                    console.log("error ocurred", error);
                } else console.log("Success on recoding doc");
            });
        } else {
        }
        //console.log(results)
    });

    if (userID == undefined) {
        userID = -1;
    }

    connection.query(
        "INSERT INTO click (user_id, doc_id, session_id, timestamp) VALUES (?, ?, ?, NOW())",
        [userID, hashID, session_id],
        function(error, results, fields) {
            if (error) {
                console.log("error ocurred", error);
            } else console.log("Success on recoding click");
        },
    );

    res.send();
};

exports.checkDuplicatePayment = function(req, res) {
    var paymentAddress = req.body.paymentAddress;
    var session = req.session;
    connection.query("select user_id from user where payment_address = ?", [paymentAddress], function(
        error,
        results,
        fields,
    ) {
        if (error) {
            console.log("error ocurred", error);
            res.render("error", {
                errorMsg: "Error on getting data from DB user table",
            });
        } else {
            console.log("payment address is", paymentAddress);
            console.log("rows found", results.length);
            var sendingData = false;
            if (results.length >= 2) {
                sendingData = false;
            } else if (results.length == 1) {
                if (results[0].user_id == session.user_id) {
                    sendingData = true;
                } else {
                    sendingData = false;
                }
            } else {
                sendingData = true;
            }

            res.send({
                sendingData: sendingData,
            });
        }
    });
};

exports.checkDuplicatePublicID = function(req, res) {
    const public_id = req.body.public_id;
    console.log(public_id);
    connection.query("select profile_id from connections where profile_id = ?", [public_id], async function(
        error,
        results,
        fields,
    ) {
        if (error) {
            console.log("error ocurred", error);
            res.render("error", {
                errorMsg: "Error on getting data from connections.",
            });
        } else {
            await results;
            if (results.length == 0) {
                const repeat = false;
                res.send({
                    repeat,
                });
            } else {
                const repeat = true;
                res.send({
                    repeat,
                });
            }
        }
    });
};

exports.userProfile = (req, res) => {
    // user access their own profile while logged in
    if (req.params.user_id == req.session.user_id && req.session.user_id != null) {
        accessProfile(req.session.user_id);
    }
    // user wants to access a public profile
    else if (req.params.user_id != null) {
        if (isNaN(req.params.user_id)) {
            connection.query(
                "select user.user_id, show_profile from connections inner join user on user.user_id=connections.user_id and user.user_name = ?",
                [req.params.user_id],
                (error, results, fields) => {
                    if (error) {
                        console.log(error);
                    } else if (!results[0]) {
                        res.render("error", {
                            errorMsg: "User has made their profile private or your url is incorrect.",
                            showError: true,
                        });
                        return;
                    } else if (results[0].show_profile === 1) {
                        accessProfile(results[0].user_id);
                    } else if (results[0].user_id === req.session.user_id) {
                        accessProfile(results[0].user_id);
                    } else {
                        res.render("error", {
                            errorMsg:
                                "User has made their profile private. You cannot send messages to them or view their profile.",
                            showError: true,
                        });
                        return;
                    }
                },
            );
        } else {
            connection.query(
                "select user_id, show_profile from connections where user_id = ?",
                [req.params.user_id],
                (error, results, fields) => {
                    if (error) {
                        console.log(error);
                    } else if (!results[0]) {
                        console.log("No results found 2.");
                        res.redirect("/loginRegister");
                        return;
                    } else if (results[0].show_profile == 1) {
                        accessProfile(results[0].user_id);
                    } else {
                        res.render("error", {
                            errorMsg:
                                "User has made their profile private. You cannot send messages to them or view their profile.",
                            showError: true,
                        });
                        return;
                    }
                },
            );
        }
        return;
    } else {
        res.redirect("/loginRegister");
        return;
    }

    function accessProfile(user) {
        const userID = user;
        const session = req.session;
        global.userBalanceMap = {};
        //prepare balance info in a map

        ubs.usersBalance().then(results => {
            console.log("user balances:", results);
            for (let i in results.data) {
                global.userBalanceMap[results.data[i].user_id] = results.data[i].balance;
            }

            user_token_balance = global.userBalanceMap[userID];

            console.log(
                "userProfile balance Map..:",
                global.userBalanceMap,
                "useid:",
                userID,
                "balance:",
                user_token_balance,
            );
        });

        function changeLevelNames(level) {
            switch (level) {
                case "Brozen":
                    return "Easy";
                case "Silver":
                    return "Average";
                case "Gold":
                    return "Hard";
                case "Diamond":
                    return "Very Hard";
                default:
                    return "";
            }
        }

        var resultObj = {};
        resultObj["private"] = user !== req.session.user_id;
        connection.query("select * from user where user_id=?", [userID], function(error, results, fields) {
            if (error) {
                console.log("error ocurred", error);
                res.render("error", {
                    errorMsg: "Error on insertion into DB Users",
                });
            } else {
                resultObj["userProfile"] = results;
                connection.query(
                    "SELECT (select count(*) from challenge where challenge.post_user_id = ?) as total_challenge, (select COUNT(*) FROM answer where answer.post_user_id = ?) as total_answer",
                    [userID, userID],
                    function(error, results, fields) {
                        if (error) {
                            console.log("error ocurred", error);
                            res.render("error", {
                                errorMsg: "Error on insertion into DB Users",
                            });
                        } else {
                            resultObj["questions"] = results[0].total_challenge;
                            resultObj["answers"] = results[0].total_answer;
                            connection.query(
                                "select challenge.*, `user`.user_name, `user`.user_id, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answers from challenge join `user` on challenge.post_user_id = `user`.user_id where `user`.user_id = ? ORDER BY posting_date DESC",
                                [userID],
                                function(error, results, fields) {
                                    if (error) {
                                        console.log("error ocurred", error);
                                        res.render("error", {
                                            errorMsg: "Error on insertion into DB Users",
                                        });
                                    } else {
                                        // change display title
                                        results.forEach(dict => {
                                            dict.level = changeLevelNames(dict.level);
                                        });

                                        resultObj["allQuestions"] = results;
                                        // console.log('Total data from the userProfile request: ', resultObj);
                                        connection.query(
                                            "select challenge.*, (select count(*) from answer where answer.challenge_id = challenge.challenge_id) as total_answer  from challenge join answer on challenge.challenge_id = answer.challenge_id where answer.post_user_id = ? GROUP BY challenge_id ORDER BY posting_date",
                                            [userID],
                                            function(error, results, fields) {
                                                if (error) {
                                                    console.log("error ocurred", error);
                                                    res.render("error", {
                                                        errorMsg: "Error on insertion into DB Users",
                                                    });
                                                } else {
                                                    // change display title
                                                    results.forEach(dict => {
                                                        dict.level = changeLevelNames(dict.level);
                                                    });

                                                    resultObj["allansweredQuestions"] = results;
                                                    // console.log('Total data from the userProfile request: ', resultObj);
                                                    connection.query(
                                                        "select user_category.category_id, user_category.`level`, category.category_name from user_category join category on user_category.category_id = category.id where user_id = ?",
                                                        [userID],
                                                        function(error, results, fields) {
                                                            if (error) {
                                                                console.log("error ocurred", error);
                                                                res.render("error", {
                                                                    errorMsg: "Error on insertion into DB Users",
                                                                });
                                                            } else {
                                                                results.forEach(dict => {
                                                                    dict.level = changeLevelNames(dict.level);
                                                                });

                                                                resultObj["userCategory"] = results;
                                                                console.log(
                                                                    "user category from userProfile request: ",
                                                                    results,
                                                                );
                                                                connection.query(
                                                                    "select id from messages where receiver_id = ?",
                                                                    [userID],
                                                                    (error, results, fields) => {
                                                                        if (error) {
                                                                            console.log(error);
                                                                        } else {
                                                                            resultObj["in_message_count"] =
                                                                                results.length;
                                                                            connection.query(
                                                                                "select id from messages where sender_id = ?",
                                                                                [userID],
                                                                                (error, results, fields) => {
                                                                                    if (error) {
                                                                                        console.log(error);
                                                                                    } else {
                                                                                        resultObj["out_message_count"] =
                                                                                            results.length;

                                                                                        res.render("userProfile", {
                                                                                            data: resultObj,
                                                                                            user_token_balance: user_token_balance,
                                                                                        });
                                                                                    }
                                                                                },
                                                                            );
                                                                        }
                                                                    },
                                                                );
                                                            }
                                                        },
                                                    );
                                                }
                                            },
                                        );
                                    }
                                },
                            );
                        }
                    },
                );
            }
        });
    }
};

/**
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
**/

exports.tokenRanking = function(req, res) {
    connection.query(
        "select `user`.*, (select balance from user_balance b where b.user_id = `user`.user_id and balance_id in (select max(balance_id) from user_balance group by user_id)) as total from `user` ORDER BY total DESC limit 5",
        function(error, results, fields) {
            //connection.query('select `user`.*, ((select count(*) as total from challenge where post_user_id = `user`.user_id) + (select count(*) as total from answer where post_user_id = `user`.user_id)) as total from `user` ORDER BY total DESC limit 5', function (error, results, fields) {
            if (error) {
                console.log("error ocurred", error);
                res.render("error", {
                    errorMsg: "Error on insertion into DB Users",
                });
            } else {
                //console.log(results)
                res.send({ users: results });
            }
        },
    );
};

exports.updateUserProfile = function(req, res) {
    console.log("total Input", req.body);

    var session = req.session;
    var userID = session.user_id;
    var interests = req.body.interest;
    var levels = req.body.level;
    levels = levels.map(function(n) {
        return n !== "" ? n : "Brozen";
    });
    var userCategoryInterest = [];
    if (typeof interests !== "undefined") {
        for (let i = 0; i < interests.length; i++) {
            var row = [];
            row.push(interests[i]);
            row.push(userID);
            row.push(levels[i]);

            userCategoryInterest.push(row);
        }
    }

    connection.query("delete from user_category WHERE user_id = ?", [userID], function(error, results, fields) {
        if (error) {
            console.log("error ocurred", error);
            res.render("error", {
                errorMsg: "Error on insertion into DB Users",
            });
        } else {
            //Update category
            if (userCategoryInterest.length > 0) {
                connection.query(
                    "INSERT INTO user_category (category_id, user_id, level) VALUES ?",
                    [userCategoryInterest],
                    function(error, results, fields) {
                        if (error) {
                            console.log("error ocurred", error);
                            res.render("error", {
                                errorMsg: "Error on insertion into DB Users",
                            });
                        }
                    },
                );
            }

            const showProfile = req.body.showProfile;
            connection.query("delete from connections where user_id = ?", [userID], (error, results, fields) => {
                if (error) {
                    console.log("error ocurred", error);
                    res.render("error", {
                        errorMsg: "Error on deletion",
                    });
                } else {
                    connection.query(
                        "INSERT INTO connections (user_id, show_profile) VALUES (?)",
                        [[userID, showProfile.length === 2 ? 1 : 0]],
                        // only send 1 if both 1 and 0 are received as checkbox vals
                        (error, results, fields) => {
                            if (error) {
                                console.log("error ocurred", error);
                                res.render("error", {
                                    errorMsg: "Error on insertion into DB Users",
                                });
                            }
                        },
                    );
                }
            });

            //Update Payment, headline etc.
            var headline_interest = req.body.headline_interest;
            var headline_status = req.body.headline_status;
            var headline = headline_status + " - " + headline_interest;
            connection.query(
                "update `user` set `user`.payment_address = ?, `user`.headline = ? WHERE user_id = ?",
                [req.body.paymentAddress, headline, userID],
                function(error, results, fields) {
                    if (error) {
                        console.log("error ocurred", error);
                        res.render("error", {
                            errorMsg: "Error on insertion into DB Users",
                        });
                    } else {
                        //console.log(results)
                        session.wallet = req.body.paymentAddress;
                        res.redirect("/userProfile/" + userID);
                    }
                },
            );
        }
    });
};

exports.getAllCategory = function(req, res) {
    connection.query("select * from category", function(error, results, fields) {
        if (error) {
            console.log("error ocurred", error);
            res.render("error", {
                errorMsg: "Error on insertion into DB Users",
            });
        } else {
            //console.log(results)
            res.send({ categories: results });
        }
    });
};

exports.getAllCategoryWithUserCat = function(req, res) {
    var category;
    var userCategory;
    var session = req.session;
    var userID = session.user_id;
    connection.query("select * from category", function(error, results, fields) {
        if (error) {
            console.log("error ocurred", error);
            res.render("error", {
                errorMsg: "Error on insertion into DB Users",
            });
        } else {
            category = results;
            connection.query("select * from user_category where user_id = ?", [userID], function(
                error,
                results,
                fields,
            ) {
                if (error) {
                    console.log("error ocurred", error);
                    res.render("error", {
                        errorMsg: "Error on insertion into DB Users",
                    });
                } else {
                    userCategory = results;
                    res.send({
                        allCategories: category,
                        userCategories: userCategory,
                    });
                }
            });
        }
    });
};

exports.sendMessage = (req, res) => {
    const userID = req.session.user_id;
    const msg = req.body.msg;
    connection.query("select user_id from user where user_name = ?", [req.body.receiver], (error, results, fields) => {
        if (error) {
            console.log(error);
            res.send({ result: "Message not sent." });
        } else {
            const receiverID = results[0].user_id;
            connection.query(
                "insert into messages (sender_id, receiver_id, message, timestamp) values (?, ?, ?, NOW())",
                [userID, receiverID, msg],
                (error, results, fields) => {
                    if (error) {
                        console.log(error);
                        res.send({ result: "Message not sent." });
                    } else {
                        console.log("Message sent successfully.");
                        res.send({ result: "Message sent." });
                    }
                },
            );
        }
    });
};

exports.messages = (req, res, isInbox) => {
    const userID = req.session.user_id;
    const userType = isInbox ? "receiver_id" : "sender_id";
    const displayedType = !isInbox ? "receiver_id" : "sender_id";
    connection.query(
        "select message, " +
            displayedType +
            ", timestamp from messages where " +
            userType +
            " = ? order by timestamp desc",
        [userID],
        (error, results, fields) => {
            if (error) {
                console.log(error);
            } else if (results.length > 0) {
                const data = results;
                const users = [];
                data.forEach(dict => {
                    users.push(dict[displayedType]);
                });
                console.log(data);
                connection.query(
                    "select user_name, user_id from user where user_id in (?)",
                    [users],
                    (error, results, fields) => {
                        id_name_map = {};
                        results.forEach(dict => {
                            id_name_map[dict.user_id] = dict.user_name;
                        });
                        data.forEach(dict => {
                            dict.user_id = id_name_map[dict[displayedType]];
                        });
                        res.render("messages", { data, isInbox });
                    },
                );
            } else {
                res.render("messages", {});
            }
        },
    );
};

// module.exports = router;
