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

router.get('/questionBoard', function(req, res) {
    res.render('questionBoard', { title: 'Question Board' });
});



//route to handle user registration
var login = require('../routes/login');
var challenge = require('../routes/challenge');
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



module.exports = router;
