var express = require('express');
var router = express.Router();

function capitalize(str) {
	var arr = str.split(" ");
	var strCap = "";
	for (var i in arr) {
		strCap += arr[i].charAt(0).toUpperCase() + arr[i].substring(1,arr[i].length) + " ";
	}

	return strCap.trim();
}

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

router.get('/questions/:name', function(req, res, next) {
	var db = req.db;
	var questionnaire = req.params.name;
	questionnaire = questionnaire.replace(/-/g, " ").toLowerCase();
	db.questions.find({questionnaire: questionnaire}, function(err, questions) {
		questionnaire = capitalize(questionnaire);
		res.render('questions', {questions: questions, title: questionnaire});
	});
	
});

router.get('/', function(req, res, next) {
	res.render('index');
});


module.exports = router;
