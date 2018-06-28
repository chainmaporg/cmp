
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

exports.getAllTrainingMaterial = function (req, res) {
    console.log("Get All MAterials")
	/**GZ: no session management for now
	if(!session.email) {
		return res.redirect("/")
		req.session.error="need to login first"
	}
	**/
    var resultObj = {};
    connection.query('select * from materials WHERE materials.type = ?', ['Infrastructure'], function (error, results, fields) {
        if (error) {
            console.log("error ocurred", { title: 'Error on handling challenge events' });
            res.send({
                "code": 400,
                "failed": "error ocurred"
            })
            //res.render('error');
        } else {
            resultObj['Infrastructure'] = results;
            console.log('The Infrastructure materials are: ', results);
            connection.query('select * from materials  WHERE materials.type = ?', ['General'], function (error, results, fields) {
                if (error) {
                    console.log("error ocurred", { title: 'Error on handling challenge events' });
                    res.send({
                        "code": 400,
                        "failed": "error ocurred"
                    })
                    //res.render('error');
                } else {
                    resultObj['General'] = results;
                    console.log('The General materials are: ', results);
                    res.render('trainingMaterial', { data: resultObj });
                    // connection.query('select * from (select challenge.*, `user`.user_name, `user`.user_id, (SELECT max(answer.posting_date) as maximum FROM answer WHERE answer.challenge_id = challenge.challenge_id) as recent_answer, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answer from challenge join `user` on challenge.post_user_id = `user`.user_id) as innerTable where innerTable.recent_answer is not null', [], function (error, results, fields) {
                    //     if (error) {
                    //         console.log("error ocurred", { title: 'Error on handling challenge events' });
                    //         res.send({
                    //             "code": 400,
                    //             "failed": "error ocurred"
                    //         })
                    //         //res.render('error');
                    //     } else {
                    //         resultObj['mostRecentAnswered'] = results;
                    //         console.log('The Most recent answered challenges are: ', results);
                    //         connection.query('select * from (select challenge.*, `user`.user_name, `user`.user_id, (SELECT COUNT(*) FROM answer WHERE answer.challenge_id = challenge.challenge_id) as total_answer from challenge join `user` on challenge.post_user_id = `user`.user_id) as innerTable where total_answer = 0', [], function (error, results, fields) {
                    //             if (error) {
                    //                 console.log("error ocurred", { title: 'Error on handling challenge events' });
                    //                 res.send({
                    //                     "code": 400,
                    //                     "failed": "error ocurred"
                    //                 })
                    //                 //res.render('error');
                    //             } else {
                    //                 resultObj['NoAnswers'] = results;
                    //                 console.log('Not answered challenges are: ', results);
                    //                 connection.query("", [], function (error, results, fields) {
                    //                     if (error) {
                    //                         console.log("error ocurred", { title: 'Error on handling challenge events' });
                    //                         res.send({
                    //                             "code": 400,
                    //                             "failed": "error ocurred"
                    //                         })
                    //                     } else {
                    //                         resultObj['NoAnswers'] = results;
                    //                         console.log('Not answered challenges are: ', results);
                    //                         res.render('questionBoard', { data: resultObj });
                    //                     }
                    //                 });

                    //             }
                    //         });
                    //     }
                    // });
                }
            });
        }
    });
}




