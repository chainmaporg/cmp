//Env related changes
var chainmap_env = "local";
var chainUrl = "https://testnet.nebulas.io";
//var smartContract_address = "n1hUzRN5otB4CS3zUH97Xa3ob8UT82yGw97";
//var smartContract_address = "n1eP44t9cXuZz2CLbCF6qdHdZVkCvBMN5sE"
var smartContract_address = "n225nUdyMcX5buQZpF4Zk5jZbYCdvkCv5gb"
var ChainId = 1001; //1:mainNet 100:local; 1001:testnet
var chainmapServerWallet = "n1GvvvstiCXUKBaeYniqRGeoAdMkMHoipvc"


var Nebulas = require("../neb/nebindex");



var Neb = Nebulas.Neb;
var neb = new Neb();
neb.setRequest(new Nebulas.HttpRequest(chainUrl))
var Account = Nebulas.Account;

var cmAccount = Account.NewAccount();
cmAccount.fromKey('{"version":4,"id":"036bc2ad-a5f6-4c97-858a-f789a65e9e62","address":"n1GvvvstiCXUKBaeYniqRGeoAdMkMHoipvc","crypto":{"ciphertext":"f4ec07ed03ac7a31700006a3435ef77aded9e26cf9474717ed736b2f526f55a3","cipherparams":{"iv":"2ed05d457a5b2fe017d91e822ce16721"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"50d4c9e29696acd616774891da23035d4ac7e7464eb9b2e32e0832cd8c040a81","n":4096,"r":8,"p":1},"mac":"c415adcad092d54135a9975eafe844b1af170fc637e7dfb910836fc6649c48c3","machash":"sha3256"}}', 'MyDongFangHong_05', false)


//Export to make other function access
exports.envChainId= ChainId
exports.Nebulas = Nebulas
exports.cmAccount = cmAccount
exports.smartContract_address = smartContract_address
exports.chainUrl = chainUrl
exports.chainmapServerWallet = chainmapServerWallet

var express = require('express');
var SolrNode = require('solr-node');
var router = express.Router();

var db_config

//Let us all use cmpdb in all instances

if (chainmap_env == "local") (
  db_config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cmpdb'
  }
)
else {
  db_config = {
    host: '107.181.170.169',
    user: 'dbuser',
    password: 'telenav123',
    database: 'cmpdb'
  }

}
exports.db_config = db_config



// var client = new SolrNode({
//     host: 'localhost',
//     port: '8983',
//     core: 'chainmap',
//     protocol: 'http',
//     debugLevel: 'ERROR' // log4js debug level paramter 
// });

var Client = require('node-rest-client').Client;

var client = new Client();


// var strQuery = client.query().q('text:test');
// var objQuery = client.query().q({text:'test', title:'test'});
// var myStrQuery = 'q=text:test&wt=json';

var host = "107.181.170.169";

var solr_host = 'http://' + host + ':8983/solr/chainmap';

var engine_host = 'http://' + host + ':3000';

router.get('/query/:category/:content', function (req, res, next) {

  var url = '';
  if (req.params.category == 'All') {
    url = solr_host + '/select?fl=title,%20summary,%20category&q=search_content:' + encodeURI(req.params.content) + '&wt=json';
  } else {
    url = solr_host + '/select?fl=title,%20summary,%20category&q=category:' + encodeURI(req.params.category) + '%20AND%20search_content:' + encodeURI(req.params.content) + '&wt=json';
  }

  client.get(url, function (data, response) {
    var obj = JSON.parse(data);
    res.send(obj);
  });
});

router.get('/resource/company/:name', function (req, res) {
  res.redirect(engine_host + '/resource/company/' + req.params.name)
});

router.get('/resource/ico/:name', function (req, res) {
  //http://chainmap.org/resource/ICO/Bitcoin%20Green
  res.redirect(engine_host + '/resource/ICO/' + req.params.name)
});


router.get('/resource/event/:name', function (req, res) {
  res.redirect(engine_host + '/resource/event/' + req.params.name);
});


router.get('/resource/white_paper/:name', function (req, res, next) {
  res.redirect(engine_host + '/resource/white_paper/' + req.params.name);
});

router.get('/page', function (req, res) {
  res.render('home', { title: 'Home' });
});

router.get('/about', function (req, res) {
  res.render('about', { title: 'About' });
});


router.get('/login', function (req, res) {
  res.render('login', { title: 'Login' });
});





//route to handle user registration
var login = require('../routes/login');
var users = require('../routes/users');
var questionBoard = require("../routes/questionBoard");
var trainingMaterial = require("../routes/trainingMaterial");
// global.environment = "local";
global.environment = "production";


router.post('/login', login.login)


// router.get('/logOut',function(req,res){
//   console.log("logged out");
// 	req.session.destroy(function(err) {
//   	if(err) {
//     	console.log(err);
//  	 } else {
//   	  res.redirect('/');
//  	 }
// 	});
// })

router.get('/logOut', function (req, res) {

  req.session.destroy();
  req.session = null;
  // res.send("logout success!");
  res.redirect('/questionBoard');
})

router.get('/', function (req, res) {
  res.render('home', { title: 'Home' });
});

router.get('/askQuestion', function (req, res) {
  session = req.session
  console.log("printing user ID");
  console.log(session);

  if (typeof session.user_id === "undefined") {
    console.log("You are not logged in");
    res.redirect('loginRegister');
  } else {
    res.render('askQuestion', { title: 'Post a Challenge' });
  }

});
router.get('/questionBoard', questionBoard.getAllChallenge);
router.get('/getChallengebyID/:challenge_id', questionBoard.getDetailsChallenge);
router.get('/likeAnswer/:challenge_id/:answer_id', questionBoard.likeAnswer);
router.get('/dislikeAnswer/:challenge_id/:answer_id', questionBoard.dislikeAnswer);
router.get('/likeChallenge/:challenge_id', questionBoard.likeChallenge);
router.get('/dislikeChallenge/:challenge_id', questionBoard.dislikeChallenge);
router.get('/closeChallenge/:challenge_id', questionBoard.closeChallenge);
router.post('/postChallenge', questionBoard.postChallenge);
router.post('/postanswer', questionBoard.postanswer);
router.post('/userRegister', users.userRegister);
router.get('/loginRegister', function (req, res) {
  res.render('loginRegister', { title: 'Login/Register' });
});
router.post('/getCompanies', users.getCompanies);
router.post('/tokenRanking', users.tokenRanking)
router.post('/totalQuestionAnswer', questionBoard.totalQuestionAnswer)
router.get('/error', function (req, res) {
  res.render('error', { title: 'Error' });
});
router.get('/userProfile/:user_id', users.userProfile);
router.get('/trainingMaterial', trainingMaterial.getAllTrainingMaterial);
// router.get('/trainingMaterial', function (req, res) {
//   res.render('trainingMaterial', { title: 'Home' });
// });
module.exports = router;
