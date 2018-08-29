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

    connection.query(
        "select COUNT(*) as number from user where `user`.user_email = ?",
        req.body.user_email,
        (error, results, fields) => {
            if (error) {
                console.log("error ocurred", error);
                res.status(500).send({ error: "you have an error" });
            } else {
                if (results[0].number == 0) {
                    connection.query(
                        "select COUNT(*) as number from user where `user`.user_name = ?",
                        req.body.user_name,
                        (error, results, fields) => {
                            if (error) {
                                console.log("error ocurred", error);
                                // res.redirect('/error');
                                res.status(500).send({
                                    error: "you have an error",
                                });
                            } else {
                                if (results[0].number == 0) {
                                    connection.query("INSERT INTO user SET ?", userInfo, (error, results, fields) => {
                                        if (error) {
                                            console.log("error ocurred changes", error);
                                            res.status(500).send({
                                                error: "you have an error",
                                            });
                                        } else {
                                            const userData = results;
                                            connection.query(
                                                "select user_id from user where user_name = ?",
                                                [req.body.user_name],
                                                (error, results, fields) => {
                                                    if (error) {
                                                        console.log(error);
                                                    } else {
                                                        const userID = results[0].user_id;
                                                        connection.query(
                                                            "insert into connections(user_id, show_profile) values (?)",
                                                            [[userID, 1]],
                                                            (error, results, fields) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                } else {
                                                                    console.log(
                                                                        "The information saved successfully",
                                                                        userData,
                                                                    );
                                                                    res.send({
                                                                        msg: "success",
                                                                    });
                                                                }
                                                            },
                                                        );
                                                    }
                                                },
                                            );
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
        },
    );

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

exports.getConnectionRecommendations = userID => {
    return new Promise((resolve, reject) => {
        connection.query(
            "select suggested_user, user_name, firstname, lastname, headline, category_name" +
                " from user_recommendations inner join user t2 on suggested_user = t2.user_id" +
                " inner join connections t3 on t3.user_id = t2.user_id" +
                " left join user_category t4 on t3.user_id = t4.user_id" +
                " left join category t5 on t4.category_id = t5.id" +
                " where user_recommendations.user_id = ? and show_profile = 1" +
                " order by suggested_user",
            [userID],
            (error, results, fields) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            },
        );
    });
};

exports.getRecommendations = (req, res) => {
    const resData = {};
    const Client = require("node-rest-client").Client;
    const client = new Client();
    const solr_host = global.config.search_solr_host;
    const session = req.session;
    const userID = session.user_id;
    new Promise((resolve, reject) => {
        connection.query(
            "select category_id from user_category where user_id=?",
            [userID],
            (error, results, fields) => {
                if (error) {
                    reject(error);
                    res.render("error", {
                        errorMsg: "Error on finding user categories",
                    });
                } else {
                    results = results.map(value => {
                        return value["category_id"];
                    });
                    if (results.length == 0) resolve([1, 2]);
                    else resolve(results);
                }
            },
        );
    })
        .catch(error => {
            console.log(error);
        })
        .then(results => {
            new Promise((resolve, reject) => {
                connection.query(
                    "select keyword from keywords where category_id =" + results.join(" or category_id="),
                    (error, results, fields) => {
                        if (error) {
                            reject(error);
                        } else {
                            results = results.map(value => {
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
                        const randomIndex = Math.floor(Math.random() * all.length);
                        return all.splice(randomIndex, 1)[0];
                    }
                    let keywords = [];
                    const maxLength = all.length;
                    for (let i = 0; i < Math.min(maxLength, 5); i++) {
                        keywords.push(getRandom());
                    }

                    const category = "(article OR White_Paper)";

                    function getLink(keywords, numShow) {
                        const url =
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
                    const url = getLink(keywords, 6);

                    function makePromise(url) {
                        const p = new Promise((resolve, reject) => {
                            // request is asynchronous
                            const client = new Client();
                            const r = client.get(url, (data, response) => {
                                const docs = JSON.parse(data).response.docs;
                                resolve(docs);
                            });

                            r.on("requestTimeout", r => {
                                console.log("request expired.");
                                r.abort();
                                reject();
                            });

                            r.on("error", error => {
                                console.log("request error", error);
                                reject();
                            });
                        }).catch(error => {
                            console.log(error);
                        });
                        return p;
                    }

                    function getPPRRecs() {
                        return new Promise((resolve, reject) => {
                            const recs = [];
                            connection.query(
                                "select link from doc_recommendations where user_id = ?",
                                [userID],
                                (error, results, fields) => {
                                    if (error) {
                                        console.log(error);
                                        reject(error);
                                    } else {
                                        for (let i = 0; i < Math.min(results.length, 6); i++) {
                                            recs.push({ url: results[i].link });
                                        }
                                        resolve(recs);
                                    }
                                },
                            );
                        });
                    }

                    const combined = [];
                    combined.push(makePromise(url));
                    combined.push(getPPRRecs());

                    function shuffle(array) {
                        let counter = array.length;
                        // While there are elements in the array
                        while (counter > 0) {
                            // Pick a random index
                            const index = Math.floor(Math.random() * counter);

                            // Decrease counter by 1
                            counter--;

                            // And swap the last element with it
                            const temp = array[counter];
                            array[counter] = array[index];
                            array[index] = temp;
                        }
                        return array;
                    }

                    Promise.all(combined)
                        .catch(error => {
                            console.log(error);
                        })
                        .then(values => {
                            values = values[0].concat(values[1]);
                            const recommendations = shuffle(values).slice(0, 6);
                            resData.recommendations = recommendations;
                            for (let i = 0; i < recommendations.length; i++) {
                                if (String(recommendations[i].url).startsWith("http")) {
                                } else {
                                    recommendations[i].url =
                                        "/resource/" + recommendations[i].category + "/" + recommendations[i].title;
                                }
                            }
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
                    const keywords = [];
                    const maxLength = all.length;
                    for (var i = 0; i < Math.min(maxLength, 5); i++) {
                        keywords.push(getRandom());
                    }

                    const category = "job_postings";

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

                    const url = getLink(keywords, 10);

                    function makePromise(url) {
                        var p = new Promise((resolve, reject) => {
                            // request is asynchronous
                            var client = new Client();
                            var r = client.get(url, function(data, response) {
                                var docs = JSON.parse(data).response.docs;
                                console.log(docs);
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

exports.recordClick = (req, res) => {
    const body = req.body;
    const session = req.session;
    const session_id = req.sessionID;
    let userID = session.user_id;
    const id = body.id;
    const type = body.type;
    const title = body.title;

    String.prototype.hashCode = function() {
        let hash = 0;
        if (this.length === 0) {
            return hash;
        }
        for (let i = 0; i < this.length; i++) {
            const char = this.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    };

    const hashID = id.hashCode();

    connection.query("select doc_id from documents where doc_id=?", [hashID], (error, results, fields) => {
        if (error) console.log("error occured", error);
        else if (results.length === 0) {
            connection.query(
                "INSERT INTO documents (doc_id, title, type, link) VALUES (?)",
                [[hashID, title, type, id]],
                (error, results, fields) => {
                    if (error) {
                        console.log("error ocurred", error);
                    } else console.log("Success on recoding doc");
                },
            );
        } else if (results[0].title === "Empty") {
            connection.query(
                "UPDATE documents SET title = ? WHERE doc_id = ?",
                [[title, hashID]],
                (error, results, fields) => {
                    if (error) {
                        console.log("error ocurred", error);
                    } else console.log("Success on updating doc");
                },
            );
        }
        //console.log(results)
    });

    if (typeof userID === "undefined") {
        userID = -1;
    }

    connection.query(
        "INSERT INTO click (user_id, doc_id, session_id, timestamp) VALUES (?, ?, ?, NOW())",
        [userID, hashID, session_id],
        (error, results, fields) => {
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
                                                                                        connection.query(
                                                                                            "select count(*) from user_recommendations inner join user t2 on suggested_user = t2.user_id inner join connections t3 on t3.user_id = t2.user_id where user_recommendations.user_id = ? and show_profile = 1;",
                                                                                            [userID],
                                                                                            (
                                                                                                error,
                                                                                                results,
                                                                                                fields,
                                                                                            ) => {
                                                                                                if (error) {
                                                                                                    console.log(error);
                                                                                                } else {
                                                                                                    resultObj[
                                                                                                        "suggest_count"
                                                                                                    ] =
                                                                                                        results[0][
                                                                                                            "count(*)"
                                                                                                        ];
                                                                                                    connection.query(
                                                                                                        "select show_profile from connections where user_id = ?",
                                                                                                        [userID],
                                                                                                        (
                                                                                                            error,
                                                                                                            results,
                                                                                                            fields,
                                                                                                        ) => {
                                                                                                            if (error) {
                                                                                                                console.log(
                                                                                                                    error,
                                                                                                                );
                                                                                                            } else if (results.length > 0) {
                                                                                                                resultObj.show_profile =
                                                                                                                    results[0].show_profile;
                                                                                                                res.render(
                                                                                                                    "userProfile",
                                                                                                                    {
                                                                                                                        data: resultObj,
                                                                                                                        user_token_balance: user_token_balance,
                                                                                                                    },
                                                                                                                );
                                                                                                            } else {
                                                                                                                resultObj.show_profile = 0;
                                                                                                                res.render(
                                                                                                                    "userProfile",
                                                                                                                    {
                                                                                                                        data: resultObj,
                                                                                                                        user_token_balance: user_token_balance,
                                                                                                                    }, 
                                                                                                                )
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

exports.submitEmail = (req, res) => {
    if (
        req.body["g-recaptcha-response"] === undefined ||
        req.body["g-recaptcha-response"] === "" ||
        req.body["g-recaptcha-response"] === null
    ) {
        console.log("Please select captcha");
        return res.json({ responseCode: 1, responseDesc: "Please select captcha" });
    }
    var givenString = req.body.emailorUsername;
    // Put your secret key here.
    var secretKey = global.config.secretKey;
    // req.connection.remoteAddress will provide IP address of connected user.
    var verificationUrl =
        "https://www.google.com/recaptcha/api/siteverify?secret=" +
        secretKey +
        "&response=" +
        req.body["g-recaptcha-response"] +
        "&remoteip=" +
        req.connection.remoteAddress;
    // Hitting GET request to the URL, Google will respond with success or error scenario.
    var request = require("request");
    request(verificationUrl, function(error, response, body) {
        body = JSON.parse(body);
        // Success will be true or false depending upon captcha validation.
        if (body.success !== undefined && !body.success) {
            return res.json({
                responseCode: 1,
                responseDesc: "Failed captcha verification. Please reload your browser and try again.",
            });
        } else {
            connection.query(
                "select user_id, user_email, user_name from user where user_email = ? or user_name = ?",
                [givenString, givenString],
                function(error, results, fields) {
                    if (error) {
                        console.log(error);
                        return res.json({
                            responseCode: 1,
                            responseDesc: "Something wrong happened. Please try again",
                        });
                    } else if (results.length == 1) {
                        var user_email = results[0].user_email;
                        user_id = results[0].user_id;
                        var user_name = results[0].user_name;
                        var randomstring = require("randomstring");
                        var dateStamp = new Date().valueOf();
                        code = randomstring.generate();
                        code = md5(code + dateStamp);
                        console.log("the code is: ", code);
                        expirationTime = Date.now() + 86400000; // 24 hour
                        var hostname = req.headers.host;
                        connection.query(
                            "INSERT INTO forgetPasswordCode (token, time, user_id) VALUES (?,?,?)",
                            [code, expirationTime, user_id],
                            function(error, results, fields) {
                                if (error) {
                                    console.log("error ocurred", error);
                                    return res.json({
                                        responseCode: 1,
                                        responseDesc: "Something went wrong with Code generation. Please try again.",
                                    });
                                } else {
                                    // load aws sdk
                                    var aws = require("aws-sdk");
                                    // load aws config
                                    aws.config.loadFromPath("config.json");
                                    // load AWS SES
                                    var ses = new aws.SES({ apiVersion: "2010-12-01" });
                                    // send to list
                                    var to = [user_email];
                                    var url = global.config.baseUrl + "resetPassword" + "/" + code;
                                    var emailBody =
                                        "Hi " +
                                        user_name +
                                        "<br><br> To reset your password, Please access this link within 24 hours: <a href='" +
                                        url +
                                        "' target='_blank'> Reset Password </a>";
                                    emailBody =
                                        emailBody +
                                        "<br> <br> Thanks <br>Chainmap Support Team<br><a href='http://chainmap.org/'>Chainmap.org</a>";
                                    emailSubject = "Reset Password link sent!!!";
                                    const params = {
                                        Destination: {
                                            ToAddresses: to,
                                        },
                                        Message: {
                                            Body: {
                                                Html: {
                                                    Charset: "UTF-8",
                                                    Data: emailBody,
                                                },
                                                Text: {
                                                    Charset: "UTF-8",
                                                    Data: "This is the message body in text format.",
                                                },
                                            },
                                            Subject: {
                                                Charset: "UTF-8",
                                                Data: emailSubject,
                                            },
                                        },
                                        ReturnPath: global.config.supportEmail,
                                        Source: global.config.supportEmail,
                                    };
                                    // this sends the email
                                    // @todo - add HTML version
                                    ses.sendEmail(params, (err, data) => {
                                        if (err) {
                                            console.log(err, err.stack);
                                            return res.json({
                                                responseCode: 1,
                                                responseDesc:
                                                    "Something went wrong with sending email. Either you can contact us for the code or you can try the process again. Thanks",
                                            });
                                        } else {
                                            console.log(data);
                                            return res.json({
                                                responseCode: 2,
                                                responseDesc:
                                                    "A link is sent to your email. Please check to reset your password",
                                            });
                                        }
                                    });
                                }
                            },
                        );
                    } else {
                        return res.json({
                            responseCode: 1,
                            responseDesc: "There is no account with this email address",
                        });
                    }
                },
            );
        }
    });
};

exports.resetPassword = (req, res) => {
    var token = req.params.token;
    connection.query("select user_id, token, time from forgetPasswordCode where token = ?", [token], function(
        error,
        results,
        fields,
    ) {
        if (error) {
            console.log(error);
            res.status(500).send({ error: "An unexpected error happened. Please try again." });
        } else if (results.length == 1) {
            var user_id = results[0].user_id;
            var time = results[0].time;
            if (time < Date.now()) {
                res.render("resetPassword", {
                    data: 0,
                });
            } else {
                res.render("resetPassword", {
                    data: 1,
                    user_id: user_id,
                    token: token,
                });
            }
        } else {
            res.render("resetPassword", {
                data: 0,
            });
        }
    });
};

exports.resetPasswordAction = (req, res) => {
    var password = req.body.password;
    var confirmPassword = req.body.confirmpassword;
    var token = req.body.token;
    if (password == "") {
        return res.json({ responseCode: 1, responseDesc: "Password is empty" });
    } else if (password != confirmPassword) {
        return res.json({ responseCode: 1, responseDesc: "Password did not match" });
    } else {
        connection.query("select user_id, token, time from forgetPasswordCode where token = ?", [token], function(
            error,
            results,
            fields,
        ) {
            if (error) {
                console.log(error);
                return res.json({ responseCode: 1, responseDesc: "Something went wrong. Please try again." });
            } else if (results.length == 1) {
                var user_id = results[0].user_id;
                var time = results[0].time;
                var isUsed = results[0].isUsed;
                if (time < Date.now()) {
                    return res.json({ responseCode: 1, responseDesc: "Given code is expired. Please try again." });
                } else {
                    password = md5(password);
                    connection.query(
                        "update `user` set `user`.password = ? WHERE user_id = ?",
                        [password, user_id],
                        (error, results, fields) => {
                            if (error) {
                                console.log(error);
                                return res.json({
                                    responseCode: 1,
                                    responseDesc: "Something went wrong. Please try again.",
                                });
                            } else {
                                connection.query(
                                    "delete from forgetPasswordCode where token = ?",
                                    [token],
                                    (error, results, fields) => {
                                        if (error) {
                                            console.log(error);
                                            return res.json({
                                                responseCode: 1,
                                                responseDesc: "Something went wrong. Please try again.",
                                            });
                                        } else {
                                            return res.json({
                                                responseCode: 2,
                                                responseDesc: "Password Updated Successfully. You can try login.",
                                            });
                                        }
                                    },
                                );
                            }
                        },
                    );
                }
            } else {
                return res.json({ responseCode: 1, responseDesc: "Given code is expired. Please try again." });
            }
        });
    }
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
