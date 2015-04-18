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

router.get('/home/:name', function(req, res, next) {
	var db = req.db;
	var name = req.params.name;
	
	if (name.toLowerCase() === "music" || name.toLowerCase() === "admin") {
		res.render(name + 'Home');
	}
	else {
		var questionnaire = name.replace(/-/g, " ").toLowerCase();
		console.log(name, questionnaire);
		db.questions.find({questionnaire: questionnaire}, function(err, questions) {
			questionnaire = capitalize(questionnaire);
			res.render('questions', {questions: questions, title: questionnaire, name: name});
		});
	}
});

router.get('/login/:name', function(req, res, next) {
	var name = req.params.name;
	console.log(name);
	if (name === 'admin')
		res.render('adminLogin');
	else 
		res.render('questionsLogin', {name: name});
});

router.get('/createQuestionnaire', function(req, res, next) {
	res.render('createQuestions');
});

router.get('/', function(req, res, next) {
	res.render('questionsLogin', {name: 'music'});
});

module.exports = router;
