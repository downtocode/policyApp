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

	if (name.toLowerCase() === "admin") {
		res.render(name + 'Home');
	}
	else {
		var questionnaire = name.replace(/-/g, " ").toLowerCase();
		var lim = 10;
		var query = {questionnaire: questionnaire};

		if (name.toLowerCase() === "music") {
			lim = 5;
			query.main = 1;
		}  

		db.questions.find(query, {}, {limit:lim}, function(err, questions) {

			for (var q in questions) {
				var question = questions[q];
				var treatments = ['treatment_g', 'treatment_l', 'treatment_s', 'control'];
				var rand = Math.floor(Math.random() * treatments.length);
				//rand = 2;
				question.treatment_type = treatments[rand];
				question.treatment = question[treatments[rand]];

				//treatments.splice(rand,1);
				for (var i in treatments) {
					delete question[treatments[i]];
				}
				
			}

			questionnaire = capitalize(questionnaire);
			if (name.toLowerCase() === "music")
				res.render(name + 'Home',{questions: questions, title: questionnaire, name: name});
			else
				res.render('questions', {questions: questions, title: questionnaire, name: name});
		});
	}
});

router.get('/login/:name', function(req, res, next) {
	var name = req.params.name;
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
