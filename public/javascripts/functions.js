////////////////////////////////////////////////////////////
// This file has functions used by both types of 			//
// questionnaires (music + policy), such as creating 		//
// treatments.												//
//////////////////////////////////////////////////////////////


var apiKey = 'AIzaSyDP-zwHrWoPG52MOOVjc6PUskuFTSFKISI';
var prev_time;
var url_name = 'http://localhost:5000';
//var url_name = 'https://stark-crag-dev.herokuapp.com';
var is_wave2 = 0; // 0 means false (i.e. NOT wave 2); 1 means true (i.e. we ARE in wave 2)

$(document).ready(function() {
	// When user clicks on "Got It" button for instructions, show first question
	$(document).on("click", "#submit-instructions", function() {
		$(".display-table-cell").children().fadeOut(500, function() {
			$(this).remove();
			$("li:first").remove();
			$("li.hidden").show();

			showQuestion(0);
		});
	});
});

// Returns capitalized word (ie. policy -> Policy)
function capitalize(string) {
	return string.charAt(0).toUpperCase() + string.substring(1, string.length);
}

// Returns cappitalized sentence (ie. policy questionnaire -> Policy Questionnaire)
function capitalizeSentence(string) {
	var strArr = string.split(/[\s_]+/);	
	for (var word in strArr) {
		strArr[word] = capitalize(strArr[word]);
	}
	return strArr.join(" ");
}

// Checks if user has cookie for FB login
// Returns cookie value if so, and null if not
function hasCookie(cookieName) {
	var cookies = document.cookie.split(";");

	// Loops over all cookies to check if name matches desired 
	for (var cookie in cookies) {
		var currCookie = cookies[cookie].split("=");
		if (currCookie[0].trim() === cookieName && currCookie[1].trim().length > 0) {
			return currCookie[1].trim();
		}
	}

	// Just in case, creates a cookie that expires in the past (aka deletes cookie)
	document.cookie = cookieName+'=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	return null; 
}

// Gets user's FB information using FB API
function getUserInfo(accessToken, callback) {
	var url = 'https://graph.facebook.com/me?fields=first_name,last_name,name,id,gender';
	$.ajax({
		url: url,
		data: {access_token: accessToken},
		dataType: "JSON",
		success: function(response) {
			callback(response);
		}
	});

}


// Gets all user's FB likes and stores in database
function getUserLikes(accessToken) {
	$.ajax({
		url: 'https://graph.facebook.com/me?fields=id,name,likes',
		data: {access_token: accessToken},
		dataType: "JSON",
		success: function(response) {
			var likes = {id: response.id, name: response.name, likes: response.likes.data};

			$.ajax({
				url: '/api/saveUserLikes',
				data: JSON.stringify(likes),
				method: 'POST',
				dataType: 'JSON',
				contentType: 'application/json',
				success: function(response) {
					console.log(response);
				},
				error: function(response) {
					console.log(response);
				}
			});
		}
	});
}

// Returns list of treatments without local
function getTreatments() {
	return ['treatment_g', 'treatment_s', 'control', 'treatment_i'];
}

// Returns list of treatments including local
function getLocalTreatments() {
	return ['treatment_g', 'treatment_l', 'treatment_s', 'control', 'treatment_i'];
}

// Returns all treatments including global2
function getAllTreatments() {
	return ['treatment_g', 'treatment_g2', 'treatment_l', 'treatment_s', 'control', 'treatment_i'];
}

// If local treatment is being used, then gets friends' results
function getFriendsAnswers(questions, question, callback) {
	console.log(questions);
	// Retrieves data from database
	$.ajax({
		url: '/api/getFriendData',
		contentType: 'application/json',
		data: JSON.stringify({friendIDs: app_friends, question_id: question._id}),
		dataType: 'JSON',
		method: 'POST',
		success: function(data) {
			// Writes string to display friends' data in proper format
			var str = "According to your Facebook friends who also took the survey";
			for (var p in data) {
				console.log('data from friend: ' + data)
				str += ', ' + data[p] + '% answered "' + p + '"';
			}

			str += ".";
			question.treatment = str;
			questions.push(question);
			console.log(questions);
			callback(questions);
		}
	});
}

// Shuffles an array (used to shuffle questions and treatments)
function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex ;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

// Makes sure that all questions given an identity treatment actually has one (ie. no moral dilemma)
function hasIdentityTreatment(questions, treatment_i_start, hasIdentity) {
	for (var i = treatment_i_start; i < questions.length; i++) {
		if (hasIdentity.indexOf(questions[i].title) == -1)
			return false;
	}
	return true;
}

// Creates treatments for questions
function createTreatments(accessToken, questions, callback, hasIdentity) {
	var questionnaire = questions[0].questionnaire;
	var count = 1;
	// Sets up the references for reference page
	for (var i = 0; i < questions.length; i++) {

		// Enumerates each reference so we know which one is which on reference page
		if (questions[i].reference_global != undefined) {
			questions[i].ref_num_g = count;
			count++;
		}

		if (questions[i].reference_status != undefined) {
			questions[i].ref_num_s = count;
			count++;
		}
	}
	// Gets list of friends who have also taken questionnaire
	$.ajax({
		url: 'https://graph.facebook.com/me?fields=friends,accounts', 
		data: {access_token: accessToken},
		dataType: 'jsonp',
		success: function(friend_data) {
			var friends = friend_data.friends;
			var local_treatments = [];
			var local_treatments_ids = [];
			var hasLocal = 0;  
			// See how many friends are also using the app
			// which means they have answers
			// If more than 5, we want to use local treatments
			if (friends.data.length >= 0)
				hasLocal = is_wave2;
				
				// if hasLocal == 1 this is wave 2. Only present either local treatment or control questions
				// if hasLocal == 0 this is wave 1. Shuffle all treatments except local
			
				// If has local treatment, then get all friend IDs so can retrieve
				// their answers from backend later
			var app_friends = [];
			console.log("Just before adding friends");
			for (var i in friends.data){
				console.log("Adding friend: " + i);
				app_friends.push(friends.data[i].id);
			}
			$.ajax({
				url: '/api/saveFriends',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({uid: friend_data.id, friends: app_friends}),
				success: function(res) {
					console.log(res);
				}
			});

			if (hasLocal == 1) {
				// Set up question treatments by randomizing between local and control
				var treatments = [];
				Math.random() < 0.5 ? treatments.push('treatment_l') : treatments.push('control');
				shuffle(treatments);
				var every_treatment = ['treatment_g', 'treatment_g2', 'treatment_s', 'control','treatment_l'];  
			} 

			else { // Otherwise just use regular treatments
				var treatments = ['treatment_g', 'treatment_s', 'control'];
				shuffle(treatments);			// this shuffles order of treatments.

				var every_treatment = ['treatment_g', 'treatment_g2', 'treatment_s', 'control'];

			}
			console.log('Currently in wave 2: ' + (hasLocal == 1 ? 'True' : 'False'));	
			// Only add identity treatment if not the music questionnaire and is policy wave 1
			if (questionnaire != 'music' && hasLocal!=1) {
				console.log("Adding identity treatment");
				treatments.push('treatment_i');    // this adds 'treatment_i' to the end of the treatments array
				every_treatment.push('treatment_i');					
			}

			// Figure out how many of each treatment we need based on the number of questions
			var numEach = Math.floor(questions.length / treatments.length);
			var numLeftover = questions.length - (numEach * treatments.length);
			var extraTreatments = [];
			var all_treatments = [];
			var treatments2 = [];

			for (var t in treatments)   // we need to do it like this so that pointers are not equal
				treatments2.push(treatments[t])

			// For all leftover questions, get random treatments for those
			for (var j = 0; j < numLeftover; j++) {
				var rand = Math.floor(Math.random() * treatments2.length); // ['treatment_g', 'treatment_s', 'control'];
				extraTreatments.push(treatments2[rand]); // ['control']
				treatments2.splice(rand, 1); // ['treatment_g', 'treatment_s'];
			}

			// Gets list of final treatments in order for access later
			for (var t in treatments) {
				if (treatments[t] == "treatment_i")
					var treatment_i_start = all_treatments.length;
				for (var i = 0; i < numEach; i++)
					all_treatments.push(treatments[t]);
				if (extraTreatments.indexOf(treatments[t]) > -1) 
					all_treatments.push(treatments[t]);
			}

			console.log(all_treatments);  // for checking
			var identity_treatments = [];

			// Makes sure that all questions given identity treatment actually have an identity treatment
			if (hasIdentity != undefined) {
				do { shuffle(questions); } while (!hasIdentityTreatment(questions, treatment_i_start, hasIdentity));
			} 
			else {
				shuffle(questions);
			}

			// Set up questions with the given treatment
			for (var q in questions) {
				var question = questions[q];
				var treatment = all_treatments[q];
				question.treatment_type = treatment;
				question.local_type = hasLocal;
				
				if (treatment == 'treatment_l') {
					// If local treatment, then add question ID so can fetch from database
					local_treatments.push(q);
					local_treatments_ids.push(question._id);
				} 
				else {
					// If global, chose between global1 and global2 randomly
					if (treatment == 'treatment_g') {
						if (question.treatment_g2 == undefined) {
							question.treatment_type = 'treatment_g';
						} 
						else {
							var rand_g = Math.floor(Math.random() * 2);
							if (rand_g == 0)
								question.treatment_type = 'treatment_g';
							else
								question.treatment_type = 'treatment_g2';
						}
					}

					// If identity, add to list of all identity treatments 
					// so can figure out from demographics later
					if (treatment == 'treatment_i') {
						question.treatment = "Identity Treatment";
						identity_treatments.push(question.title);
					}
					else
						question.treatment = question[question.treatment_type];
				}

				// Delete all other treatments to minimize array size
				if (question.treatment_type != 'treatment_i') {
					for (var i in every_treatment) {
						if (every_treatment[i] in question) {
							delete question[every_treatment[i]];
						}
					}
				}
				
			}

			if (hasLocal == 1) {
				//console.log(local_treatments_ids);
				/*local_treatments_ids = ["558aed26675db983c140888d", "558aed26675db983c1408890",
					"558aed26675db983c1408891", "558aed26675db983c1408895",
					"558aed26675db983c140888e", "558aed26675db983c1408893",
					"558aed26675db983c1408892", "558aed26675db983c1408894",
					"558aed26675db983c140888f", "558aed26675db983c140888c",
					"558aed26675db983c1408896"];*/

				/*app_friends = [10205628652891800, 10153306689188552, 10152911970233212,
				10152909706628845];*/

				// If local, get friend data
				$.ajax({
					url: '/api/getFriendData',
					contentType: 'application/json',
					data: JSON.stringify({friendIDs: app_friends, question_id: local_treatments_ids, questionnaire: questionnaire}),
					dataType: 'JSON',
					method: 'POST',
					success: function(data) {
						console.log(data);
						var count = 0;

						if (questionnaire === 'music') {
							for (var k in data) {
								var str = "Your Facebook friends who also took the survey gave this song an average rating of " + data[k] + " stars.";
								questions[local_treatments[count]].treatment = str;
								count++;
							}

						} 
						else {
							for (var ind in local_treatments) {
								// For each local treatment, find its corresponding answers using the 
								// index in array and corresponding ID
								var curr_ind = local_treatments[ind];
								var curr_id = local_treatments_ids[ind];
								var curr_data = data[curr_id];

								console.log(curr_data);
								// string for wave 2
								var str = "Out of your Facebook friends whom you invited to take the survey";
								// string for wave 1
								var str_wv_1 = "Out of your Facebook friends who have taken the survey";

								var phrasing = "";
								
								console.log(questions[curr_ind]);
								if (questions[curr_ind].phrasing_identity.length > 0) {
									phrasing = questions[curr_ind].phrasing_identity.split("background,")[1];
									var sub_end = (phrasing.lastIndexOf(".") == phrasing.length - 1) ? phrasing.length-2 : phrasing.length-1;
									phrasing = phrasing.trim().substring(0, sub_end);
								} 
								else if (questions[curr_ind].title === 'stem_cell_research') {
									phrasing = "support stem cell research";
								}


								// TODO: Fix phrasing for identity treatment to avoid "Do not are very"

								var local_t_value = 0;
								for (var p in curr_data) {
									local_t_value = curr_data[p];
									var ans = isNaN(parseInt(p)) ? 'said they would "' + p + '"' : ( (parseInt(p) == 0) ? "do not " : "");
									str += ', ' + curr_data[p] + '% ' + ans + phrasing;
								}

								str += ".";
								questions[curr_ind].treatment_l_value = local_t_value;
								questions[curr_ind].treatment = str;
							}
						}
					}
				});
			} 

			// Once all questions are done being set up, adds them as value to div for access later
			d3.select("#question-selector").selectAll("div")
				.data(questions)
				.enter()
				.append("div")
				.attr("class", "question-selector-circle clickable hidden")
				.attr("id", function(d, i) { return "question-" + i; });

			$(".question-selector-circle").first().addClass("selected");

			// create array for user answers
			// ['70|40', '|', '|']
			var emptyArr = []
			for (var i in questions) {
				emptyArr.push("|");
			}
			$("#user-questions").val(emptyArr);

			ans_array = [];
			for (var i in questions){
				ans_array.push("|");
			}

			$("#user-questions-ii").val(ans_array);

			callback();

			console.log(questions);
			
		}

	});

}


function askDemographics() {
	getUserInfo(accessToken, function(data) {
		console.log("Initial data: ");
		console.log(data);
		// Gets demographics questions from database
		$.ajax({
			url: '/api/getDemographics',
			dataType: 'JSON',
			success: function(dataWanted) {
				var hasAllData = true;

				$("#questionnaires").hide();
				if ($("#question-text").length === 0) {
					$(".display-table-cell").html("<div id = 'question-text'></div>");
				}

				var question_text_parent = $("#question-text").parent();
				$(question_text_parent).html("<div id = 'question-text'></div>");
				$("#question-text").css("width", "75%");
				$("#question-text").css("float", "none");
				$(this).hide();
				var questionnaire = d3.select(".question-selector-circle").data()[0].questionnaire;
				var musicNoDemo = ['vote', 'vote_next', 'political_upbringing'];
				var policyNoDemo = ['music_play', 'music_play_years', 'music_taste', 'music_childhood'];

				if ( $(window).width() < 480){
					// Checks for what information we are missing
				// For each one, add to page
					for (var i in dataWanted) {
						if (!(dataWanted[i].name in data) && ( (questionnaire === 'policy' && policyNoDemo.indexOf(dataWanted[i].name) == -1 ) || 
							( questionnaire === 'music' && musicNoDemo.indexOf(dataWanted[i].name) == -1 ) ) ) {

							if (dataWanted[i].type.toLowerCase() == 'text') {
								 $("#question-text").append("<div class = 'font-15 demographics-header'>" +
										capitalize(dataWanted[i].question) + 
										": <br/><input class = 'font-15' type = 'text' name = '" + dataWanted[i].name + "'/></div>");
							}
							
							else if (dataWanted[i].type.toLowerCase() == 'range') {
								data[dataWanted[i].name] = 50;
								$("#question-text").append("<div class = 'font-15 demographics-header'>" + capitalize(dataWanted[i].question) + "<br/>"+
									"<input type = 'range' name='" + dataWanted[i].name + "' min='0' max='100'>" +
									"<ul class = 'importance-list no-list font-15'></ul></div>");

								var values = dataWanted[i].values.split(",");
								if (values.length == 2) {
									$(".importance-list:last").append("<li class = 'inline-block left'>" + values[0] + "</li>");
									$(".importance-list:last").append("<li class = 'inline-block right'>" + values[1] + "</li>");
								} 
								else {
									for (var k in values) {
										$(".importance-list:last").append("<li class = 'inline-block center'>" + values[k] + "</li>");
									}
								}
								

								$(".importance-list:last li").width(100/ values.length + "%");
								
							} 
							else if (dataWanted[i].type.toLowerCase() == 'radio') {
								var values = dataWanted[i].values.split(",");
								$("#question-text").append("<div class = 'font-15 demographics-header radio-header'>" + capitalize(dataWanted[i].question) + "<br/>"+
									"<ul class = 'no-list font-15 question-list-larger-mob'></ul></div>");
								for (var j in values) {
									$(".question-list-larger-mob:last").append("<li class = 'left'><input type = 'radio' name = '" + dataWanted[i].name + "' value = '"+values[j].trim()+"'><span class = 'question-text-text'>" + capitalize(values[j]) + "</span></li>");		
								}
							} 
							else if (dataWanted[i].type.toLowerCase() == 'select') {
								var values = dataWanted[i].values.split(",");
								//var location_prev = $("input[type=text]:last").parent();
								//( questionnaire === 'music' ) ? $("input[type=text]:last") : $("input[type=range]:last").after();

								$("#question-text").append("<div class = 'font-15 demographics-header select-header'>" + capitalize(dataWanted[i].question) + 
									": <select name = '" + dataWanted[i].name + "'></div>");

								if (dataWanted[i].question.length >= 50) {
									$("select:last").before("</br>");
									$("select:last").css("margin-top", "10px");
								}

								/*if (dataWanted[i].name === 'income') {
									for (var j in values) {
										var curr_value = (values[j].indexOf("$") >= 0) ? values[j].split("$")[1].replace(/[\D]/g, "") : "Other";
										$("select:last").append("<option value = '"+curr_value+"'>" + capitalize(values[j]) + "</option>");		
									}

									var second_last = $("select:last option:nth-last-child(2)");
									$(second_last).val(">" + $(second_last).val())
								} else {*/
								for (var j in values) {
									$("select:last").append("<option value = '"+values[j].trim()+"'>" + capitalize(values[j]) + "</option>");		
								}
								//}
								
							}

							hasAllData = false;
						}
					}
				}
				else{
				// Checks for what information we are missing
				// For each one, add to page
					for (var i in dataWanted) {
						if (!(dataWanted[i].name in data) && ( (questionnaire === 'policy' && policyNoDemo.indexOf(dataWanted[i].name) == -1 ) || 
							( questionnaire === 'music' && musicNoDemo.indexOf(dataWanted[i].name) == -1 ) ) ) {

							if (dataWanted[i].type.toLowerCase() == 'text') {
								 $("#question-text").append("<div class = 'font-15 demographics-header'>" +
										capitalize(dataWanted[i].question) + 
										": <br/><input class = 'font-15' type = 'text' name = '" + dataWanted[i].name + "'/></div>");
							}
							
							else if (dataWanted[i].type.toLowerCase() == 'range') {
								data[dataWanted[i].name] = 50;
								$("#question-text").append("<div class = 'font-15 demographics-header'>" + capitalize(dataWanted[i].question) + "<br/>"+
									"<input type = 'range' name='" + dataWanted[i].name + "' min='0' max='100'>" +
									"<ul class = 'importance-list no-list font-15'></ul></div>");

								var values = dataWanted[i].values.split(",");
								if (values.length == 2) {
									$(".importance-list:last").append("<li class = 'inline-block left'>" + values[0] + "</li>");
									$(".importance-list:last").append("<li class = 'inline-block right'>" + values[1] + "</li>");
								} 
								else {
									for (var k in values) {
										$(".importance-list:last").append("<li class = 'inline-block center'>" + values[k] + "</li>");
									}
								}
								

								$(".importance-list:last li").width(100/ values.length + "%");
								
							} 
							else if (dataWanted[i].type.toLowerCase() == 'radio') {
								var values = dataWanted[i].values.split(",");
								$("#question-text").append("<div class = 'font-15 demographics-header radio-header'>" + capitalize(dataWanted[i].question) + "<br/>"+
									"<ul class = 'no-list font-15 question-list-larger'></ul></div>");
								for (var j in values) {
									$(".question-list-larger:last").append("<li class = 'left inline'><input type = 'radio' name = '" + dataWanted[i].name + "' value = '"+values[j].trim()+"'><span class = 'question-text-text'>" + capitalize(values[j]) + "</span></li>");		
									if ( (j + 1) % 3 == 0)
										$(".question-list-larger:last").append("<br/>");
								}
							} 
							else if (dataWanted[i].type.toLowerCase() == 'select') {
								var values = dataWanted[i].values.split(",");
								//var location_prev = $("input[type=text]:last").parent();
								//( questionnaire === 'music' ) ? $("input[type=text]:last") : $("input[type=range]:last").after();

								$("#question-text").append("<div class = 'font-15 demographics-header select-header'>" + capitalize(dataWanted[i].question) + 
									": <select name = '" + dataWanted[i].name + "'></div>");

								if (dataWanted[i].question.length >= 50) {
									$("select:last").before("</br>");
									$("select:last").css("margin-top", "10px");
								}

								/*if (dataWanted[i].name === 'income') {
									for (var j in values) {
										var curr_value = (values[j].indexOf("$") >= 0) ? values[j].split("$")[1].replace(/[\D]/g, "") : "Other";
										$("select:last").append("<option value = '"+curr_value+"'>" + capitalize(values[j]) + "</option>");		
									}

									var second_last = $("select:last option:nth-last-child(2)");
									$(second_last).val(">" + $(second_last).val())
								} else {*/
								for (var j in values) {
									$("select:last").append("<option value = '"+values[j].trim()+"'>" + capitalize(values[j]) + "</option>");		
								}
								//}
								
							}

							hasAllData = false;
						}
					}
				}

				if (!hasAllData) {
					if (questionnaire === 'music')
						$("#question-text").prepend("<br/>We would like to know a little bit more about you. Please answer a few questions about yourself.");
					else 						
						$("#question-text").prepend("<br/>Now we would like to know what people like you believe. Please answer a few questions about yourself. Based on your answers, we can tell you what most people with your background think based on national polls.");
				}

				var ind = $(".question-selector-circle").index($(".selected"));
				if (ind==$(".question-selector-circle").length-1)	{
					$("#question-text").append("<br/><input type = 'button' id = 'submit-questionnaire' value = 'Skip' class = 'clickable'/>" +
						"<input type = 'button' id = 'submit-questionnaire' value = 'Next' class = 'demographics-next clickable' disabled/>");
				} 
				else {$("#question-text").append("<br/><input type = 'button' id = 'skip-demographics' value = 'Skip' class = 'clickable'/>" +
					"<input type = 'button' id = 'next-question' value = 'Next' class = 'demographics-next clickable' disabled/>");
				}

				console.log("After data: ");
				console.log(data);
				// Adds user information to a hidden div
				d3.select("#user")
					.selectAll("div")
					.data([data])
					.enter()
					.append("div")
					.attr("class", "hidden user-info");

			}
		});
		

	});
}

// Displays dialog box for inviting friends
function sendFriendsDialog() {
	// Get user's ID and questionnaire name
	var userID = d3.selectAll(".user-info").data()[0].id;
	var url = ( window.location.href.lastIndexOf("/") == window.location.href.length - 1) ? 
		window.location.href.substr(0, window.location.href.length - 1) : window.location.href;
	var urlArray = url.split("//")[1].split("/");
	
	if (urlArray.length > 3) {
		var loginUrl = urlArray[urlArray.length - 2];
	} 
	else
		var loginUrl = urlArray[urlArray.length - 1];

	console.log(userID);
	
	if (userID == '1368751615')
		var link = url_name + '/login/'+loginUrl+'/'+userID+userID+'/';
	else
		var link = url_name + '/login/'+loginUrl+'/'+userID+'/';

	// Create link in dialog with user's ID and questionnaire name 
	// so know info when clicked on
	FB.ui({
		method: 'share',
		href: link
	});
}

// Makes the bar graph using the percentages in database
function makeBarGraph(data) {
	if ( $(window).width() < 750) {
		var margin = {top: 20, right: 20, bottom: 50, left: 50},
			width = 300 - margin.left - margin.right,
			height = 250 - margin.top - margin.bottom;
	}
	else {
		var margin = {top: 20, right: 20, bottom: 50, left: 50},
			width = 375 - margin.left - margin.right,
			height = 250 - margin.top - margin.bottom;
	}
	var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
	var y = d3.scale.linear().range([height, 0]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");

	var svg = d3.select("#question-treatment")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	$(svg).css("margin-left", -1 * margin.left + "px");
 
 	x.domain(data.map(function(d) { return d.year; }));
	y.domain([d3.min(data, function(d) { return +d.value; }) - 10, d3.max(data, function(d) { return +d.value; }) + 10]);

	var curr_question_ind = $(".question-selector-circle").index($(".selected"));
	var curr_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind];

	// Custom attributes for online_privacy because it doesn't have "Year" on the x-axis
	if (curr_question.title === 'online_privacy'){
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
			.selectAll(".tick text")
			.call(wrap, x.rangeBand());
	}
	else{
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
			.append("text")
			.attr("y", 40)
			.attr("x", "35%")
			.style("text-anchor", "start")
			.text(function(d) {
				console.log(d); return "Year";
			});
	}
	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", -50)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("Percentage of Americans (%)");

	var bar = svg.selectAll(".bar")
			.data(data)
		.enter()
		.append("g")
		.attr("transform", "translate("+x.rangeBand()/4+",0)");


	bar.append("rect")
		.attr("class", "bar")
		.attr("width", x.rangeBand() / 2)
		.attr("x", function(d) { return x(d.year); })
		.attr("y", height)
		.attr("height", 0)
		.transition()
			.duration(750)
		.attr("y", function(d) { return y(d.value); })
		.attr("height", function(d) { return height - y(d.value); });


	bar.append("text")
		.attr("y", height)
		.transition()
			.duration(750)
		.attr("x", function(d) { return x(d.year); })
		.attr("y", function(d) { return y(d.value); })
		.attr("dy", "1.1em")
		.attr("dx", x.rangeBand() / 6)
		.style("text-anchor", "start")
		.attr("class", "bar-text")
		.text(function(d) { return d.value + "%"; });
}

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

function type(d) {
  d.value = +d.value;
  return d;
}


function getNewIdentityTreatments(curr_ind) {
	var treatments = ['treatment_g', 'treatment_s', 'control'];
	var all_data = d3.selectAll(".question-selector-circle").data();

	for (var i = curr_ind; i < all_data.length; i++) {
		console.log(i);
		var rand = Math.floor(Math.random() * treatments.length);
		var new_treatment = treatments[rand];
		treatments.splice(rand, 1);
		all_data[i].treatment_type = new_treatment;
		all_data[i].treatment = all_data[i][new_treatment];

		if (treatments.length == 0) {
			var treatments = ['treatment_g', 'treatment_s', 'control'];
		}
	}

	console.log(all_data);

	d3.selectAll(".question-selector-circle").data(all_data);
}

// Submit user data into database
function submitUserInfo(i) {
	var user = d3.select(".user-info").data()[0];
	var userID = user.id;

	if (i == null)
		getIdentityTreatments(getIdentityNames(), user);

	$.ajax({
		url: '/api/sendUser',
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(user),
		success: function(response) {
			console.log(response);
			var url = ( window.location.href.lastIndexOf("/") == window.location.href.length - 1) ? 
				window.location.href.substr(0, window.location.href.length - 1) : window.location.href;
			var urlArray = url.split("//")[1].split("/");

			console.log(urlArray);
			
			if (urlArray.length > 3) {
				var loginUrl = urlArray[urlArray.length - 2];
				$.ajax({
					method: 'POST',
					url: '/api/addFriend',
					data: {userID: userID, friendID: urlArray[urlArray.length - 1], questionnaire: urlArray[urlArray.length - 2]}
				});
			} 
		}
	});

}

// Shows question based on index number
/*function showQuestion(num) {
	// Sets up date to figure out time elapsed
	var d = new Date();
	setTime(d, num);
	setDate(d, num);

	// Gets corresponding question
	var question = d3.selectAll(".question-selector-circle").data()[num];
	$("#question-box div").html("<div id = 'question-text'></div>");
	$("#question-text").empty();

	// If moral dilemma, need to separate question differently so that last part of question 
	// is only shown after user clicks "Next"
	if (question.title == 'moral_dilemma') {
		var i = question.question.lastIndexOf(". ");
		var q = question.question.substr(0, i);
		$("#question-text").html("<div class = 'font-black question-header'>" + capitalize(q) + ".</div>"); 
	}

	// Shows the appropriate treatment on screen
	showTreatment(num);

	/*if (question.treatment_type.toLowerCase() != 'control') {
		if ($("#next-question").length > 0) {
			$("#next-question").attr('id','show-treatment');
			$("#next-question").val('Next')
		} else {
			$("#question-text").append("<input type='button' class='custom-button clickable' id='show-treatment' value='Next'/>");
		}
	} else {
		if ($("#next-question").length > 0) {
			$("#next-question").attr('id','show-values');
			$("#next-question").val('Show Choices')
		} else {
			$("#question-text").append("<input type='button' class='custom-button clickable' id='show-values' value='Show Choices'/>");
		}
	}*/	
//} 

/*function showTreatment(num) {
	// Gets the corresponding question based on the index provided in variable num
	var question = d3.selectAll(".question-selector-circle").data()[num];

	// Displays the question's title (ie. Moral Dilemma, Same-Sex Marriage)
	$("#question-text").prepend("<div id = 'question-title'>" + capitalizeSentence(question.title) +"</div>");
	
	// If there is a treatment (ie. not control)
	if (question.treatment_type.toLowerCase() != 'control' && question.treatment != undefined) {
		// If we want to create a graph for the treatment (ie. global treatment)
		if (question.treatment.indexOf("|") >= 0 && question.treatment_type.toLowerCase() != "treatment_s" && question.title != "moral_dilemma") {
			var arr = question.treatment.split('|');
			$("#question-text").append("<div class = 'font-black font-18 bold' id = 'question-treatment'>" + 
				capitalize(arr[0]) + "<br/></div>");

			var data = [];
			
			// Set up data in format that is understandable to d3 library
			data.push({"year": arr[1].split(":")[0].trim(), "value": arr[1].split(":")[1].trim()});
			data.push({"year": arr[2].split(":")[0].trim(), "value": arr[2].split(":")[1].trim()});

			makeBarGraph(data);
			$("#question-treatment").append("<div id = 'question-treatment-reference' class = 'font-15 italics bold'>[Click <a href='/references#"+question["ref_num_g"]+"' target='_blank'>here</a> to see reference]</div></div>");

		} else {
			// Otherwise just show the treatment as is displayed
			if (question.treatment_type.toLowerCase() == "treatment_g")
				$("#question-treatment").append("<div id = 'question-treatment-reference' class = 'font-15 italics bold'>[Click <a href='/references#"+question["ref_num_g"]+"' target='_blank'>here</a> to see reference]</div></div>");
			else if (question.treatment_type.toLowerCase() == "treatment_i")
				$("#question-treatment").append("<div id = 'question-treatment-reference' class = 'font-15 italics bold'>[Click <a href='"+question["reference_identity"]+"' target='_blank'>here</a> to see reference]</div></div>");

			$("#question-text").append("<div class = 'font-black font-15 italics bold' id = 'question-treatment'>" + capitalize(question.treatment) + "</div>");
		}

		// If a status treatment, then add on the reference link
		if (question.treatment_type.toLowerCase() == 'treatment_s') {
			if ( question.reference_status != undefined ) {
				var reference = question["ref_num_" + question.treatment_type.split("_")[1]];
				$("#question-treatment").append("<div id = 'question-treatment-reference' class = 'font-15 italics bold'>[Click <a href='/references#"+reference+"' target='_blank'>here</a> to see reference]</div></div>");
			}

			$("#question-treatment").append("<div class = 'font-black bold' id = 'question-footnote'>" + capitalize(question.treatment_s_footnote) + "</div>");
		}

	}
	

	$("#question-text").append("<input type='button' class='custom-button clickable' id='show-values' value='Next'/>");

	//$("#question-treatment").slideDown('slow');
}*/

// Uses demographic information to get identity treatments
function getIdentityTreatments(questionIds, demographics) {
	console.log(questionIds, demographics);
	$.ajax({
		url: "/api/getIdentityTreatment",
		method: "POST",
		dataType: "JSON",
		contentType: "application/json",
		data: JSON.stringify({questions: questionIds, demographics: demographics}),
		success: function(treatments) {
			// Creates string for treatments
			console.log(treatments);
			var ind = $('.question-selector-circle').index($('.selected'));
			var all_data = d3.selectAll(".question-selector-circle").data();

			var support = Math.random() > 0.5;

			for (var i = ind; i < all_data.length; i++) {
				// add probability value to current question
				var curr_question = d3.selectAll(".question-selector-circle").data()[i];
				var n = treatments.probabilities[all_data[i].title];
				shareIdentityValue(i, n, support);
				
				if (support){
					all_data[i].treatment = all_data[i].phrasing_identity.replace("X%", treatments.probabilities[all_data[i].title]+"%");
				}
				else{
					var percent = 100 - treatments.probabilities[all_data[i].title];
					all_data[i].treatment = all_data[i].phrasing_identity.replace("X%", percent+"%");

					if (all_data[i].phrasing_identity.indexOf("support") > -1){
						all_data[i].treatment = all_data[i].treatment.replace("support", "oppose");
					}
					else if(all_data[i].phrasing_identity.indexOf("are very concerned") > -1){
						all_data[i].treatment = all_data[i].treatment.replace("are very concerned", "are NOT very concerned");
					}
					else if(all_data[i].phrasing_identity.indexOf("approve") > -1){
						all_data[i].treatment = all_data[i].treatment.replace("approve", "do NOT approve");	
					}
					else if(all_data[i].phrasing_identity.indexOf("believe") > -1){
						all_data[i].treatment = all_data[i].treatment.replace("believe", "do NOT believe");
					}
				}

			}

			console.log(all_data);

			d3.selectAll(".question-selector-circle").data(all_data);
			showQuestion(ind);

		}
	});
}

// Gets names of all questions with identity treatment
function getIdentityNames() {
	var ind = $('.question-selector-circle').index($('.selected'));
	var all_data = d3.selectAll(".question-selector-circle").data();
	var identity_treatments = [];

	for (var i = ind; i < all_data.length; i++) {
		identity_treatments.push(all_data[i].title);
	}

	return identity_treatments;
}

// Uses YouTube API to fetch all main songs from YouTube playlist
function getMainYoutubePlaylist(songs, nexPageToken, callback) {
	// If exceeds 50 songs (max num API can get at once), keeps looping through list 
	if (nextPageToken == null || nextPageToken == undefined)
		var nextPageToken = "";
	else nextPageToken = "&pageToken="+nextPageToken;

	if (songs == null || songs == undefined) 
		songs = [];

	$.ajax({
		url: 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=PL-F_xeGwyiSKMWDdGI1ExLjcqJWW6u4lB&key='+apiKey+nextPageToken,
		dataType: 'JSON',
		success: function(response) {
			//console.log(response);

			// Adds all songs to list
			for (var i in response.items) {
				var curr_song = response.items[i].snippet;
				songs.push(curr_song.resourceId.videoId);
			}

			if (response.nextPageToken != undefined) {
				getYoutubePlaylist(songs, response.nextPageToken, callback);
			} else {
				// Once done getting all song IDs, gets song info for questionnaire
				getYoutubeSongs(songs, callback);
			}
		}
	});
}

// Uses YouTube API to fetch all songs from YouTube playlist
function getYoutubePlaylist(songs, nextPageToken, callback) {
	if (nextPageToken == null || nextPageToken == undefined)
		nextPageToken = "";
	else nextPageToken = "&pageToken="+nextPageToken;

	if (songs == null || songs == undefined) 
		songs = [];

	$.ajax({
		url: 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=PL-F_xeGwyiSKwU0g-4ygo2OjhKQxdF6LF&key='+apiKey+nextPageToken,
		dataType: 'JSON',
		success: function(response) {
			//console.log(response);
			for (var i in response.items) {
				var curr_song = response.items[i].snippet;
				songs.push(curr_song.resourceId.videoId);
			}

			if (response.nextPageToken != undefined) {
				getYoutubePlaylist(songs, response.nextPageToken, callback);
			} else {
				getYoutubeSongs(songs, callback);
			}
		}
	});
}

// Uses YouTube API to get all song info, ie. song title and num likes for treatments 
function getYoutubeSongs(songs, callback) {
	var all_songs = [];
	var count = 0;
	for (var i in songs) {
		var url = 'https://www.googleapis.com/youtube/v3/videos?id='+songs[i]+'&key='+apiKey+'&fields=items(id,snippet(title),statistics)&part=snippet,statistics';
		$.ajax({
			url: url,
			dataType: 'JSON',
			success: function(response) {
				var curr_song = response.items[0];
				var title = curr_song.snippet.title;
				var treatment_g = curr_song.statistics.likeCount;
				var url = "https://www.youtube.com/embed/"+curr_song.id;

				all_songs.push({id: curr_song.id, questionnaire: "music", title: title, treatment_g: parseInt(treatment_g), url: url, main: 0});
				//console.log(title + ": " + url);
				count++;

				// Once done for all songs, add to database
				if (count == Object.keys(songs).length) {
					/*console.log("DONE!");
					console.log(all_songs);
					console.log(all_songs.length)*/
					callback(all_songs);
				}
			}
		});
	}
}

// Gets the amount of time elapsed for answering question
function setTime(d, ind) {
	if (ind > 0) {
		curr_time = d.getTime();
		time_elapsed = curr_time - prev_time;
		prev_time = curr_time;

		var all_data = d3.selectAll(".question-selector-circle").data();
		all_data[ind - 1].answer_time = time_elapsed;
		//console.log(prev_time, curr_time, time_elapsed);
		d3.selectAll(".question-selector-circle").data(all_data);
	} else {
		prev_time = d.getTime();
	}
}

// Gets the current date as the starting time for survey
function setDate(d, ind) {
	var n = d.toLocaleString();
	var all_data = d3.selectAll(".question-selector-circle").data();
	all_data[ind].start_time = n;
	d3.selectAll(".question-selector-circle").data(all_data);
}




