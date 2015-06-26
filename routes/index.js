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

router.get('/home/:name/:fid?', function(req, res, next) {
	var db = req.db;
	var name = req.params.name;
	var limit = {};

	if (name.toLowerCase() === "admin") {
		res.render(name + 'Home');
	}
	else {
		var questionnaire = name.replace(/-/g, " ").toLowerCase();
		limit.limit = 15;
		var query = {questionnaire: questionnaire};

		if (name.toLowerCase() === "music") {
			query.main = 1;
		}  

		db.questions.find(query, {}, limit, function(err, questions) {

			questionnaire = capitalize(questionnaire);
			if (name.toLowerCase() === "music")
				res.render(name + 'Home',{questions: questions, title: questionnaire, name: name});
			else {
				db.coefficients.find({name: "coefficients"}, {type: 1}, function(err, coeffs) {
					var hasIdentity = [];
					for (var k in coeffs) {
						hasIdentity.push(coeffs[k].type);
					}
					res.render('questions', {questions: questions, title: questionnaire, name: name, hasIdentity: hasIdentity});
				});
			}
		
		});
	}
});

router.get('/login/:name/:fid?', function(req, res, next) {
	var name = capitalize(req.params.name);
	var questionnaire = capitalize(name.replace(/-/g, " ").toLowerCase());

	if (name.toLowerCase() === 'admin')
		res.render('adminLogin');
	else {
		if (name.toLowerCase() === 'music') {
			var desc =  "Discover, rate and follow great music. Would you like to volunteer in a behavioural study about music taste?";
		} else if (name.toLowerCase() === 'policy') {
			var desc = "If your sick daughter needed a medicine to survive and you did not have the money, would it be moral to steal the medicine? Would you like to participate on an study about moral stands?";
		}

		res.render('questionsLogin', {name: name, meta_title: questionnaire + " Questionnaire", meta_name: questionnaire + " Questionnaire", meta_url: "http://stark-crag-5229.herokuapp.com/login/"+name.toLowerCase()+"/"+req.params.fid, meta_desc: desc});
	}
});

router.get('/createQuestionnaire', function(req, res, next) {
	res.render('createQuestions');
});

router.get('/references', function(req, res, next) {
	var db = req.db;

	db.questions.find({questionnaire: 'policy'}, {reference_global: 1, reference_status: 1}, function(err, references) {
		res.render('references', {references: references});
	});
});

router.get('/', function(req, res, next) {
	res.render('questionsLogin', {name: 'music'});
});

router.post('/', function(req, res) {
  res.redirect('/');
});

router.get('*', function(req, res, next) {
	res.render('questionsLogin', {name: 'policy'});
});


module.exports = router;
