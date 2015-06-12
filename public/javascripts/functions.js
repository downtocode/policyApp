$(document).ready(function() {
	$(document).on("click", "#submit-instructions", function() {
		$(".display-table-cell").children().fadeOut(500, function() {
			$(this).remove();
			$("li:first").remove();
			$("li.hidden").show();
			showQuestion(0);
		});
	});
});

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
	var count = 1;
	for (var i = 0; i < questions.length; i++) {
		if (questions[i].reference_global != undefined) {
			questions[i].ref_num_g = count;
			count++;
		}

		if (questions[i].reference_status != undefined) {
			questions[i].ref_num_s = count;
			count++;
		}
	}

	shuffle(questions);

	// gets friends using app
	// /me/invitable_friends gets all friends
	$.ajax({
		url: 'https://graph.facebook.com/me/friends', 
		data: {access_token: accessToken},
		dataType: 'jsonp',
		success: function(friends) {
			var local_treatments = [];
			var hasLocal = 0;
			// see how many friends are also using the app
			// which means they have answers
			// if more than 5, we want to use local treatments
			if (friends.data.length > 5)
				hasLocal = Math.floor(Math.random() * 2) + 1;

			if (hasLocal || hasLocal == 1) {
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
			var identity_treatments = [];

			for (var q in questions) {
				var question = questions[q];
				var treatment = all_treatments[q];
				question.treatment_type = treatment;
				question.local_type = hasLocal;
				
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
						identity_treatments.push(question.title);
					}
					else
						question.treatment = question[question.treatment_type];
				}

				if (question.treatment_type != 'treatment_i') {
					for (var i in every_treatment) {
						if (every_treatment[i] in question) {
							delete question[every_treatment[i]];
						}
					}
				}
				
			}

			if (hasLocal || hasLocal == 1) {
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

			getIdentityTreatments(identity_treatments);
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
				var questionnaire = $("header li").text().toLowerCase();
				var musicNoDemo = ['vote', 'vote_next', 'political_upbringing'];
				var policyNoDemo = ['music_play', 'music_play_years', 'music_taste', 'music_childhood'];

				// Checks for what information we are missing
				for (var i in dataWanted) {
					if ( !(dataWanted[i].name in data) && ( (questionnaire === 'policy' && policyNoDemo.indexOf(dataWanted[i].name) == -1 ) || 
						( questionnaire === 'music' && musicNoDemo.indexOf(dataWanted[i].name) == -1 ) ) ) {

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
								$(".question-list-larger:last").append("<li class = 'left inline'><input type = 'radio' name = '" + dataWanted[i].name + "' value = '"+values[j].trim()+"'><span class = 'question-text-text'>" + capitalize(values[j]) + "</span></li>");		
								if ( (j + 1) % 3 == 0)
									$(".question-list-larger:last").append("<br/>");
							}
						} else if (dataWanted[i].type.toLowerCase() == 'select') {
							var values = dataWanted[i].values.split(",");
							var location_prev = ( questionnaire === 'music' ) ? $("input[type=text]:last") : $("input[type=range]:last");

							$(location_prev).after("<div class = 'font-15 demographics-header select-header'>" + capitalize(dataWanted[i].question) + 
								": <select name = '" + dataWanted[i].name + "'></div>");
							for (var j in values) {
								$("select:last").append("<option value = '"+values[j].trim()+"'>" + capitalize(values[j]) + "</option>");		
							}
						}

						hasAllData = false;
					}
				}

				if (!hasAllData)
					$("#question-text").prepend("<br/>Now we would like to know what people like you believe. Please answer a few questions about yourself.");

				$("#question-text").append("<input type = 'button' id = 'skip-demographics' value = 'Skip' class = 'demographics-next clickable'/>" +
					"<input type = 'button' id = 'next-question' value = 'Next' class = 'demographics-next clickable' disabled/>");
				
				// Adds user information to a hidden div
				d3.select("#user")
					.selectAll("div")
					.data([data])
					.enter()
					.append("div")
					.attr("class", "hidden user-info");

				console.log(data);
			}
		});
		

	});
}


function sendFriendsDialog() {
	var userID = d3.selectAll(".user-info").data()[0].id;
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

	if (userID == '1368751615')
		var link = 'https://stark-crag-5229.herokuapp.com/login/'+loginUrl+'/'+userID+userID+'/';
	else
		var link = 'https://stark-crag-5229.herokuapp.com/login/'+loginUrl+'/'+userID+'/';

	FB.ui({
		method: 'send',
		link: link
	});
}


function makeBarGraph(data) {
	var margin = {top: 20, right: 20, bottom: 20, left: 50},
		width = 400 - margin.left - margin.right,
		height = 250 - margin.top - margin.bottom;

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
	y.domain([0, d3.max(data, function(d) { return d.value; })]);

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);
		/*.append("text")
		.attr("y", 40)
		.attr("x", "35%")
		.style("text-anchor", "start")
		.text("Year");*/

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", -50)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("Survey Participants (%)");

	svg.selectAll(".bar")
			.data(data)
		.enter()
		.append("rect")
		.attr("class", "bar")
		.attr("width", x.rangeBand() / 2)
		.attr("x", function(d) { return x(d.year); })
		.attr("y", height)
		.attr("transform", "translate("+x.rangeBand()/4+",0)")
		.attr("height", 0)
		.transition()
			.duration(750)
		.attr("y", function(d) { return y(d.value); })
		.attr("height", function(d) { console.log(y(d.value)); return height - y(d.value); });


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


function submitUserInfo() {
	var user = d3.select(".user-info").data()[0];

	getIdentityTreatments(getIdentityNames(), user);

	$.ajax({
		url: '/api/sendUser',
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(user),
		success: function(response) {
			console.log(response);
		}
	});

}


function getIdentityTreatments(questionIds, demographics) {
	questionIds = ['abortion', 'guns', 'government_surveillance', 'same_sex_marriage'];
	demographics = {age: "23",
		birthday: "05/24/1992",
		children: "0",
		email: "kaitlyn5k@gmail.com",
		first_name: "Kaitlyn",
		gender: "female",
		happiness: "72",
		id: "1368751615",
		income: "115,000",
		last_name: "Kwan",
		link: "http://www.facebook.com/1368751615",
		locale: "en_US",
		state: "NY",
		marital_status: "Single/Never married",
		name: "Kaitlyn Kwan",
		political: "Republican",
		political_upbringing: "Balanced Mix",
		race: "Asian / Pacific Islander",
		relationship_status: "Single",
		religion: "Christian",
		sexual_orientation: "Heterosexual",
		timezone: -4,
		updated_time: "2015-06-05T06:23:00+0000",
		verified: true,
		vote: "Yes",
		vote_next: "Yes",
		work: "Wage-employed"
	};

	$.ajax({
		url: "/api/getIdentityTreatment",
		method: "POST",
		dataType: "JSON",
		contentType: "application/json",
		data: JSON.stringify({questions: questionIds, demographics: demographics}),
		success: function(treatments) {
			console.log(treatments);
		}
	});
}


function getIdentityNames() {
	var ind = $('.question-selector-circle').index($('.selected'));
	var all_data = d3.selectAll(".question-selector-circle").data();
	var identity_treatments = [];

	for (var i = ind; i < all_data.length; i++) {
		identity_treatments.push(all_data[i].title);
	}

	return identity_treatments;
}















