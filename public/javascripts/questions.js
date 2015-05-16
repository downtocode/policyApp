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

   	/*$(document).on("keydown", function(e) {
   		var key = event.which;
   		switch(key) {
   			case 37: // left
   				var ind = $('.question-selector-circle').index($('.selected'));
   				if (ind > 0) {
   					$('.selected').removeClass('selected');
	   				$($('.question-selector-circle')[ind]).prev().addClass('selected');
	   				showQuestion(ind-1);		
   				}
   				break;

   			case 39: // right
   				var ind = $('.question-selector-circle').index($('.selected'));
   				if (ind < $('.question-selector-circle').length - 1) {
   					$('.selected').removeClass('selected');
	   				$($('.question-selector-circle')[ind]).next().addClass('selected');
	   				showQuestion(ind+1);
	   			}
   				break;
   		}
   	});*/

   	$(document).on("click", "#next-question", function() {
   		var ind = $('.question-selector-circle').index($('.selected'));
		$('.selected').removeClass('selected');
		$($('.question-selector-circle')[ind]).next().addClass('selected');
		showQuestion(ind + 1);		
   	});

   	$(document).on("click", "#next-important", function() {
   		addQuestionImportance();
   	});

	$(document).on("click", ".question-selector-circle", function() {
		var question = d3.select(this).data()[0];
		$('.question-selector-circle.selected').removeClass('selected');
		$(this).addClass('selected');
		var ind = $('.question-selector-circle').index($('.selected'));
		showQuestion(ind);
	});

	$(document).on("change", "input", function() {
		if ($(".all-question").length == 0)
			var ind = $(".question-selector-circle").index($(".selected"));
		else
			var ind = $(".question-selector-circle").length + $("#questionnaires-list li").index($(".all-question-selected"));

		var blah = $("#user-questions").val()[ind].split("|");
		if ($(this).attr("type").toLowerCase().trim() === "checkbox") {
			var vals = "";
			$("#question-list-larger :checked").each(function() {
				vals += $(this).val() + ",";
			});
			blah[$(this).attr("name")] = vals.substring(0, vals.length-1);
		} else 
			blah[$(this).attr("name")] = $(this).val();
		$("#user-questions").val()[ind] = blah.join("|");
		
	});

	$(document).on("click", ".all-question", function() {
		$("#question-text").empty();
		$(".all-question-selected").removeClass("all-question-selected");
		$(this).addClass("all-question-selected");
		var data = d3.select(this).data()[0];
		showValues(data.type, data.values.split(","));
	});

	$(document).on("click", "#submit-more-page", function() {
		$(this).css("display", "none");
		$("#question-text").html("<div class = 'font-black question-header'>Thanks for answering these questions! Would you like to answer more?</div>");
		$("#question-text").append("<input type = 'button' id = 'answer-more' value = 'Yes' class = 'clickable'/><input type = 'button' id = 'get-user-info' value = 'No' class = 'clickable'/>");
	});

	$(document).on("click", "#get-user-info", function() {
		$(this).hide();
		$("#error-msg").remove();
		getUserInfo(accessToken, function(data) {
			// ask for any missing information
			// if none then submit
			var dataWanted = ['birthday','education','work','gender', 'income', 'ethnicity'];
			var hasAllData = true;
			$("#questionnaires").hide();
			$("#question-text").empty();
			$("#question-text").css("width", "75%");
			$("#question-text").css("float", "none");
			$(this).hide();
			for (var i in dataWanted) {
				if (!(dataWanted[i] in data)) {
					$("#question-text").append(capitalize(dataWanted[i]) + "<input type = 'text' name = '" + dataWanted[i] + "'/><br/>");
					hasAllData = false;
				}
			}

			if (!hasAllData)
				$("#question-text").prepend("Please fill out the following information about yourself.<br/><br/>");

			$("#question-text").append("<br/>How are you feeling?<br/>");
			$("#question-text").append("<input type = 'range' name='feeling' min='0' max='100'><ul class = 'importance-list no-list font-15'></ul>");
			$(".importance-list").append("<li class = 'inline-block center'>Very<br/>Happy</li>");
			$(".importance-list").append("<li class = 'inline-block center'>Happy</li>");
			$(".importance-list").append("<li class = 'inline-block center'>Stressed</li>");
			$(".importance-list").append("<li class = 'inline-block center'>Anxious</li>");
			$(".importance-list").append("<li class = 'inline-block center'>Depressed</li>");
			$(".importance-list li").width("20%");

			$("#question-text").append("<br/>Political Views<br/>");
			$("#question-text").append("<input type = 'range' name='political-view' min='0' max='100'><ul class = 'importance-list no-list font-15'></ul>");
			$(".importance-list:last").append("<li class = 'inline-block left'>Democrat</li>");
			$(".importance-list:last").append("<li class = 'inline-block right'>Republican</li>");
			$(".importance-list:last li").width("50%");

			$("#question-text").append("<br/>Please provide us with any feedback you have!<br/><textarea name = 'comments' id = 'user-comments' class = 'font-15' width = ></textarea>");

			$("#question-text").append("<br/><input type = 'button' id = 'submit-questionnaire' value = 'Submit!' class = 'clickable'/>");
			d3.select("#user")
				.selectAll("div")
				.data([data])
				.enter()
				.append("div")
				.attr("class", "hidden user-info");

		});
	});

	$(document).on("click", "#answer-more", function() {
		var questionnaireName = d3.selectAll(".question-selector-circle").data()[0].questionnaire;
		getAllQuestions(questionnaireName);
		$("#questionnaires-wrapper").append("<br/><input type = 'button' id = 'get-user-info' value = 'Submit!' class = 'clickable'/>");
	});

	$(document).on("click", "#submit-questionnaire", function() {
		var user = d3.select(".user-info").data()[0];
		$("input[type=text], textarea, input[type=range]").each(function() {
			user[$(this).attr("name")] = $(this).val();
		});

		getAllAnswers(user);
	});

	$(document).on("click", "#submit-consent", function() {
		var questionnaireName = d3.selectAll(".question-selector-circle").data()[0].questionnaire;
		$("header li").text(capitalizeSentence(questionnaireName));
		$("#consent-form").fadeOut(500, function() {
			$("#container").fadeIn(100);
			showQuestion(0);
		});
		
	});

	$(document).on("click", "#show-values", function() {
		var question = d3.select(".question-selector-circle.selected").data()[0];
		var values = getValues(question.type, question.values);
		showValues(question.type, values);	
		$("#show-values").attr("id", "next-important");
		$("#next-important").val("Next");
	});

});

function showQuestion(num) {
	var question = d3.selectAll(".question-selector-circle").data()[num];
	$("#question-box div").html("<div id = 'question-text'></div>");
	$("#question-text").html("<div class = 'font-black question-header'>" + capitalize(question.question) + "</div>");
	$("#question-text").append("<div class = 'horizontal-line'></div>");
	if (question.treatment_type.toLowerCase() != 'control')
		$("#question-text").append("<div class = 'font-black font-16 italics' id = 'question-treatment'>" + capitalize(question.treatment) + "</div>");

	$("#question-text").append("<div id = 'question-answers' class = 'hidden'></div>");

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
	if ($("#next-question").length > 0) {
		$("#next-question").attr('id','show-values');
		$("#next-question").val('Show Choices')
	} else {
		$("#question-text").append("<input type='button' class='custom-button clickable' id='show-values' value='Show Choices'/>");
	}
		
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
	if (type.toLowerCase().trim() === "checkbox" || type.toLowerCase().trim() === "radio") {
		$("#question-answers").append("<ul id = 'question-list-larger' class = 'no-list font-15'></ul>");
		for (var i in values) {
			$("#question-list-larger").append("<li class = 'left'><input type = '" + type + "' name = '0' value = '"+values[i]+"'><span class = 'question-text-text'>" + capitalize(values[i]) + "</span></li>");		
		}	
	} else {
		$("#question-answers").append("<div><input type = 'range' name='0' min='0' max='100' class><ul id = 'question-list' class = 'no-list font-15'></ul></div>");

		for (value in values) {
			if (value < (values.length - 1) / 2)
				$("#question-list").append("<li class = 'inline-block left'>" + values[value] + "</li>");
			else if (value == (values.length - 1) / 2)
				$("#question-list").append("<li class = 'inline-block center'>" + values[value] + "</li>");
			else 
				$("#question-list").append("<li class = 'inline-block right'>" + values[value] + "</li>");
		}

		$("#question-list li").width(100 / values.length + "%");
			
	}

	$("#question-answers").slideDown('slow');
}

function addQuestionImportance() {
	$("#question-answers").children().remove();
	
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
	

	if ($(".question-selector-circle").index($(".selected")) >= $(".question-selector-circle").length - 1) {
		$("#question-text input[type=button]").attr('id','submit-more-page').val('Submit!');
	} else {
		$("#question-text input[type=button]").attr('id','next-question').val('Next');
	}

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








