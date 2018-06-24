var express = require('express');
var SolrNode = require('solr-node');
var router = express.Router();

//Change based on env
var chainmap_env = "local";

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

router.get('/query/:category/:content', function (req, res, next) {

  var url = '';
  if (req.params.category == 'All') {
    url = 'http://chainmap.org:8983/solr/chainmap/select?fl=title,%20summary,%20category&q=search_content:' + encodeURI(req.params.content) + '&wt=json';
  } else {
    url = 'http://chainmap.org:8983/solr/chainmap/select?fl=title,%20summary,%20category&q=category:' + encodeURI(req.params.category) + '%20AND%20search_content:' + encodeURI(req.params.content) + '&wt=json';
  }

  client.get(url, function (data, response) {
    var obj = JSON.parse(data);
    res.send(obj);
  });
});

router.get('/resource/company/:name', function (req, res) {
  res.redirect('http://chainmap.org/resource/company/' + req.params.name)
});

router.get('/resource/ico/:name', function (req, res) {
  //http://chainmap.org/resource/ICO/Bitcoin%20Green
  res.redirect('http://chainmap.org/resource/ICO/' + req.params.name)
});


router.get('/resource/event/:name', function (req, res) {
  res.redirect('http://chainmap.org/resource/event/' + req.params.name);
});


router.get('/resource/white_paper/:name', function (req, res, next) {
  res.redirect('http://chainmap.org/resource/white_paper/' + req.params.name);
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
router.post('/postChallenge', questionBoard.postChallenge);
router.post('/postanswer', questionBoard.postanswer);
router.post('/userRegister', users.userRegister);
router.get('/loginRegister', function (req, res) {
  res.render('loginRegister', { title: 'Login/Register' });
});
router.post('/getCompanies', users.getCompanies);



module.exports = router;
