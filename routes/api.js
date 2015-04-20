var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectID;

router.get('/api', function(req, res, next) {
	var db = req.db;
	db.test.insert({title: 'blah'}, function(err, doc) {

	});
});

router.post('/api/adminLogin', function(req, res, next) {
	var db = req.db;
	var user = req.body;
	db.accounts.find({username: user.username, password: user.password}, function(err, doc) {
		if (doc.length == 1) {
			res.send({'loggedIn': 'true'});
		} else {
			res.send({'loggedIn': 'false'});
		}
	});
});

router.get('/api/getQuestionnaires', function(req, res, next) {
	var db = req.db;
	db.questions.distinct('questionnaire', function(err, questionnaires) {
		res.send(questionnaires);
	});
});

router.post('/api/addQuestionnaire', function(req, res, next) {
	var db = req.db;
	var questions = req.body.questions;
	db.questions.insert(questions, function(err, success) {
		if (!err) {
			res.send({msg:"Successfully Added!", font:"font-green"});
		} else {
			res.send({msg:"There was an error in creating the questionnaire! Please try again.", font:"font-red"});
		}
	});
});

router.post('/api/getAllQuestions', function(req, res, next) {
	var db = req.db;
	var query = req.body;
	db.questions.find(query, function(err, questions) {
		console.log(questions);
		res.send(questions);
	});
});

router.post('/api/getRestQuestions', function(req, res, next) {
	var db = req.db;
	var data = req.body;
	var questionIdStrs = data.questionIds;
	var questionIds = [];

	for (var i in questionIdStrs) {
		questionIds.push(new ObjectId(questionIdStrs[i]));
	}
	

	db.questions.find({"_id": {$nin: questionIds}, questionnaire: data.questionnaire }, function(err, questions) {
		res.send(questions);
	});
});

router.post('/api/getQuestions', function(req, res, next) {
	var db = req.db;
	var query = req.body;
	db.questions.find(query, {}, {limit:10}, function(err, questions) {
		console.log(questions);
		res.send(questions);
	});
});

router.post('/api/sendAnswers', function(req, res, next) {
	var db = req.db;
	var answers = req.body.answers;
	var userId = answers[0].user_id;
	for (var i in answers) {
		var currDetails = {user_id: userId, question_id: answers[i].question_id};
		db.userAnswers.update(currDetails, answers[i], {upsert:true});
	}
	res.send({success: 'success'});
});

router.post('/api/sendUser', function(req, res, next) {
	var db = req.db;
	var user = req.body;
	var userID = user.id;
	console.log(req.body);
	db.users.update({id: userID}, req.body, {upsert: true}, function(err, success) {
		console.log(success);
		if (!err)
			res.send(success);
	});
});

module.exports = router;




