chainmap_env = global.config.chainmap_env;
smartContract_address = global.config.smartContract_address;
chainmapServerWallet = global.config.chainmapServerWallet;

var Nebulas = require("nebulas");

//Export to make other function accessd
exports.Nebulas = Nebulas;
exports.smartContract_address = smartContract_address;
exports.chainmapServerWallet = chainmapServerWallet;

var express = require("express");
var SolrNode = require("solr-node");
var router = express.Router();

// var client = new SolrNode({
//     host: 'localhost',
//     port: '8983',
//     core: 'chainmap',
//     protocol: 'http',
//     debugLevel: 'ERROR' // log4js debug level paramter
// });

var Client = require("node-rest-client").Client;

var client = new Client();

// var strQuery = client.query().q('text:test');
// var objQuery = client.query().q({text:'test', title:'test'});
// var myStrQuery = 'q=text:test&wt=json';

var solr_host = global.config.search_solr_host;
var engine_host = global.config.search_engine_host;

router.get("/query/:category/:content", function(req, res, next) {
    var url = "";
    if (req.params.category == "All") {
        url =
            solr_host +
            "/select?fl=title,%20url,%20summary,%20category&q=search_content:" +
            encodeURI(req.params.content) +
            "&wt=json";
    } else {
        url =
            solr_host +
            "/select?fl=title,%20url,%20summary,%20category&q=category:" +
            encodeURI(req.params.category) +
            "%20AND%20search_content:" +
            encodeURI(req.params.content) +
            "&wt=json";
    }

    console.log("chainmap_search:", url);

    client.get(url, function(data, response) {
        var obj = JSON.parse(data);
        res.send(obj);
    });
});

router.get("/resource/company/:name", function(req, res) {
    res.redirect(engine_host + "/resource/company/" + req.params.name);
});

router.get("/resource/ico/:name", function(req, res) {
    //http://chainmap.org/resource/ICO/Bitcoin%20Green
    res.redirect(engine_host + "/resource/ICO/" + req.params.name);
});

router.get("/resource/event/:name", function(req, res) {
    res.redirect(engine_host + "/resource/event/" + req.params.name);
});

router.get("/resource/white_paper/:name", function(req, res, next) {
    res.redirect(engine_host + "/resource/white_paper/" + req.params.name);
});

router.get("/page", function(req, res) {
    res.render("home", { title: "Home" });
});

router.get("/about", function(req, res) {
    res.render("about", { title: "About" });
});

router.get("/login", function(req, res) {
    res.render("login", { title: "Login" });
});

//route to handle user registration
var login = require("../routes/login");
var users = require("../routes/users");
var questionBoard = require("../routes/questionBoard");
var trainingMaterial = require("../routes/trainingMaterial");
var socialgroup = require("../routes/socialgroup");
var news = require("../routes/news");

var companyNews = require("../routes/companyNews");
var admin = require("../routes/admin");
// global.environment = "local";
global.environment = "production";

router.post("/login", login.login);

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

router.get("/logOut", function(req, res) {
    req.session.destroy();
    req.session = null;
    // res.send("logout success!");
    res.redirect("/questionBoard");
});

router.get("/", function(req, res) {
    res.render("home", { title: "Home" });
});

router.get("/searchContent", function(req, res) {
    res.render("searchContent", { title: "Search Blockchain related Content" });
});

router.get("/connectJob", function(req, res) {
    res.render("connectJob", { title: "Find jobs" });
});

router.get("/connectSmartContract", function(req, res) {
    res.render("connectSmartContract", {
        title: "Connect to do smart contract",
    });
});

router.get("/getPayContent", function(req, res) {
    code = req.query.coupon;
    console.log("track-download:", code);

    if (code == "chainmap") {
        res.render("chainmap-01", { coupon: "YES" });
    } else {
        res.render("chainmap-01", { coupon: "NO" });
    }
});

router.get("/payContent/:name", function(req, res) {
    //var session = req.session;
    //console.log(session);

    //e.g. chainmap-01.ejs...
    res.render(req.params.name, { title: req.params.name });
});

router.get("/connectGroup", socialgroup.getSocialGroup);

router.get("/askQuestion", function(req, res) {
    var session = req.session;
    console.log("printing user ID");
    console.log(session);

    if (typeof session.user_id === "undefined") {
        console.log("You are not logged in");
        res.redirect("loginRegister");
    } else {
        res.render("askQuestion", { title: "Post a Challenge" });
    }
});

router.get("/questionBoard", function(req, res) {
    questionBoard.getAllChallenge(req, res);
});
router.get("/getChallengebyID/:challenge_id", questionBoard.getDetailsChallenge);
router.get("/likeAnswer/:challenge_id/:answer_id", questionBoard.likeAnswer);
router.get("/dislikeAnswer/:challenge_id/:answer_id", questionBoard.dislikeAnswer);
router.get("/likeChallenge/:challenge_id", questionBoard.likeChallenge);
router.get("/dislikeChallenge/:challenge_id", questionBoard.dislikeChallenge);
router.get("/closeChallenge/:challenge_id", questionBoard.closeChallenge);
router.post("/postChallenge", questionBoard.postChallenge);
router.post("/postanswer", questionBoard.postanswer);
router.post("/userRegister", users.userRegister);
router.get("/loginRegister", function(req, res) {
    res.render("loginRegister", { title: "Login/Register" });
});

router.get("/companyNews", function(req, res) {
    companyNews.getCompanyNews(req, res);
});

router.post("/getCompanies", users.getCompanies);
router.post("/tokenRanking", users.tokenRanking);
router.post("/totalQuestionAnswer", questionBoard.totalQuestionAnswer);
router.get("/error", function(req, res) {
    res.render("error", { title: "Error" });
});
router.get("/userProfile/:user_id", users.userProfile);
router.get("/getJobRecommendations", users.getJobRecommendations);
router.get("/getRecommendations", users.getRecommendations);
router.get("/trainingMaterial_Introduction", function(req, res) {
    trainingMaterial.trainingMaterial_Introduction(req, res);
});
router.get("/trainingMaterial_Infrastructure", function(req, res) {
    trainingMaterial.trainingMaterial_Infrastructure(req, res);
});
router.get("/trainingMaterial_Hyperledger", function(req, res) {
    trainingMaterial.trainingMaterial_Hyperledger(req, res);
});
router.get("/trainingMaterial_Bitcoin", function(req, res) {
    trainingMaterial.trainingMaterial_Bitcoin(req, res);
});
router.get("/trainingMaterial_Ethereum", function(req, res) {
    trainingMaterial.trainingMaterial_Ethereum(req, res);
});
router.get("/trainingMaterial_UseCases", function(req, res) {
    trainingMaterial.trainingMaterial_UseCases(req, res);
});
router.get("/trainingMaterial_OtherProtocol", function(req, res) {
    trainingMaterial.trainingMaterial_OtherProtocol(req, res);
});
router.get("/trainingMaterial_Training", function(req, res) {
    trainingMaterial.trainingMaterial_Training(req, res);
});

router.post("/updateUserProfile", users.updateUserProfile);
router.post("/log", users.recordClick);

router.post("/checkDuplicatePayment", users.checkDuplicatePayment);

router.post("/checkDuplicatePublicID", users.checkDuplicatePublicID);

router.get("/aboutUs", function(req, res) {
    res.render("aboutUs", { title: "About Us" });
});

router.get("/aboutToken", function(req, res) {
    res.render("aboutToken", { title: "About Token" });
});

router.post("/getAllCategory", users.getAllCategory);
router.post("/getAllCategoryWithUserCat", users.getAllCategoryWithUserCat);
router.get("/getNews", news.getNews);

router.get("/adminPage", function(req, res) {
    if (req.session.admin) {
        console.log("Admin access unlocked.");
        admin.adminPageAccess(req, res);
    } else res.redirect("loginAdmin");
});
router.get("/loginAdmin", function(req, res) {
    res.render("loginAdmin");
});
router.post("/adminLogin", admin.login);

router.get("/loadSessionUserID", (req, res) => {
    res.send({ idExists: req.session.user_id != "undefined" });
});

router.post("/sendMessage", users.sendMessage);

router.get("/messages", function(req, res) {
    if (typeof req.session.user_id === "undefined") {
        console.log("You are not logged in");
        res.redirect("loginRegister");
    } else {
        users.messages(req, res);
    }
});

module.exports = router;
