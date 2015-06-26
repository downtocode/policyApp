var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectID;

function capitalizeTitle(str, split) {
	var str_arr = str.split(/[\s-_]+/);
	for (var i in str_arr) {
		str_arr[i] = str_arr[i].replace(/[^A-Za-z0-9\s]+/g, "");
		str_arr[i] = str_arr[i].toLowerCase();
		//str_arr[i] = str_arr[i].charAt(0).toUpperCase() + str_arr[i].substr(1, str_arr[i].length).toLowerCase();
	}
	return str_arr.join("_");
}

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
	var sortOrder = {};

	for (var i in questionIdStrs) {
		questionIds.push(new ObjectId(questionIdStrs[i]));
	}

	var treatments = ['treatment_g', 'control'];
	var rand = Math.floor(Math.random() * treatments.length);
	rand = 0;
	var treatment_type = treatments[rand];

	if (treatment_type === 'treatment_g') {
		sortOrder.treatment_g = -1;
	}

	db.questions.find({"_id": {$nin: questionIds}, questionnaire: data.questionnaire, main: 0 }).sort(sortOrder, function(err, questions) {

		for (var q in questions) {
			var question = questions[q];
			question.treatment_type = treatment_type;
			question.treatment = question[treatment_type];

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
	var questionnaire = data.questionnaire;

	console.log(data);

	db.userAnswers.find( { user_id: { $in: data.friendIDs }, question_id: {$in: data.question_id} }, function (err, friendData) {
		if (!err) {
			var friend_answers = {};
			var friend_counts = {};
				
			if (questionnaire === 'music') {
				for (var i in friendData) {
					var curr_answer = parseInt(friendData[i].question);
					console.log(curr_answer);
					if (friendData[i].question_id in friend_answers) {
						friend_counts[friendData[i].question_id] += 1;
						friend_answers[friendData[i].question_id] += curr_answer;							
					} else {
						friend_counts[friendData[i].question_id] = 1;
						friend_answers[friendData[i].question_id] = curr_answer;
					}
				}

				for (var j in friend_answers) {
					friend_answers[j] = Math.round(100 * friend_answers[j]/friend_counts[j], 2) / 100;
				}


			} else {
				for (var i in friendData) {
					var curr_answer = (isNaN(parseInt(friendData[i].question))) ? 
						friendData[i].question :
						Math.floor( parseInt(friendData[i].question) / 50 );

					if (friendData[i].question_id in friend_answers) {
						friend_counts[friendData[i].question_id] += 1;
						if (curr_answer in friend_answers[friendData[i].question_id]) {
							friend_answers[friendData[i].question_id][curr_answer] += 1;
						} else {
							friend_answers[friendData[i].question_id][curr_answer] = 1;
						}
					} else {
						var temp = {};
						temp[curr_answer] = 1;
						friend_answers[friendData[i].question_id] = temp;
						friend_counts[friendData[i].question_id] = 1;
					}

				}

				for (var j in friend_answers) {
					for (var k in friend_answers[j]) {
						friend_answers[j][k] = Math.round(100 * (friend_answers[j][k]/friend_counts[j]), 2);
					}
				}
				
			}

			res.send(friend_answers);
		}
	});
});

router.post('/api/sendCSV', function(req, res, next) {
	var db = req.db; 

	var extra_demo = ['first_name','last_name', 'gender'];

	db.users.find({}, function(err, users) {
		db.questions.find({}, function(err, questions) {
			db.userAnswers.find({}, function(err, userAnswers) {
				db.demographics.find({}, function(err, demographics) {
					db.petitions.find({}, function(err, petitions) {
						// write header and make header array
						var header = "user"

						for (var j in extra_demo)
							header += "," + extra_demo[j];

						var lineArr = []
						for (var i in questions) {
							var curr_title = capitalizeTitle(questions[i].title, " ");
							header += ",opinion_" + curr_title + "," + "importance_" + curr_title + "," + "treatment_" + curr_title + "," + "local_type_" + curr_title + "," + "start_time_" + curr_title + "," + "answer_time_" + curr_title;
							lineArr.push(questions[i]._id);
						}

						for (var d in demographics) {
							header += ",user_" + demographics[d].name;
						}

						var userDemographics = {}

						for (var j in users) {
							userDemographics[users[j].id] = users[j];
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
							var currUserDemo = {};
							if (userDemographics[p] != undefined) 
								currUserDemo = userDemographics[p];

							
							var newLine = "" + p;
							
							for (var j in extra_demo) {
								if (extra_demo[j] in currUserDemo)
									newLine += "," + currUserDemo[extra_demo[j]];
								else
									newLine += ",";
							}

							for (var s in lineArr) {
								var currQuestion = lineArr[s];

								if (currQuestion in user)
									newLine += "," + user[currQuestion].question + "," + user[currQuestion].importance + "," + user[currQuestion].treatment + "," + user[currQuestion].treatment_l_type + "," + user[currQuestion].start_time.replace(/,/g,"") + "," + user[currQuestion].answer_time;
								else
									newLine += "," + "," + ",";
							}

							

							for (var r in demographics) {
								if (demographics[r].name in currUserDemo)
									newLine += "," + currUserDemo[demographics[r].name];
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

			// For each of the identity questions
			for (var i in coef_questions) {
				console.log("starting here ");

				// Get the current question's coefficients
				var curr_question = coef_questions[i];

				// Set the init identity value to 0
				var curr_user_identity = 0;

				// Reformat the codes so that we have the type/name as the key
				// ie. codes[location] or codes[income]
				// makes it easier for look up
				for (var k in codes_init)
					codes[codes_init[k].type] = codes_init[k];

				console.log(codes);

				// For each demographic code that we have a user value for
				for (var curr_demo in demographics) {
					console.log(curr_demo);

					// Start making the lookup string 
					// ALWAYS STARTS WITH _I
					var curr_demo_str = "_I" + curr_demo.replace(/_/g, "").replace(/-/g,"");

					// Get the user's demographic info
					var user_demo = demographics[curr_demo];
					curr_demo = curr_demo.replace(/_/g, "").replace(/-/g,"");

					// Income is a special case bc it is in intervals
					/*if (curr_demo == "income") {
						// Replace any character that is not a number
						// ie. $ or ,
						user_demo = parseFloat(user_demo.replace(/\D+/g, ""));

						// Get all of the income keys
						var income_keys = Object.keys(codes["income"]);

						// If the user provided an answer
						if (user_demo != "") {
							// First key uses code 1
							var prev_key = 1;

							// For each income interval
							for (var curr_ind in income_keys) {
								// Again remove any character that is not a number
								var curr_income = parseFloat(income_keys[curr_ind].replace(/\D+/g, ""));

								// If the income is NotaNumber for some reason,
								// or it is less than the current interval max
								// (meaning that it is within that interval),
								// break out of the loop
								// else increment prev_key and move onto the next interval
								// ie. if the keys are [1000, 1500, 2000], the user is 1200, 
								// and prev_key starts at 1
								// then 1200 > 1000 so prev_key = 2, and we move to 1500
								// but 1200 < 1500 so we know 1200 > 1000 and 1200 < 1500
								// so the corresponding code value is 2
								if ( isNaN(curr_income) || user_demo < curr_income) {
									break;
								} else 
									prev_key++;
							}

							
						} else { // Else they left it blank and will be counted as "Prefer not to answer"
							prev_key = 11;
						}

						// Create the rest of the string
						// ie. _Iincome_2
						curr_demo_str += "_" + prev_key;

						// Make sure we have a value for that code
						// If so, add it onto the identity value
						if (curr_question[curr_demo_str] != undefined && curr_question[curr_demo_str] != "")
							curr_user_identity += parseFloat(curr_question[curr_demo_str]);

						console.log("6 | " + curr_demo_str + ": " + curr_question[curr_demo_str]);
					}*/

					// Else if we have a code for that demographic
					if (curr_demo in codes) {

						// Get the codes for that demographic
						var curr_code = codes[curr_demo];

						// If the user has a code within that demographic 
						if (user_demo in curr_code) {
							// Get corresponding code number and append it to end of string
							curr_demo_str += "_" + curr_code[user_demo];
						} else if ("Other" in curr_code) { // Otherwise check if there is an "Other" option
							// If so, append the code for "Other"
							curr_demo_str += "_" + curr_code["Other"];
						}
						
						// Again, make sure we have a value for that code
						if (curr_question[curr_demo_str] != undefined && curr_question[curr_demo_str] != "") {
							// Using string, we can now get the coef value
							var curr_coef_val = curr_question[curr_demo_str];

							// Add that coefficient to the identity value
							curr_user_identity += parseFloat(curr_coef_val);
							console.log("1 | " + curr_demo_str + ": " + curr_coef_val);
						}

					}

					// Now handle everything that doesn't have a code
					// ie. if the coefficient is just a value * coef
					// age, children
					else if (curr_demo_str in curr_question) {
						
						// If there is a coefficient value for that demo and not 0
						if (curr_question[curr_demo_str] != undefined) {
							// Children is binary, so 0 for 0 children
							// 1 for all other values
							if (curr_demo == "children") {
								var temp = (user_demo == 0) ? 0 : 1;
								curr_user_identity += curr_question[curr_demo_str] * temp;
								console.log("2 | " + curr_demo_str + ": " + user_demo * temp);
							} else { 
								// Else we just get the user's demo value and multiply it by the coefficient
								curr_user_identity += user_demo * curr_question[curr_demo_str];
								console.log("3 | " + curr_demo_str + ": " + user_demo * curr_question[curr_demo_str]);
							}
						
							// If we are doing age, we also need to do age^2
							if (curr_demo == "age") {
								// square age, divide by 1000, multiply by age^2 coeff
								curr_user_identity += ((user_demo * user_demo) / 1000) * curr_question["_Iage2"];	
								console.log("4 | " + curr_demo_str + ": " + ((user_demo * user_demo) / 1000) * curr_question["_Iage2"]);
							}
						
						}

					}

					// If the coefficient value is just appended to the coefficient name
					// ie _Igender_male
					else if (typeof(user_demo) === 'string') {
						curr_demo_str += "_" + user_demo.toLowerCase();
						console.log(curr_demo_str);
						if (Object.keys(curr_question).indexOf(curr_demo_str) >= 0) {
							if (curr_question[curr_demo_str] != undefined && curr_question[curr_demo_str] != "")
								curr_user_identity += parseFloat(curr_question[curr_demo_str]);
							console.log("5 | " + curr_demo_str + ": " + curr_question[curr_demo_str]);
						}
					}

					console.log(curr_user_identity);

				}

				// Finished with all demographics that we have
				// Add on the constant value
				curr_user_identity += curr_question["_cons"];
				console.log(curr_user_identity);

				// Change into a probability by doing e^x / (1 + e^x)
				// Save that probability into dictionary where key is curr question name
				var curr_probability = Math.exp(curr_user_identity) / ( 1 + Math.exp(curr_user_identity) );
				user_probabilities[curr_question.type] = curr_probability;

				// Write string for treatment using the greater_50 and less_50 text
				// From coefficients csv file
				var curr_str = "Approximately " + Math.round(curr_probability * 10000)/100 + "% of people who share similar demographics to you ";
				user_identities[curr_question.type] = curr_str + curr_question.greater_50 + ".";

				console.log("DONE!");
			}

			// Once finish for all questions, send the values back for use in questionnaire
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
	var songs = req.body;
	var count = 0;
	for (var i in songs) {
		db.questions.update({url: songs[i].url, main: 0}, songs[i], {upsert: true}, function(err, success) {
			count++;
			if (count == songs.length - 1) {
				res.send(success);
			}
		});
	}
	
});


router.post('/api/saveMainSongs', function(req, res, next) {
	var db = req.db;
	var songs = req.body;
	var count = 0;
	for (var i in songs) {
		db.questions.update({url: songs[i].url, main: 1}, songs[i], {upsert: true}, function(err, success) {
			count++;
			if (count == songs.length - 1) {
				res.send(success);
			}
		});
	}
	
});



module.exports = router;




