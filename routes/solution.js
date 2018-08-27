

var getSolutions = function (req, res) {
    console.log("Access:Solution - access solutions")

    var resultObj = {};
    var solutions={}; 
    connection.query('select * from solutionmap', [], function (error, results, fields) {
        if (error) {
            console.log("error ocurred", { title: 'Error on handling solutionmap' });
            res.send({
                "code": 400,
                "failed": "error ocurred"
            })
            //res.render('error');
        } else {      
        	var data = {}
            var solutions=[]
            for(var i = 0;i < results.length;i++)
            {
            	st = results[i].solution_name;
            	key=st;
    			if(key in data) {
    				data[key].push(results[i]);
    			}
    			else {
    				list=[]
    				list.push(results[i]);
    				data[key]=list
    				solutions.push(key)
    			}
            }
            info= { data: data, solutions: solutions}
            console.log(info)
        	res.render('solution', info); 	
        }
     });
}

exports.getSolutions = getSolutions;


