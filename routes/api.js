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
		var treatments = ['treatment_g', 'treatment_l', 'treatment_s', 'control'];
		var rand = Math.floor(Math.random() * treatments.length);

		for (var q in questions) {
			var question = questions[q];
			question.treatment_type = treatments[rand];
			question.treatment = question[treatments[rand]];

			//treatments.splice(rand,1);
			for (var i in treatments) {
				delete question[treatments[i]];
			}
		}

		res.send(questions);
	});
});

router.post('/api/getQuestions', function(req, res, next) {
	var db = req.db;
	var query = req.body;

	db.questions.find(query, {}, {limit:10}, function(err, questions) {
		res.send(questions);
	});
});

router.post('/api/getQuestionsControl', function(req, res, next) {
	var db = req.db;
	var query = req.body;

	db.questions.find(query, {}, {limit:10}, function(err, questions) {
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

router.post('/api/sendCSV', function(req, res, next) {
	var db = req.db;

	db.users.find({}, function(err, users) {
		db.questions.find({}, function(err, questions) {
			db.userAnswers.find({}, function(err, userAnswers) {
				// write header and make header array
				var header = "user"
				var lineArr = []
				for (var i in questions) {
					header += ",opinion_" + questions[i]._id + "," + "importance_" + questions[i]._id + "," + "treatment_" + questions[i]._id;
					lineArr.push(questions[i]._id);
				}

				var demographics = ['age', 'gender', 'location', 'education', 'work'];
				for (var d in demographics) {
					header += ",user_" + demographics[d];
				}

				var userDemographics = {}

				for (var j in users) {
					userDemographics[users[j]] = users[j];
				}

				var userAnswersArr = {}

				for (var k in userAnswers) {
					if (userAnswers[k].user_id in userAnswersArr) {
						userAnswersArr[userAnswers[k].user_id][userAnswers[k].question_id] = userAnswers[k];
					} else {
						var newDict = {};
						newDict[userAnswers[k].question_id] = userAnswers[k];
						userAnswersArr[userAnswers[k].user_id] = newDict;
					}
				}

				var allLines = [header];

				for (var p in userAnswersArr) {
					var user = userAnswersArr[p];
					var newLine = "" + p;
					for (var s in lineArr) {
						var currQuestion = lineArr[s];
						if (currQuestion in user)
							newLine += "," + user[currQuestion].question + "," + user[currQuestion].importance + "," + user[currQuestion].treatment;
						else
							newLine += "," + "," + ",";
					}

					for (var r in demographics) {
						if (demographics[r] in userDemographics)
							newLine += "," + userDemographics[user.user_id][demographics[r]];
						else
							newLine += ",";
					}
					allLines.push(newLine);
				}

				res.send(allLines);

			});
		});
	});


});

module.exports = router;




