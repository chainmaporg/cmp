var express = require('express');
var SolrNode = require('solr-node');
var router = express.Router();


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

router.get('/query/:category/:content', function(req, res, next) {
  
  var url = '';
  if (req.params.category == 'All') {
    url = 'http://chainmap.org:8983/solr/chainmap/select?fl=title,%20summary,%20category&q=search_content:'+ encodeURI(req.params.content) +'&wt=json';
  } else {
    url = 'http://chainmap.org:8983/solr/chainmap/select?fl=title,%20summary,%20category&q=category:'+ encodeURI(req.params.category) + '%20AND%20search_content:'+ encodeURI(req.params.content) +'&wt=json';
  }
  
    client.get(url, function (data, response) {
      var obj = JSON.parse(data);
      res.send(obj);
  });
});

router.get('/resource/company/:name', function(req, res) {
  res.redirect('http://chainmap.org/resource/company/' + req.params.name)
});

router.get('/resource/ico/:name', function(req, res) {
  //http://chainmap.org/resource/ICO/Bitcoin%20Green
  res.redirect('http://chainmap.org/resource/ICO/' + req.params.name)
});


router.get('/resource/event/:name', function(req, res) {
  res.redirect('http://chainmap.org/resource/event/' + req.params.name);
});


router.get('/resource/white_paper/:name', function (req, res, next) {
  res.redirect('http://chainmap.org/resource/white_paper/' + req.params.name);
});

router.get('/page', function(req, res) {
    res.render('home', { title: 'Home' });
});

router.get('/about', function(req, res) {
    res.render('about', { title: 'About' });
});

router.get('/signup', function(req, res) {
    res.render('signup', { title: 'Signup' });
});

router.get('/login', function(req, res) {
    res.render('login', { title: 'Login' });
});





//route to handle user registration
var login = require('../routes/login');
var challenge = require('../routes/challenge');
var questionBoard = require("../routes/questionBoard");
router.get('/register', login.register)
router.post('/register', login.register)
router.post('/login',login.login)

router.get('/logout',function(req,res){
	req.session.destroy(function(err) {
  	if(err) {
    	console.log(err);
 	 } else {
  	  res.redirect('/');
 	 }
	});
})

router.get('/challenge',challenge.challenge)
router.get('/signup', function(req, res) {
    res.render('signup', { title: 'Sign up' });
});
router.get('/', function(req, res) {
    res.render('home', { title: 'Home' });
});

router.get('/questionBoard', questionBoard.getAllChallenge);
router.get('/getChallengebyID/:challenge_id', questionBoard.getDetailsChallenge);
router.post('/postChallenge', questionBoard.postChallenge);




module.exports = router;
