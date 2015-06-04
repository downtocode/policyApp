function capitalize(string) {
	return string.charAt(0).toUpperCase() + string.substring(1,string.length);
}

function capitalizeSentence(string) {
	var strArr = string.split(/[\s_]+/);	
	for (var word in strArr) {
		strArr[word] = capitalize(strArr[word]);
	}
	return strArr.join(" ");
}

function hasCookie(cookieName) {
	var cookies = document.cookie.split(";");
	for (var cookie in cookies) {
		var currCookie = cookies[cookie].split("=");
		if (currCookie[0].trim() === cookieName && currCookie[1].trim().length > 0) {
			return currCookie[1].trim();
		}
	}

	document.cookie = cookieName+'=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	return null; 
}

function getUserInfo(accessToken, callback) {
	var url = 'https://graph.facebook.com/me';
	$.ajax({
		url: url,
		data: {access_token: accessToken},
		dataType: "JSON",
		success: function(response) {
			callback(response);
		}
	});
}

function getTreatments() {
	return ['treatment_g', 'treatment_s', 'control', 'treatment_i'];
}

function getLocalTreatments() {
	return ['treatment_g', 'treatment_l', 'treatment_s', 'control', 'treatment_i'];
}

function getAllTreatments() {
	return ['treatment_g', 'treatment_g2', 'treatment_l', 'treatment_s', 'control', 'treatment_i'];
}

function getFriendsAnswers(questions, question, callback) {
	$.ajax({
		url: '/api/getFriendData',
		contentType: 'application/json',
		data: JSON.stringify({friendIDs: app_friends, question_id: '5535b299675db983c13fbed6'}),//question._id}),
		dataType: 'JSON',
		method: 'POST',
		success: function(data) {
			num_finished += 1;
			var str = "According to your Facebook friends who also took the survey";

			for (var p in data) {
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


function createTreatments(accessToken, questions) {
	shuffle(questions);

	// gets friends using app
	// /me/invitable_friends gets all friends
	$.ajax({
		url: 'https://graph.facebook.com/me/friends', 
		data: {access_token: accessToken},
		dataType: 'jsonp',
		success: function(friends) {
			var local_treatments = [];
			// see how many friends are also using the app
			// which means they have answers
			// if more than 5, we want to use local treatments
			if (friends.data.length > 5) {
				var app_friends = [];
				for (var i in friends.data)
					app_friends.push(friends.data[i].id);

				/*app_friends.push('1368751615');
				app_friends.push('10205628652891829');
				app_friends.push('10153306689188552');
				app_friends.push('10152909706628845');*/

				// set up question treatments
				var treatments = ['treatment_g', 'treatment_s', 'control', 'treatment_l'];
				shuffle(treatments);
				treatments.push('treatment_i');
				var every_treatment = ['treatment_g', 'treatment_g2', 'treatment_s', 'control', 'treatment_l', 'treatment_i'];

			} else { // otherwise just use regular treatments
				var treatments = ['treatment_g', 'treatment_s', 'control'];
				shuffle(treatments);
				treatments.push('treatment_i');
				var every_treatment = ['treatment_g', 'treatment_g2', 'treatment_s', 'control', 'treatment_i'];
			}

			var numEach = Math.floor(questions.length / treatments.length);
			var numLeftover = questions.length - (numEach * treatments.length);
			var extraTreatments = [];
			var all_treatments = [];
			var treatments2 = []

			for (var t in treatments)
				treatments2.push(treatments[t])

			for (var j = 0; j < numLeftover; j++) {
				var rand = Math.floor(Math.random() * treatments2.length); // ['treatment_g', 'treatment_s', 'control'];
				extraTreatments.push(treatments2[rand]); // ['control']
				treatments2.splice(rand, 1); // ['treatment_g', 'treatment_s'];
			}

			for (var t in treatments) {
				for (var i = 0; i < numEach; i++)
					all_treatments.push(treatments[t]);
				if (extraTreatments.indexOf(treatments[t]) > -1) 
					all_treatments.push(treatments[t]);
			}

			console.log(all_treatments);

			for (var q in questions) {
				var question = questions[q];
				var treatment = all_treatments[q];
				question.treatment_type = treatment;
				
				if (treatment == 'treatment_l') {
					local_treatments.push(q);
				} else {
					if (treatment == 'treatment_g') {
						if (question.treatment_g2 == undefined) {
							question.treatment_type = 'treatment_g';
						} else {
							var rand_g = Math.floor(Math.random() * 2)
							if (rand_g == 0)
								question.treatment_type = 'treatment_g';
							else
								question.treatment_type = 'treatment_g2';
						}
					}

					if (treatment == 'treatment_i') {
						question.treatment = "Identity Treatment";
					}
					else
						question.treatment = question[question.treatment_type];
				}

				for (var i in every_treatment) {
					if (every_treatment[i] in question) {
						delete question[every_treatment[i]];
					}
				}
				
			}

			if (friends.data.length > 5) {
				$.ajax({
					url: '/api/getFriendData',
					contentType: 'application/json',
					data: JSON.stringify({friendIDs: app_friends, question_id: ['5535b299675db983c13fbed6', '5535b299675db983c13fbeda']}),//question._id}),
					dataType: 'JSON',
					method: 'POST',
					success: function(data) {
						var count = 0;
						for (var k in data) {
							var str = "According to your Facebook friends who also took the survey";

							for (var p in data[k]) {
								str += ', ' + data[k][p] + '% answered "' + p + '"';
							}

							str += ".";

							questions[local_treatments[count]].treatment = str;
							count++;
						}
					}
				});
			}

			console.log(questions);

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

			showQuestion(0);
		}

	});

}


function askDemographics() {
	getUserInfo(accessToken, function(data) {
		// Gets all of the user's information that we can get from FB
		$.ajax({
			url: '/api/getDemographics',
			dataType: 'JSON',
			success: function(dataWanted) {
				var hasAllData = true;

				$("#questionnaires").hide();
				var question_text_parent = $("#question-text").parent();
				$(question_text_parent).html("<div id = 'question-text'></div>");
				$("#question-text").css("width", "75%");
				$("#question-text").css("float", "none");
				$(this).hide();

				// Checks for what information we are missing
				for (var i in dataWanted) {
					if (!(dataWanted[i].name in data)) {
						
						if (dataWanted[i].type.toLowerCase() == 'text')
							$("#question-text").append("<div class = 'font-15 demographics-header'>" +
								capitalize(dataWanted[i].question) + 
								": <br/><input class = 'font-15' type = 'text' name = '" + dataWanted[i].name + "'/></div>");
						
						else if (dataWanted[i].type.toLowerCase() == 'range') {
							data[dataWanted[i].name] = 50;
							$("#question-text").append("<div class = 'font-15 demographics-header'>" + capitalize(dataWanted[i].question) + "<br/>"+
								"<input type = 'range' name='" + dataWanted[i].name + "' min='0' max='100'>" +
								"<ul class = 'importance-list no-list font-15'></ul></div>");

							var values = dataWanted[i].values.split(",");
							for (var k in values) {
								$(".importance-list:last").append("<li class = 'inline-block center'>" + values[k] + "</li>");
							}

							$(".importance-list:last li").width(100/ values.length + "%");
							
						} else if (dataWanted[i].type.toLowerCase() == 'radio') {
							var values = dataWanted[i].values.split(",");
							$("#question-text").append("<div class = 'font-15 demographics-header radio-header'>" + capitalize(dataWanted[i].question) + "<br/>"+
								"<ul class = 'no-list font-15 question-list-larger'></ul></div>");
							for (var j in values) {
								$(".question-list-larger:last").append("<li class = 'left inline'><input type = 'radio' name = '" + dataWanted[i].name + "' value = '"+values[j]+"'><span class = 'question-text-text'>" + capitalize(values[j]) + "</span></li>");		
								if ( (j + 1) % 3 == 0)
									$(".question-list-larger:last").append("<br/>");
							}
						}

						hasAllData = false;
					}
				}

				if (!hasAllData)
					$("#question-text").prepend("Now we'd like to know what people like you believe. Please answer a few questions about yourself.");

				// Asks extra questions
				/*$("#question-text").append("<br/>How are you feeling?<br/>"+
					"<input type = 'range' name='feeling' min='0' max='100'><ul class = 'importance-list no-list font-15'></ul>");

				$(".importance-list").append("<li class = 'inline-block center'>Very<br/>Happy</li>" +
					"<li class = 'inline-block center'>Happy</li>" +
					"<li class = 'inline-block center'>Stressed</li>" +
					"<li class = 'inline-block center'>Anxious</li>" +
					"<li class = 'inline-block center'>Depressed</li>");

				$(".importance-list li").width("20%");

				$("#question-text").append("<br/>Political Views<br/>" +
					"<input type = 'range' name='political-view' min='0' max='100'><ul class = 'importance-list no-list font-15'></ul>");
				
				$(".importance-list:last").append("<li class = 'inline-block left'>Democrat</li>" +
					"<li class = 'inline-block right'>Republican</li>");

				$(".importance-list:last li").width("50%");

				*/

				$("#question-text").append("<input type = 'button' id = 'next-question' value = 'Next' class = 'demographics-next clickable' disabled/>");
				
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


function sendFriendsDialog(userID) {
	var url = ( window.location.href.lastIndexOf("/") == window.location.href.length - 1) ? 
		window.location.href.substr(0, window.location.href.length - 1) : window.location.href;
	var urlArray = url.split("//")[1].split("/");
	
	if (urlArray.length > 3) {
		var loginUrl = urlArray[urlArray.length - 2];
		$.ajax({
			method: 'POST',
			url: '/api/addFriend',
			data: {userID: userID, friendID: urlArray[urlArray.length - 2], questionnaire: urlArray[urlArray.length - 3]}
		});
	} else
		var loginUrl = urlArray[urlArray.length - 1];

	var link = 'https://stark-crag-5229.herokuapp.com/login/'+loginUrl+'/'+userID+'12345/';

	FB.ui({
		method: 'send',
		link: link
	});
}

