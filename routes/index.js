var express = require('express');
var router = express.Router();

router.get('/home', function(req, res, next) {
	res.render('fbHome');
});

router.get('/admin', function(req, res, next) {
	res.render('login');
});

router.get('/adminHome', function(req, res, next) {
	res.render('home');
});

router.get('/createQuestionnaire', function(req, res, next) {
	res.render('createQuestions');
});

router.get('/', function(req, res, next) {
	res.render('index');
});


module.exports = router;
