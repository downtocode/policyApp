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

router.post('/api/addFriend', function(req, res, next) {
	var db = req.db;
	var data = req.body;
	db.friends.insert({userID: data.userID, friendID: data.friendID}, function(err, success) {
		if (!err){
			db.friends.find({friendID: data.friendID}, function(err, users) {
				console.log(users);
				if (users.length >= 5) {
					console.log(data.friendID + " has " + users.length + " friends who took the quiz");
				}
			});
		}
	});
});

router.get('/api/getDemographics', function(req, res, next) {
	var db = req.db;
	db.demographics.find({}, function(err, demographics) {
		res.send(demographics);
	});
});

router.post('/api/getFriendData', function(req, res, next) {
	var db = req.db;
	var data = req.body;

	db.userAnswers.find( { user_id: { $in: data.friendIDs }, question_id: {$in: data.question_id} }, function (err, friendData) {
		if (!err) {
			var friend_answers = {};
			var friend_counts = {};
			for (var i in friendData) {
				if (friendData[i].question_id in friend_answers) {
					friend_counts[friendData[i].question_id] += 1;
					if (friendData[i].question in friend_answers[friendData[i].question_id]) {
						friend_answers[friendData[i].question_id][friendData[i].question] += 1;
					} else {
						friend_answers[friendData[i].question_id][friendData[i].question] = 1;
					}
				} else {
					var temp = {};
					temp[friendData[i].question] = 1;
					friend_answers[friendData[i].question_id] = temp;
					friend_counts[friendData[i].question_id] = 1;
				}
			}

			for (var j in friend_answers) {
				for (var k in friend_answers[j]) {
					friend_answers[j][k] = Math.round(100 * (friend_answers[j][k]/friend_counts[j]), 2);
				}
			}

			console.log(friend_answers);
			res.send(friend_answers);
		}
	});
});

router.post('/api/sendCSV', function(req, res, next) {
	var db = req.db;

	db.users.find({}, function(err, users) {
		db.questions.find({}, function(err, questions) {
			db.userAnswers.find({}, function(err, userAnswers) {
				db.demographics.find({}, function(err, demographics) {
					db.petitions.find({}, function(err, petitions) {
						// write header and make header array
						var header = "user"
						var lineArr = []
						for (var i in questions) {
							header += ",opinion_" + questions[i].title + "," + "importance_" + questions[i].title + "," + "treatment_" + questions[i].title;
							lineArr.push(questions[i]._id);
						}

						for (var d in demographics) {
							header += ",user_" + demographics[d].name;
						}

						var userDemographics = {}

						for (var j in users) {
							console.log(users[j]);
							userDemographics[users[j]] = users[j];
						}

						var userAnswersArr = {}

						// user_ids -> question_id -> user_question_answer

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
							allLines.push(newLine + "\n");
						}

						res.send(allLines);
					});
				});
			});
		});
	});
});


router.post('/api/petitionClick', function(req, res, next) {
	var db = req.db;
	var data = req.body;

	db.petitions.update({user_id: data.user_id, petition: data.petition}, data, {upsert: true}, function(err, success) {
		if (!err)
			res.send(success);
	});

});


router.post('/api/getIdentityTreatment', function(req, res, next) {
	var db = req.db;
	var data = req.body;

	// Get questions using identity treatment
	var questions = data.questions;

	// Get user's demographics to calculate identity
	var demographics = data.demographics;

	console.log(questions);

	// Find coefficients for corresponding questions
	db.coefficients.find({ name: "coefficients", type: {$in: questions} }, function(err, coef_questions) {

		// Get all code values to translate demographics information
		db.coefficients.find({ name: "demographics_code" }, function(err, codes_init) {
			var user_identities = {};
			var user_probabilities = {};
			var codes = {};

			for (var i in coef_questions) {
				console.log("starting here ");

				var curr_question = coef_questions[i];
				var curr_user_identity = 0;

				// For each demographic code that we have identity values for
				for (var k in codes_init)
					codes[codes_init[k].type] = codes_init[k];

				for (var curr_demo in demographics) {

					var curr_demo_str = "_I" + curr_demo.replace(/_|-/g, "");

					// Get the user's demographic info
					var user_demo = demographics[curr_demo];


					if (curr_demo == "income") {
						user_demo = user_demo.replace(/\D+/g, "");
						var income_keys = Object.keys(codes["income"]);
						if (user_demo != "") {
							var prev_key = 1;
							for (var curr_ind in income_keys) {
								var curr_income = parseInt(income_keys[curr_ind].replace(/\D+/g, ""));
								if ( isNaN(curr_income) || parseInt(user_demo) < curr_income) {
									break;
								} else 
									prev_key++;
							}

							
						} else {
							prev_key = 10;
						}

						curr_demo_str += "_" + prev_key;

						if (curr_question[curr_demo_str] != undefined)
							curr_user_identity += parseInt(curr_question[curr_demo_str]);

						console.log("6 | " + curr_demo_str + ": " + curr_question[curr_demo_str]);
					}

					// If we have a code for that demographic
					else if (curr_demo in codes) {
						// First get code data
						var curr_code = codes[curr_demo];

						if (user_demo in curr_code) {
							// Get corresponding code number and append it to end of string
							curr_demo_str += "_" + curr_code[user_demo];
						} else if ("Other" in curr_code) {
							curr_demo_str += "_" + curr_code["Other"];
						}

						if (curr_question[curr_demo_str] != undefined && curr_question[curr_demo_str].length > 0) {
							// Using string, we can now get the coef value
							var curr_coef_val = curr_question[curr_demo_str];

							// Multiply their coefficient value by their information value
							// and add to user's identity value
							curr_user_identity += parseInt(curr_coef_val);
							console.log("1 | " + curr_demo_str + ": " + curr_coef_val);
						}

					}

					// Now handle everything that doesn't have a code
					// If the coefficient is just the value * coef (ie age)
					else if (curr_demo_str in curr_question) {
						
						if (curr_question[curr_demo_str] != undefined && curr_question[curr_demo_str].length > 0) {
							if (curr_demo == "children") {
								var temp = (curr_question[curr_demo_str] == 0) ? 0 : 1;
								curr_user_identity += user_demo * temp;
								console.log("2 | " + curr_demo_str + ": " + user_demo * temp);
							} else {
								curr_user_identity += user_demo * curr_question[curr_demo_str];
								console.log("3 | " + curr_demo_str + ": " + user_demo * curr_question[curr_demo_str]);
							}
						
							if (curr_demo == "age") {
								// square age, divide by 1000, multiply by age2 coeff
								curr_user_identity += ((user_demo * user_demo) / 1000) * curr_question["_Iage2"];	
								console.log("4 | " + curr_demo_str + ": " + ((user_demo * user_demo) / 1000) * curr_question["_Iage2"]);
							}
						
						}



					}

					// If the coefficient value is just appended to the coefficient name
					// ie _Igender_male
					else if (Object.keys(curr_question).indexOf(curr_demo_str) >= 0) {
						curr_demo_str += "_" + user_demo.toLowerCase();
						if (curr_question[curr_demo_str] != undefined && curr_question[curr_demo_str].length > 0)
							curr_user_identity += parseInt(curr_question[curr_demo_str]);
						console.log("5 | " + curr_demo_str + ": " + curr_question[curr_demo_str]);
					}

				}

				var init_identity = curr_user_identity + curr_question["_cons"];
				console.log(init_identity);
				var curr_probability = Math.exp(init_identity) / ( 1 + Math.exp(init_identity) );
				user_probabilities[curr_question.type] = curr_probability;

				var curr_str = "People who share similar demographics to you generally ";
				user_identities[curr_question.type] = (curr_probability >= .50) ? 
					curr_str + curr_question.greater_50 + ".":
					curr_str + curr_question.less_50 + ".";

				console.log("DONE!");
			}

			res.send({probabilities: user_probabilities, identities: user_identities});

		});

	});


});


router.post('/api/saveUserLikes', function(req, res, next) {
	var db = req.db;
	db.userLikes.update({id: req.body.id}, req.body, {upsert: true}, function(err, success) {
		if (!err)
			res.send(success);
	});
});


router.post('/api/saveNewSongs', function(req, res, next) {
	var db = req.db;
	
});



module.exports = router;




