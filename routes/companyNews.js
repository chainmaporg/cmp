exports.getCompanyNews = function (req, res) {
    console.log("Get All chainmap news")
  
   
    connection.query('select type,name, description,event_img_name,event_link from company_events order by created desc', [], function (error, result, fields) {
        if (error) {
            console.log("error ocurred", { title: 'Error on handling social group telegram' });
            res.send({
                "code": 400,
                "failed": "error ocurred"
            })
            //res.render('error');
        } else { 
            res.render('companyNews', { data: result})
        }
        
    });

}
