

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
            connection.query('select * from materials  WHERE materials.type = ?', ['Collection'], function (error, results, fields) {
                if (error) {
                    console.log("error ocurred", { title: 'Error on handling challenge events' });
                    res.send({
                        "code": 400,
                        "failed": "error ocurred"
                    })
                    //res.render('error');
                } else {
                    resultObj['Collection'] = results;
                    console.log('The Collection materials are: ', results);
                    
                    connection.query('select * from materials  WHERE materials.type = ?', ['Use Case/App'], function (error, results, fields) {
                        if (error) {
                            console.log("error ocurred", { title: 'Error on handling challenge events' });
                            res.send({
                                "code": 400,
                                "failed": "error ocurred"
                            })
                            //res.render('error');
                        } else {
                            resultObj['Usecase'] = results;
                            console.log('The Use case materials are: ', results);
                            connection.query('select * from materials  WHERE materials.type = ?', ['Developer Guide'], function (error, results, fields) {
                                if (error) {
                                    console.log("error ocurred", { title: 'Error on handling challenge events' });
                                    res.send({
                                        "code": 400,
                                        "failed": "error ocurred"
                                    })
                                    //res.render('error');
                                } else {
                                    resultObj['DevGuide'] = results;
                                    console.log('The Developer guide materials are: ', results);
                                    res.render('trainingMaterial', { data: resultObj });

                                }
                            });
                        }
                    });
                }
            });
        }
    });
}




