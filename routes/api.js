//////////////////////////////////////////////////////////////
// This file is for backend API, ie. handling requests 		//
// to get and post data to the database.					//
//////////////////////////////////////////////////////////////

// Add modules needed
var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectID;

// Caplitalizes title (ie. moral dilemma -> Moral Dilemma)
function capitalizeTitle(str, split) {
	var str_arr = str.split(/[\s-_]+/);
	for (var i in str_arr) {
		str_arr[i] = str_arr[i].replace(/[^A-Za-z0-9\s]+/g, "");
		str_arr[i] = str_arr[i].toLowerCase();
		//str_arr[i] = str_arr[i].charAt(0).toUpperCase() + str_arr[i].substr(1, str_arr[i].length).toLowerCase();
	}
	return str_arr.join("_");
}

// Removes commas and adds quotes around value for CSV
function removeCommasAddQuotes(str) {
	if (typeof str === 'number')
		str = str.toString();
	if (str != undefined) 
		str = str.replace(/,/g, "");
	return '"' + str + '"';
}

// Tests API (NOT USED)
router.get('/api', function(req, res, next) {
	var db = req.db;
	db.test.insert({title: 'blah'}, function(err, doc) {

	});
});

// Finds user's information for admin page to see if it matches
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

// Get all questionnaires to display on admin page
router.get('/api/getQuestionnaires', function(req, res, next) {

	var db = req.db;
	db.questions.distinct('questionnaire', function(err, questionnaires) {
		console.log(questionnaires)
		res.send(questionnaires);
	});
});

// Adds a new questionnaire from admin page
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

// Gets all questions in a certain questionnaire 
router.post('/api/getAllQuestions', function(req, res, next) {
	var db = req.db;
	var query = req.body;
	db.questions.find(query, function(err, questions) {
		console.log(questions);
		res.send(questions);
	});
});

// Gets all non-main questions from database
router.post('/api/getRestQuestions', function(req, res, next) {
	var db = req.db;
	var data = req.body;
	var questionIdStrs = data.questionIds;
	var questionIds = [];
	var sortOrder = {};

	// Gets IDs for all main questions
	for (var i in questionIdStrs) {
		questionIds.push(new ObjectId(questionIdStrs[i]));
	}

	// Non-main questions only have either global or control treatment
	// Chooses one at random
	var treatments = ['treatment_g', 'control'];
	var rand = Math.floor(Math.random() * treatments.length);
	var treatment_type = treatments[rand];

	// If global treatment, sorts in reverse order (largest value to smallest)
	if (treatment_type === 'treatment_g') {
		sortOrder.treatment_g = -1;
	}

	// Finds all questions without an ID in the main questions array
	db.questions.find({"_id": {$nin: questionIds}, questionnaire: data.questionnaire, main: 0 }).sort(sortOrder, function(err, questions) {

		// For each question add the chosen treatment
		for (var q in questions) {
			var question = questions[q];
			question.treatment_type = treatment_type;
			question.treatment = question[treatment_type];

			// Delete rest of the treatments
			//treatments.splice(rand,1);
			for (var i in treatments) {
				delete question[treatments[i]];
			}
		}

		// Send back the questions for use by front-end
		res.send(questions);
	});
});

// Get all main questions limited to 10
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

// Store all user's answers in database
router.post('/api/sendAnswers', function(req, res, next) {
	var db = req.db;
	var answers = req.body.answers;
	var userId = answers[0].user_id;
	for (var i in answers) {
		var currDetails = {user_id: userId, question_id: answers[i].question_id};
		// Updates instead of inserts in case user is taking quiz second time; will overwrite previous data
		console.log(answers[i])
		db.userAnswers.update(currDetails, answers[i], {upsert:true});
	}
	res.send({success: 'success'});
});

// Store user's information retrieved from FB/demographics
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

// Adds pair of friend IDs to backend so we can keep track of who was the invitee and 
// who was the invited
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

// Get list of demographics to ask user
router.get('/api/getDemographics', function(req, res, next) {
	var db = req.db;
	db.demographics.find({}, function(err, demographics) {
		res.send(demographics);
	});
});
// ***************************************************************************
// Get all friends' answers based on the IDs we have for users and questions
// ***************************************************************************
router.post('/api/getFriendData', function(req, res, next) {
	var db = req.db;
	var data = req.body;
	var questionnaire = data.questionnaire;

	console.log(data);
	//data.friendIDs = ["10205628652891800", "10102448158687165", "10155757337020024", "10153412403562412","10204946575448268","10152940616468344","1598128497117358","10156030113445643","10153604523353054",	"10105261756794020",	"10204578253641778",	"10102935824895198",	"10153148939798789",	"10153197380298773",	"10153051804596149",	"10153133658553985",	"10153532691401983",	"10100399397406561",	"10153218863199807",	"10153009048000737",	"516917897743",	"1122891377725762"];
	//data.question_id = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];


	db.userAnswers.find( { user_id: { $in: data.friendIDs }, question_id: {$in: data.question_id} }, function (err, friendData) {
		if (!err) {
			var friend_answers = {};
			var friend_counts = {};
				
			// Tallies up or averages friends' answers based on type of questionnaire
			if (questionnaire === 'music') {
				// For music, gets average star rating
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
				// For policy, gets whether majority of friends were for or against policy
				for (var i in friendData) {
					if (friendData[i].question.length > 0) {
						var curr_answer = (isNaN(parseInt(friendData[i].question))) ? 
							friendData[i].question :
							Math.floor( parseInt(friendData[i].question) / 51 );

						console.log(friendData[i].question, curr_answer);

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

				}

				// Correctly formats friends' answers as percentage to display on screen
				for (var j in friend_answers) {
					for (var k in friend_answers[j]) {
						friend_answers[j][k] = Math.round(100 * (friend_answers[j][k]/friend_counts[j]), 2);
					}
				}
				
			}

			console.log(friend_answers);

			res.send(friend_answers);
		}
	});
});

// Creates downloadable CSV for answers
router.post('/api/sendCSV', function(req, res, next) {
	var db = req.db; 
	// var questionnaire = req.body.questionnaire;
	var questionnaire = 'policy';
	// Adds extra demographics that were not asked to use in CSV
	var extra_demo = ['first_name','last_name', 'gender'];

	// Get all users
	db.users.find({}, function(err, users) {
		// Get all questions
		db.questions.find({questionnaire: questionnaire}, function(err, questions) {
			// Gest all user answers
			db.userAnswers.find({}, function(err, userAnswers) {
				// Get all demographics
				db.demographics.find({}, function(err, demographics) {
					// Get all petitions clicked
					db.petitions.find({}, function(err, petitions) {
						var userPetitions = {};
						for (var p in petitions) {
							if (petitions[p].user_id in userPetitions)
								userPetitions[petitions[p].user_id].push(parseInt(petitions[p].petition));
							else
								userPetitions[petitions[p].user_id] = [parseInt(petitions[p].petition)];
						}


						// Write header and make header array
						var header = "user";

						// First get all extra demographics from above
						for (var j in extra_demo){
							console.log(removeCommasAddQuotes(extra_demo[j]));
							header += "," + removeCommasAddQuotes(extra_demo[j]);
						}

						var lineArr = [];

						// Get all question titles and appropriate information in user answers
						for (var i in questions) {
							var curr_title = capitalizeTitle(questions[i].title, " ");
							// 
							header += ',"opinion_' + curr_title + 
							'","importance_' + curr_title + 
							'","frequency_' + curr_title + 
							'","treatment_' + curr_title + 
							'","will_sign_petition_' + curr_title +
							'","identity_value_' + curr_title + 
							'","local_type_' + curr_title + 
							'","local_value_' + curr_title + // the value from friends
							'","start_time_' + curr_title + 
							'","answer_time_' + curr_title +
							'","petition_' + curr_title + '"';
							lineArr.push(questions[i]._id);
						}
						// Get all demographics
						for (var d in demographics) {
							header += ',"user_' + demographics[d].name+'"';
						}
						
						var userDemographics = {};

						for (var j in users) {
							userDemographics[users[j].id] = users[j];
						}

						var userAnswersArr = {};

						// user_ids -> question_id -> user_question_answer

						// Make dictionary of all users and their answers
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

						// For each user
						for (var p in userAnswersArr) {
							var user = userAnswersArr[p];
							var userPetition = [];

							// Get their petition information 
							if (userPetitions[p] != undefined)
								userPetition = userPetitions[p];

							// Get their demographic information
							var currUserDemo = {};
							if (userDemographics[p] != undefined) 
								currUserDemo = userDemographics[p];

							// Remove commas so they don't mess up CSV
							var newLine = "" + removeCommasAddQuotes(p);
							
							// Add their extra demographic information
							for (var j in extra_demo) {
								if (extra_demo[j] in currUserDemo)
									newLine += "," + removeCommasAddQuotes(currUserDemo[extra_demo[j]]);
								else
									newLine += ",";
							}

							// Add their answer/importance/treatment/petition/etc info for each question
							for (var s in lineArr) {
								var currQuestion = lineArr[s];
								if (currQuestion in user){
									newLine += "," + removeCommasAddQuotes(user[currQuestion].question) + "," + 
										removeCommasAddQuotes(user[currQuestion].importance) + "," +
										removeCommasAddQuotes(user[currQuestion].frequency) + "," + 
										removeCommasAddQuotes(user[currQuestion].treatment) + "," + 
										removeCommasAddQuotes(user[currQuestion].will_sign_petition) + "," +
										removeCommasAddQuotes(user[currQuestion].identity_value) + "," +
										removeCommasAddQuotes(user[currQuestion].treatment_l_type) + "," + 
										removeCommasAddQuotes(user[currQuestion].treatment_l_value) + "," +
										removeCommasAddQuotes(user[currQuestion].start_time) + "," + 
										removeCommasAddQuotes(user[currQuestion].answer_time);
								}
								else
									newLine += "," + "," + "," + "," + "," + "," + "," + "," + "," + ",";

								if (userPetition.indexOf(parseInt(currQuestion)) >= 0)
									newLine += ",1";
								else 
									newLine += ",0";
							}

							// Add their demographic inforamtion
							for (var r in demographics) {
								if (demographics[r].name in currUserDemo)
									newLine += "," + removeCommasAddQuotes(currUserDemo[demographics[r].name]);
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

// Create friends CSV
router.get('/api/sendFriendCSV', function(req, res, next) {
	var db = req.db;

	// Gets list of all users
	db.users.find({}, {_id: 0, id: 1, first_name: 1, last_name: 1}, function(err, users) {

		// Gets list of all user->friend pairs
		db.friends.find({}, {_id: 0}, function(err, friends) {
			if (!err) {
				// Dictionary of all friends
				var friendsDict = {};

				// Dictionary of all friends who a user invited
				var inviteDict = {};
				var maxNumFriends = 0;

				// For each user->friend pair
				for (var j in friends) {

					var currFriend = friends[j];
					console.log(currFriend);

					// If userID is in currFriend, then this is a userID-friendID pair
					if ("userID" in currFriend) {
						// So check if the friendID already exists in our dictionary of user->[friends invited]
						/*if (currFriend.friendID in inviteDict) {
							inviteDict[currFriend.friendID].push(currFriend.userID);
						} else {
							inviteDict[currFriend.friendID] = [currFriend.userID];
							console.log(inviteDict);
						}*/
						inviteDict[currFriend.userID] = currFriend.friendID;
					} 

					// Else this is a userID-[friends list] pair
					else if ("user_id" in currFriend) {
						if (currFriend.friends.length > maxNumFriends) 
							maxNumFriends = currFriend.friends.length;

						if (currFriend.user_id in friendsDict) {
							friendsDict[currFriend.user_id].push.apply(friendsDict[currFriend.user_id], currFriend.friends);
						} else {
							friendsDict[currFriend.user_id] = currFriend.friends;
						}
					}
				}

				console.log("INVITE DICT");
				console.log(inviteDict);
				console.log("\nFRIENDS DICT");
				console.log(friendsDict);

				var headerString = "userID,firstName,lastName,inviterID";

				for (var i = 1; i <= maxNumFriends; i++) {
					headerString += ",friend" + i;
				}

				var allUserString =  [headerString];
				

				for (var i in users) {
					var currUserID = users[i].id;
					var currUserString = currUserID + "," + users[i].first_name + "," + users[i].last_name + ",";
					currUserString += (inviteDict[currUserID] == undefined) ? "N/A" : inviteDict[currUserID];

					var currUserFriends = friendsDict[currUserID];
					for (var j in currUserFriends) {
						currUserString += "," + currUserFriends[j];
					}

					var extraCommas = (currUserFriends == undefined) ? maxNumFriends : maxNumFriends - currUserFriends.length;
					for (var k = 0; k < extraCommas; k++) {
						currUserString += ",";
					}

					allUserString.push(currUserString);
				}

				res.send(allUserString);
			}
		});
	});

});

// Records whether the user clicked on a petition link
router.post('/api/petitionClick', function(req, res, next) {
	var db = req.db;
	var data = req.body;

	db.petitions.update({user_id: data.user_id, petition: data.petition}, data, {upsert: true}, function(err, success) {
		if (!err)
			res.send(success);
	});

});

// Gets identity information
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
				curr_probability = Math.round(curr_probability * 100);
				user_probabilities[curr_question.type] = curr_probability;

				// Write string for treatment using the greater_50 and less_50 text
				// From coefficients csv file
				// var curr_str = "Approximately " + Math.round(curr_probability * 10000)/100 + "% of people who share similar demographics to you ";
				// user_identities[curr_question.type] = curr_str + curr_question.greater_50 + ".";

				console.log("DONE!");
			}
			// Once finish for all questions, send the values back for use in questionnaire
			res.send({probabilities: user_probabilities});

		});

	});


});

// Save user's FB likes to database
router.post('/api/saveUserLikes', function(req, res, next) {
	var db = req.db;
	db.userLikes.update({id: req.body.id}, req.body, {upsert: true}, function(err, success) {
		if (!err)
			res.send(success);
	});
});

// Saves any new non-main songs in YouTube playlist
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

// Saves any new main songs in YouTube playlist
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


router.post('/api/saveFriends', function(req, res, next) {
	var db = req.db;
	var body = req.body;
	var uid = body.uid;
	var friends = body.friends;
	db.friends.update({user_id: uid}, {user_id: uid, friends: friends}, {upsert: true}, function(err, success) {
		res.send(success);
	});
});


module.exports = router;




