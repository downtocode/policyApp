$(document).ready(function() {

	// FB init
	window.fbAsyncInit = function() {
  		FB.init({
    		appId      : '486648534724015',// '150997527214'
    		cookie     : true,  // enable cookies to allow the server to access 
    		xfbml      : true,  // parse social plugins on this page
    		version    : 'v2.3' // use version 2.2
  		});
  	};

	(function(d, s, id){
    	var js, fjs = d.getElementsByTagName(s)[0];
    	if (d.getElementById(id)) {return;}
	    js = d.createElement(s); js.id = id;
    	js.src = "//connect.facebook.net/en_US/sdk.js";
    	fjs.parentNode.insertBefore(js, fjs);
   	}(document, 'script', 'facebook-jssdk'));


	// If user submits consent form
	// Take them to the first question
	$(document).on("click", "#submit-consent", function() {
		var questionnaireName = d3.selectAll(".question-selector-circle").data()[0].questionnaire;
		$("header li").text(capitalizeSentence(questionnaireName));
		$("#consent-form").fadeOut(500, function() {
			$("#container").fadeIn(100);
			showQuestion(0);
		});
	});


	// If user clicks "Next" to see treatment.
	$(document).on("click", "#show-treatment", function() {
		// Get the index of the current question
   		var ind = $('.question-selector-circle').index($('.selected'));

   		showTreatment(ind);
	});


	// If user clicks on "Show Choices" for question answers
	$(document).on("click", "#show-values", function() {
		var question = d3.select(".question-selector-circle.selected").data()[0];
		var values = getValues(question.type, question.values);
		showValues(question.type, values);	
		$("#show-values").attr("id", "next-important");
		$("#next-important").prop("disabled", true);
		$("#next-important").val("Next");
	});


   	// If user clicks "Next" button to get importance value
   	$(document).on("click", "#next-important", function() {
   		addQuestionImportance();
   	});


	// If user clicks on "Next" button for next question
   	$(document).on("click", "#next-question", function() {
   		// Get the index of the current question
   		var ind = $('.question-selector-circle').index($('.selected'));
		var curr_question = d3.selectAll(".question-selector-circle").data()[ind];
		var next_question = d3.selectAll(".question-selector-circle").data()[ind + 1];

   		if ( curr_question.treatment_type.toLowerCase() == 'treatment_i' || next_question.treatment_type.toLowerCase() != "treatment_i" || $(".demographics-next").length > 0) {
   			// Remove this question as the selected one
			$('.selected').removeClass('selected');

			// Make the next question the selected one
			$($('.question-selector-circle')[ind]).next().addClass('selected');

			// Show the next question
			showQuestion(ind + 1);		
   		}
   
   	});



   	// If user selects an answer for any input
	$(document).on("change", "input", function() {

		$("input[type=button]").prop("disabled", false);

		// If this is an "Answer More" question at the end or regular first 10 questions
		if ($(".all-question").length == 0)
			var ind = $(".question-selector-circle").index($(".selected"));
		else
			var ind = $(".question-selector-circle").length + $("#questionnaires-list li").index($(".all-question-selected"));

		// Each of the user's answers is stored as an index in a hidden array variable with a "|"
		// separating the answer to the question itself and how important the question is
		var answerArr = $("#user-questions").val()[ind].split("|");

		// If this is a checkbox, we need to go through each answer bc there are multiple
		if ($(this).attr("type").toLowerCase().trim() === "checkbox") {
			var vals = "";
			$("#question-list-larger :checked").each(function() {
				vals += $(this).val() + ",";
			});
			answerArr[$(this).attr("name")] = vals.substring(0, vals.length-1);
		} else // Otherwise, this is a slider value or radio so we can add the one answer
			answerArr[$(this).attr("name")] = $(this).val();

		// Rejoin the first and second answers and set to array index
		$("#user-questions").val()[ind] = answerArr.join("|");
		
	});

	
	// If user selects one of the "More Questions"
	$(document).on("click", ".all-question", function() {
		$("#question-text").empty();
		$(".all-question-selected").removeClass("all-question-selected");
		$(this).addClass("all-question-selected");
		var data = d3.select(this).data()[0];
		showValues(data.type, data.values.split(","));
	});


	// If user submits first 10 questions
	// Asked if they want to answer more questions
	$(document).on("click", "#submit-more-page", function() {
		$(this).css("display", "none");
		$("#question-text").html("<div class = 'font-black question-header'>Thanks for answering these questions!"); // Would you like to answer more?</div>");
		$("#question-text").append("<input type = 'button' id = 'submit-questionnaire' value = 'Yes' class = 'clickable'/><input type = 'button' id = 'get-user-info' value = 'No' class = 'clickable'/>");
		//answer-more
	});


	// If user selects that they want to answer more questions
	$(document).on("click", "#answer-more", function() {
		var questionnaireName = d3.selectAll(".question-selector-circle").data()[0].questionnaire;
		getAllQuestions(questionnaireName);
		$("#questionnaires-wrapper").append("<br/><input type = 'button' id = 'get-user-info' value = 'Submit!' class = 'clickable'/>");
	});


	// When user finishes submitting all questions and no longer wants to answer more
	// Goes to page to get the user's information
	$(document).on("click", "#get-user-info", function() {
		$(this).hide();
		$("#error-msg").remove();

		getUserInfo(accessToken, function(data) {
			// Gets all of the user's information that we can get from FB
			$.ajax({
				url: '/api/getDemographics',
				dataType: 'JSON',
				success: function(dataWanted) {
					var hasAllData = true;

					$("#questionnaires").hide();
					$("#question-text").empty();
					$("#question-text").css("width", "75%");
					$("#question-text").css("float", "none");
					$(this).hide();

					// Checks for what information we are missing
					console.log(dataWanted);
					for (var i in dataWanted) {
						if (!(dataWanted[i].name in data)) {
							
							if (dataWanted[i].type.toLowerCase() == 'text')
								$("#question-text").append(capitalize(dataWanted[i].question) + "<input type = 'text' name = '" + dataWanted[i].name + "'/><br/>");
							
							else if (dataWanted[i].type.toLowerCase() == 'range') {
								$("#question-text").append("<br/>" + capitalize(dataWanted[i].question) + "<br/>"+
									"<input type = 'range' name='" + capitalize(dataWanted[i].question) + "' min='0' max='100'><ul class = 'importance-list no-list font-15'></ul>");

								var values = dataWanted[i].values.split(",");
								for (var k in values) {
									$(".importance-list:last").append("<li class = 'inline-block center'>" + values[k] + "</li>");
								}
								
							}

							hasAllData = false;
						}
					}

					if (!hasAllData)
						$("#question-text").prepend("Before you continue, please fill out the following information about yourself.<br/><br/>");

					// Asks extra questions
					$("#question-text").append("<br/>How are you feeling?<br/>"+
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

					$("#question-text").append("<br/>Please provide us with any feedback you have!<br/><textarea name = 'comments' id = 'user-comments' class = 'font-15' width = ></textarea>" +
						"<br/><input type = 'button' id = 'next-question' value = 'Next' class = 'demographics-next clickable'/>");
					
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

	});


	// If user is done answering all questions about themselves
	// Time to submit the entire questionnaire!
	$(document).on("click", "#submit-questionnaire", function() {

		// Get all the user data
		var user = d3.select(".user-info").data()[0];
		$("input[type=text], textarea, input[type=range]").each(function() {
			user[$(this).attr("name")] = $(this).val();
		});

		// Get all the user answers
		getAllAnswers(user);
	});

});


function showQuestion(num) {
	var question = d3.selectAll(".question-selector-circle").data()[num];
	$("#question-box div").html("<div id = 'question-text'></div>");

	if (question.question.length > 300) {
		var i = question.question.lastIndexOf(". ");
		var q = question.question.substr(0, i);
		$("#question-text").html("<div class = 'font-black question-header'>" + capitalize(q) + ".</div>");
	} else {
		$("#question-text").html("<div class = 'font-black question-header'>" + capitalize(question.question) + "</div>");		
	}

	/*if (question.treatment != undefined && question.treatment.length > 500 && (question.treatment_type.toLowerCase() === "treatment_s" || question.treatment_type.toLowerCase() === "treatment_i" ||
		question.treatment_type.toLowerCase() === "treatment_g" )) {
		$("#question-treatment").addClass("float-left");
		$("#question-treatment").css("width", "40%");
		$("#question-list-larger").addClass("float-right");
		$("#importance-section").addClass("float-right");
	}*/

	/*if (question.treatment == undefined || question.treatment.length == 0 || question.treatment_type.toLowerCase() === "control") {
		$("#question-answers").removeClass('hidden');
		var values = getValues(question.type, question.values);
		showValues(question.type, values);	
		$("#question-text").append("<input type='button' class='custom-button clickable' id='next-important' value='Next'/>");
	} else */

	$("#question-text").append("<div id = 'question-answers'></div>");

	if (question.treatment_type.toLowerCase() != 'control') {
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
	}
}


function showTreatment(num) {
	$("#show-treatment").remove();
	var question = d3.selectAll(".question-selector-circle").data()[num];
	//$("#question-text").append("<div class = 'horizontal-line'></div>");
	
	if (question.treatment_type.toLowerCase() != 'control') {
		if (question.treatment != undefined && question.treatment.indexOf("[") >= 0) {
			var question_arr = question.treatment.split("[");
			var reference = question_arr[1].split("]")[0];
			$("#question-answers").append("<div class = 'font-black font-16 italics bold hidden' id = 'question-treatment'>" + 
				capitalize(question_arr[0]) + "[Click <a href='/references#"+reference+"' target='_blank'>here</a>] to see reference</div>");
		} else
			$("#question-answers").append("<div class = 'font-black font-16 italics bold hidden' id = 'question-treatment'>" + capitalize(question.treatment) + "</div>");
		
		if (question.treatment_type.toLowerCase() == 'treatment_s') {
			$("#question-treatment").append("<div class = 'font-black bold' id = 'question-footnote'>" + capitalize(question.treatment_s_footnote) + "</div>")
		}

	}
	

	$("#question-text").append("<input type='button' class='custom-button clickable' id='show-values' value='Show Choices'/>");


	$("#question-treatment").slideDown('slow');
}


function getValues(type, values) {
	if (type === "checklist" || type === "radio") {
		var valuesArr = values.split(",");
	} else if (values.indexOf("-") > 0) {
		var valuesArr = values.split("-");
	} else {
		var valuesArr = values.split(",");
	}

	for (var value in valuesArr) {
		valuesArr[value] = valuesArr[value].trim();
	}

	return valuesArr;
}

function showValues(type, values) {

	if ($(".question-header").text().length > 300) {
		$("#question-answers").append("<br/>Should " + $(".question-header").text().split(" ")[0] + ": <br/>");
	}

	if (type.toLowerCase().trim() === "checkbox" || type.toLowerCase().trim() === "radio") {
		$("#question-answers").append("<ul id = 'question-list-larger' class = 'no-list font-15 hidden'></ul>");
		for (var i in values) {
			$("#question-list-larger").append("<li class = 'left'><input type = '" + type + "' name = '0' value = '"+values[i]+"'><span class = 'question-text-text'>" + capitalize(values[i]) + "</span></li>");		
		}	
	} else {
		$("#question-answers").append("<div class = 'hidden'><input type = 'range' name='0' min='0' max='100' class><ul id = 'question-list' class = 'no-list font-15'></ul></div>");

		for (value in values) {
			if (value < (values.length - 1) / 2)
				$("#question-list").append("<li class = 'inline-block center text-top border-box'>" + values[value] + "</li>");
			else if (value == (values.length - 1) / 2)
				$("#question-list").append("<li class = 'inline-block center text-top border-box'>" + values[value] + "</li>");
			else 
				$("#question-list").append("<li class = 'inline-block center text-top border-box'>" + values[value] + "</li>");
		}

		$("#question-list li").width(100 / values.length + "%");
			
	}

	$("#question-answers .hidden").slideDown('slow');
}

function addQuestionImportance() {
	$("#question-answers").children().remove();
	$("#question-answers").empty();
	
	if ($(".question-header").text().length > 300) {
		$("#question-answers").append("<div id = 'importance-section'><div class = 'font-black importance-header'>How hard was it for you to answer this question?</div></div>");
		$("#importance-section").append("<input type = 'range' name='1' min='0' max='100'><ul id = 'importance-list' class = 'no-list font-15'></ul>");
		$("#importance-list").append("<li class = 'inline-block left'>Very Hard</li>");
		$("#importance-list").append("<li class = 'inline-block right'>Not Hard</li>");	
		$("#importance-list li").width("50%");
	} else {
		$("#question-answers").append("<div id = 'importance-section'><div class = 'font-black importance-header'>How important is this topic for you?</div></div>");
		$("#importance-section").append("<input type = 'range' name='1' min='0' max='100'><ul id = 'importance-list' class = 'no-list font-15'></ul>");
		$("#importance-list").append("<li class = 'inline-block left'>Not Important</li>");
		$("#importance-list").append("<li class = 'inline-block right'>Very Important</li>");	
		$("#importance-list li").width("50%");
	}
	
	var curr_question_ind = $(".question-selector-circle").index($(".selected"));
	var curr_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind];
	var next_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind + 1];

	if (curr_question_ind == $(".question-selector-circle").length - 1) {
		$("#question-text input[type=button]").attr('id','submit-more-page').val('Submit!');
	} else if (next_question.treatment_type.toLowerCase() == "treatment_i" && next_question.treatment_type.toLowerCase() == "treatment_i") {
		$("#question-text input[type=button]").attr('id','get-user-info').val('Next');
	} else {
		$("#question-text input[type=button]").attr('id','next-question').val('Next');
	}

	$("#question-text input[type=button]").prop("disabled", true);

	if ($("#question-treatment").text().length > 500) {
		//question.treatment.length > 500 && (question.treatment_type.toLowerCase() === "treatment_s" || question.treatment_type.toLowerCase() === "treatment_i" ||
		//question.treatment_type.toLowerCase() === "treatment_g" )) {
		$("#question-treatment").hide();
	}

}

function getAllAnswers(data) {
	var answersArr = $("#user-questions").val();
	var tempArr, userAnswer;
	var userAnswers = [];
	var userID = data.id;
	$(".question-selector-circle").each(function(i) {
		var questionID = d3.select(this).data()[0]._id;
		var treatment = d3.select(this).data()[0].treatment_type;
		tempArr = answersArr[i].split("|");
		userAnswer = {user_id: userID, question_id: questionID, question: tempArr[0], importance: tempArr[1], treatment: treatment};
		userAnswers.push(userAnswer);
	});

	if ($(".all-question").length > 0) {
		$(".all-question").each(function(i) {
			var questionID = d3.select(this).data()[0]._id;
			var treatment = d3.select(this).data()[0].treatment_type;
			var ind = i + $("#question-text li").index($(this));
			tempArr = answersArr[ind].split("|");
			userAnswer = {user_id: userID, question_id: questionID, question: tempArr[0], importance: tempArr[1], treatment: treatment};
			userAnswers.push(userAnswer);
		});
	}

	inviteFriends(userID);
	submitUserInfo(data);
	submitQuestionnaire(userAnswers);
}

function submitQuestionnaire(answers) {
	$.ajax({
		url: '/api/sendAnswers',
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify({answers: answers}),
		success: function(response) {
			$("#question-text").html("Thank you!");
		}
	});
}

function submitUserInfo(data) {
	$.ajax({
		url: '/api/sendUser',
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(data),
		success: function(response) {
			console.log(response);
		}
	});
}

function getAllQuestions(questionnaire) {
	var questionIds = [];
	$(".question-selector-circle").each(function(i) {
		questionIds.push(d3.select(this).data()[0]._id);
	});

	$.ajax({
		url: "/api/getRestQuestions",
		method: "POST",
		data: JSON.stringify({questionIds: questionIds, questionnaire: questionnaire}),
		dataType: "JSON",
		contentType: "application/json",
		success: function(response) {
			displayAllQuestions(response);
		}		
	});
}

function displayAllQuestions(questions) {
	if (questions.length > 0) {
		$(".display-table").html('<div class = "display-table-cell font-18" id = "questionnaires-wrapper">' +
									'<div id = "questionnaires" class = "border-box">' +
										'<div class = "font-20 questionnaire-title">Questions</div>' +
										'<ol id = "questionnaires-list" class = "no-list">' +
										'</ol>' +
									'</div>' +
									'<div id = "question-text" class = "border-box">' +
									'</div>' +
								'</div>'); 
		var numPrev = $(".question-selector-circle").length;
		$("#question-text").width("20%");
		$("#question-box").height("100% !important");

		d3.select("#questionnaires-list").selectAll("li")
			.data(questions)
			.enter()
			.append("li")
			.attr("class", "clickable all-question")
			.attr("id", function(d, i) {
				var currNum = numPrev + i;
				return 'question-'+ currNum;
			})
			.text(function(d, i) {
				return d.question;
			});

		for (var i in questions) {
			$("#user-questions").val().push("|");
		}
	} else {
		$(".display-table").html('<div class = "display-table-cell font-18" id = "questionnaires-wrapper">' +
			'<span id = "error-msg">Sorry! There are actually no more questions to answer. Please click below to finish this questionnaire. Thanks!</span></div>'+
			'<div id = "question-text" class = "border-box">' +
			'</div>');
	}
	
	
}

function inviteFriends(userID) {
	var loginUrl = url.split("/")[2];
	var urlArray = window.location.href.split("/");

	if (urlArray.length > 4) {
		$.ajax({
			method: 'POST',
			url: '/api/addFriend',
			data: {userID: userID, friendID: urlArray[urlArray.length - 2], questionnaire: urlArray[urlArray.length - 3]}
		});
	}

	FB.ui({
		method: 'send',
		link: 'https://stark-crag-5229.herokuapp.com/login/'+loginUrl+'/'+userID'/';
	}, function(response) {
		$("#question-text").html("Thank you!");
	});
}








