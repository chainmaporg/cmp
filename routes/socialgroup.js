

exports.getSocialGroup = function (req, res) {
    console.log("Get All getSocialGroup")
    var facebook_resultObj
    var telegram_resultObj
    var reddit_resultObj

    

    //telegram
    connection.query('select * from socialgroup order by followers desc', [], function (error, result, fields) {
        if (error) {
            console.log("error ocurred", { title: 'Error on handling social group telegram' });
            res.send({
                "code": 400,
                "failed": "error ocurred"
            })
            //res.render('error');
        } else { 
            res.render('connectGroup', { data: result})
        }
        
    });
  


}




