

var getAllTrainingMaterial = function (req, res, tag) {
    console.log("Get All MAterials")

    var resultObj = {};
    connection.query('select * from materials  where materials.type = ?', [tag], function (error, results, fields) {
        if (error) {
            console.log("error ocurred", { title: 'Error on handling training materisl' });
            res.send({
                "code": 400,
                "failed": "error ocurred"
            })
            //res.render('error');
        } else {
            var data = {}
            var subtypes=[]
            for(var i = 0;i < results.length;i++)
            {
            	st = results[i].subtype;
            	key=st;
    			if(key in data) {
    				data[key].push(results[i]);
    			}
    			else {
    				list=[]
    				list.push(results[i]);
    				data[key]=list
    				subtypes.push(key)
    			}
            }
            info= { data: data, subtypes:subtypes, tag:tag }
            console.log(info)
            res.render('trainingMaterial', info);

         }
    });
}

exports.trainingMaterial_Introduction = function (req, res) {
	getAllTrainingMaterial(req, res, "Introduction");
}

exports.trainingMaterial_Infrastructure = function (req, res) {
	getAllTrainingMaterial(req, res, "Infrastructure");
}

exports.trainingMaterial_Hyperledger = function (req, res) {
	getAllTrainingMaterial(req, res, "Hyperledger");
}

exports.trainingMaterial_Bitcoin = function (req, res) {
	getAllTrainingMaterial(req, res, "Bitcoin");
}
exports.trainingMaterial_Ethereum = function (req, res) {
	getAllTrainingMaterial(req, res, "Ethereum");
}
exports.trainingMaterial_UseCases = function (req, res) {
	getAllTrainingMaterial(req, res, "UseCases");
}
exports.trainingMaterial_OtherProtocol = function (req, res) {
	getAllTrainingMaterial(req, res, "OtherProtocol");
}
exports.trainingMaterial_Training = function (req, res) {
	getAllTrainingMaterial(req, res, "Training");
}



