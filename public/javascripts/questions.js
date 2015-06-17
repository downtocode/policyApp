var prev_time;

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
	


	// If user clicks "Next" to see treatment.
	$(document).on("click", "#show-treatment", function() {
		// Get the index of the current question
   		var ind = $('.question-selector-circle').index($('.selected'));
   		showTreatment(ind);
	});


	// If user clicks on "Show Choices" for question answers
	$(document).on("click", "#show-values", function() {
		var ind = $('.question-selector-circle').index($('.selected'));
		var question = d3.select(".question-selector-circle.selected").data()[0];
		var values = getValues(question.type, question.values);
		showQuestionText(ind);
		showValues(question.type, values);

		$("#show-values").attr("id", "next-important");
		var button = $("#next-important");
		$("#next-important").remove();

		$("#question-text").append(button);
		$("#next-important").prop("disabled", true);
		$("#next-important").val("Next");

		if (ind == $(".question-selector-circle").length - 1)
			$("#next-important").after("<br/><input type = 'button' class = 'custom-button clickable' id = 'submit-questionnaire' value = 'Prefer Not to Answer' />")
		else 	
			$("#next-important").after("<br/><input type = 'button' class = 'custom-button clickable' id = 'skip-question' value = 'Prefer Not to Answer' />")
	});


   	// If user clicks "Next" button to get importance value
   	$(document).on("click", "#next-important", function() {
   		$("#skip-question").remove();
   		$("#submit-questionnaire").remove();
   		addQuestionImportance();
   	});


	// If user clicks on "Next" button for next question
   	$(document).on("click", "#next-question, #skip-question, #skip-demographics", function() {
   		$("#skip-question").remove();

   		// Get the index of the current question
   		var ind = $('.question-selector-circle').index($('.selected'));
		var curr_question = d3.selectAll(".question-selector-circle").data()[ind];
		var next_question = d3.selectAll(".question-selector-circle").data()[ind + 1];

   		if ( curr_question.treatment_type.toLowerCase() == 'treatment_i' || next_question.treatment_type.toLowerCase() != "treatment_i" || $(".demographics-next").length > 0) {
   			// Remove this question as the selected one
			$('.selected').removeClass('selected');

			// Make the next question the selected one
			$($('.question-selector-circle')[ind]).next().addClass('selected');

   			if ($(this).hasClass('demographics-next')) {
   				submitUserInfo();
   			} else {
   				if ($(this).attr('id') === 'skip-demographics') {
		   			$(this).remove();
		   			getNewIdentityTreatments(ind + 1);
		   			submitUserInfo();
		   		} 

				// Show the next question
				showQuestion(ind + 1);		
			}
   		} else {
   			$(this).hide();
			askDemographics();
   		}

   	});


   	// If user selects an answer for any input
	$(document).on("change", "input, select", function() {

		if ($(".demographics-next").length == 0) {
			$("input[type=button]").prop("disabled", false);

			// If this is an "Answer More" question at the end or regular first 10 questions
			if ($(".all-question").length == 0)
				var ind = $(".question-selector-circle").index($(".selected"));
			else
				var ind = $(".question-selector-circle").length + $("#questionnaires-list li").index($(".all-question-selected"));

			// ['|', '|', '|']
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
		} else {
			// Get all the user data
			var user = d3.select(".user-info").data()[0];

			user[$(this).attr("name")] = $(this).val();

			var empty_inputs = $('input').filter(function() { return this.value == ""; });

			if (empty_inputs.length == 0 && $(".radio-header").length == $("input[type=radio]:checked").length) {
				$("input[type=button]").prop("disabled", false);
			}

			d3.select("#user")
				.selectAll("div")
				.data([user])
				.enter()
				.append("div")
				.attr("class", "hidden user-info");

			/*$("input[type=text], textarea, input[type=range]").each(function() {
				user[$(this).attr("name")] = $(this).val();
			}); */
		}

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
		//$("#question-text").append("<input type = 'button' id = 'submit-questionnaire' value = 'Yes' class = 'clickable'/><input type = 'button' id = 'get-user-info' value = 'No' class = 'clickable'/>");
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
		askDemographics();
	});


	// If user is done answering all questions about themselves
	// Time to submit the entire questionnaire!
	$(document).on("click", "#submit-questionnaire", function() {
		var user = d3.select(".user-info").data()[0];
		// Get all the user answers
		getAllAnswers(user);
	});


	$(document).on("click", ".petition-link a", function() {
		var petition = $(this).parent().text();
		var link = $(this).text();
		var userID = d3.select(".user-info").data()[0].id;
		
		$.ajax({
			url: '/api/petitionClick',
			method: 'POST',
			data: {petition: petition, link: link, user_id: userID},
			success: function(response) {
				console.log(response);
			}
		})
	});


	$(document).on("click", "#invite-friends", function() {
		sendFriendsDialog();
	});

});


function setTime(d, ind) {
	if (ind > 0) {
		curr_time = d.getTime();
		time_elapsed = curr_time - prev_time;
		prev_time = curr_time;

		var all_data = d3.selectAll(".question-selector-circle").data();
		all_data[ind - 1].answer_time = time_elapsed;
		console.log(prev_time, curr_time, time_elapsed);
		d3.selectAll(".question-selector-circle").data(all_data);
	} else {
		prev_time = d.getTime();
	}
}


function setDate(d, ind) {
	var n = d.toLocaleString();
	var all_data = d3.selectAll(".question-selector-circle").data();
	all_data[ind].start_time = n;
	d3.selectAll(".question-selector-circle").data(all_data);
}


function showQuestion(num) {
	var d = new Date();
	setTime(d, num);
	setDate(d, num);

	var question = d3.selectAll(".question-selector-circle").data()[num];
	$("#question-box div").html("<div id = 'question-text'></div>");
	$("#question-text").empty();


	if (question.title == 'moral_dilemma') {
		var i = question.question.lastIndexOf(". ");
		var q = question.question.substr(0, i);
		$("#question-text").html("<div class = 'font-black question-header'>" + capitalize(q) + ".</div>"); 
	}

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
}

function showTreatment(num) {
	var question = d3.selectAll(".question-selector-circle").data()[num];

	$("#question-text").prepend("<div id = 'question-title'>" + capitalizeSentence(question.title) +"</div>");
	
	if (question.treatment_type.toLowerCase() != 'control' && question.treatment != undefined) {
		if (question.treatment.indexOf("|") >= 0 && question.treatment_type.toLowerCase() != "treatment_s" && question.title != "moral_dilemma") {
			var arr = question.treatment.split('|');
			$("#question-text").append("<div class = 'font-black font-18 bold' id = 'question-treatment'>" + 
				capitalize(arr[0]) + "<br/></div>");

			var data = [];
			

			data.push({"year": arr[1].split(":")[0].trim(), "value": arr[1].split(":")[1].trim()});
			data.push({"year": arr[2].split(":")[0].trim(), "value": arr[2].split(":")[1].trim()});

			makeBarGraph(data);
			$("#question-treatment").append("<div id = 'question-treatment-reference' class = 'font-15 italics bold'>[Click <a href='/references#"+question["ref_num_g"]+"' target='_blank'>here</a> to see reference]</div></div>");

		} else {
			if (question.treatment_type.toLowerCase() == "treatment_g")
				$("#question-treatment").append("<div id = 'question-treatment-reference' class = 'font-15 italics bold'>[Click <a href='/references#"+question["ref_num_g"]+"' target='_blank'>here</a> to see reference]</div></div>");

			$("#question-text").append("<div class = 'font-black font-15 italics bold' id = 'question-treatment'>" + capitalize(question.treatment) + "</div>");
		}

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
}


function showQuestionText(num) {
	var question = d3.selectAll(".question-selector-circle").data()[num];
	if (question.title != 'moral_dilemma') {
		$("#question-text").append("<div class = 'font-black question-header'>" + capitalize(question.question) + "</div>");		
	}

	$("#question-text").append("<div id = 'question-answers'></div>");
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
		$("#question-answers").append("<div class = 'hidden'><ul id = 'question-list-larger' class = 'no-list font-15'></ul></div>");
		for (var i in values) {
			$("#question-list-larger").append("<li class = 'left'><input type = '" + type + "' name = '0' value = '"+values[i]+"'><span class = 'question-text-text'>" + capitalize(values[i]) + "</span></li>");		
		}	
	} else {
		$("#question-answers").append("<div class = 'hidden'><input type = 'range' name='0' min='0' max='100' class><ul id = 'question-list' class = 'no-list font-15'></ul></div>");

		if (values.length == 2) {
			$("#question-list").append("<li class = 'inline-block left text-top border-box'>" + values[0] + "</li>");
			$("#question-list").append("<li class = 'inline-block right text-top border-box'>" + values[1] + "</li>");	
		} else {
			for (value in values) {
				$("#question-list").append("<li class = 'inline-block center text-top border-box'>" + values[value] + "</li>");
			}

		}

		$("#question-list li").width( (100 - 5 * values.length * 2) / values.length + "%");
			
	}

	$("#question-answers .hidden").slideDown('slow');
}

function addQuestionImportance() {
	$("#question-treatment").remove();
	$("#question-answers").children().remove();
	$("#question-answers").empty();
	$(".question-header").remove();
		
	var curr_question_ind = $(".question-selector-circle").index($(".selected"));
	var curr_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind];
	var next_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind + 1];

	if (curr_question.title == 'moral_dilemma') {
		$("#question-answers").append("<div id = 'importance-section'><div class = 'font-black importance-header'>How hard was it for you to answer this question?</div></div>");
		$("#importance-section").append("<input type = 'range' name='1' min='0' max='100'><ul id = 'importance-list' class = 'no-list font-15'></ul>");
		$("#importance-list").append("<li class = 'inline-block left'>Very Hard</li>" + 
			"<li class = 'inline-block right'>Not Hard</li>");	
		$("#importance-list li").width("50%");
	} else {
		$("#question-answers").append("<div id = 'importance-section'><div class = 'font-black importance-header'>How important is this topic for you?</div></div>");
		$("#importance-section").append("<input type = 'range' name='1' min='0' max='100'><ul id = 'importance-list' class = 'no-list font-15'></ul>");
		$("#importance-list").append("<li class = 'inline-block left'>Not Important</li>" +
			"<li class = 'inline-block right'>Very Important</li>");	
		$("#importance-list li").width("50%");
	}

	if (curr_question_ind == $(".question-selector-circle").length - 1) {
		$("#question-text input[type=button]").attr('id','submit-questionnaire').val('Submit!');
	} else if (curr_question.treatment_type.toLowerCase() != "treatment_i" && next_question.treatment_type.toLowerCase() == "treatment_i") {
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

function getAllAnswers() {
	var answersArr = $("#user-questions").val();
	var tempArr, userAnswer;
	var userAnswers = [];
	var userID = d3.selectAll(".user-info").data()[0].id;
	var petitions = {};
	var end_date = new Date();
	var end_time = end_date.getTime();

	$(".question-selector-circle").each(function(i) {
		var question = d3.select(this).data()[0];
		var questionID = question._id;
		var treatment = question.treatment_type;
		var localType = question.local_type;
		tempArr = answersArr[i].split("|");
		userAnswer = {user_id: userID, question_id: questionID, question: tempArr[0], importance: tempArr[1], treatment: treatment, treatment_l_type: localType, start_time: question.start_time, answer_time: question.answer_time};
		userAnswers.push(userAnswer);

		if (question.type.toLowerCase() == 'range') {
			if (tempArr[0] <= 50)
				petitions[question.title] = question.petitions_1;
			else
				petitions[question.title] = question.petitions_2;
		}
	});

	if ($(".all-question").length > 0) {
		$(".all-question").each(function(i) {
			var question = d3.select(this).data()[0];
			var questionID = question._id;
			var treatment = question.treatment_type;
			var ind = i + $("#question-text li").index($(this));
			tempArr = answersArr[ind].split("|");
			userAnswer = {user_id: userID, question_id: questionID, question: tempArr[0], importance: tempArr[1], treatment: treatment};
			userAnswers.push(userAnswer);

			if (question.type.toLowerCase() == 'range') {
				if (tempArr[0] <= 50)
					petitions[question.title] = question.petitions_1;
				else
					petitions[question.title] = question.petitions_2;
			}

		});
	}

	submitQuestionnaire(userAnswers, petitions);

}

function submitQuestionnaire(answers, petitions) {
	$.ajax({
		url: '/api/sendAnswers',
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify({answers: answers}),
		success: function(response) {
			$("#question-text").html("Thank you! Based on your answers, we invite you to sign the petitions below: " +
				"<div id = 'petitions' class = 'left font-16'></div>");

			for (var p in petitions) {
				if (petitions[p].length > 0) {
					$("#petitions").append("<div class = 'petition-link'>" + capitalizeSentence(p) + 
						": <a href = '" + petitions[p] + "' id = 'petition-" + p + "' target = _blank>" + petitions[p] + "</a></div>");
				}
			}

			$("#petitions").after("<br/>We also encourage you to invite your friends to participate in this study as well!" + 
				"<br/><input type ='button' id = 'invite-friends' class = 'custom-button clickable' value = 'Finish'/>")
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


function getQuestion() {
	var ind = $(".question-selector-circle").index(".question-selector-circle.selected");
	return d3.selectAll(".question-selector-circle").data()[ind];
}


function getQuestion(num) {
	return d3.selectAll(".question-selector-circle").data()[num];
}

/* var question_str_arr = question.treatment.split("%");
			var question_num_arr = [];
			var question_year_arr = [];
			var years = {}
			var data = [];

			for (var i = 0; i < question_str_arr.length - 1; i++) {
				question_num_arr.push(question_str_arr[i].substr(question_str_arr[i].length - 3, question_str_arr[i].length - 1).replace(/,/g, " ").trim());
				
				if (question_str_arr[i].indexOf("19") >= 0) {
					question_year_arr.push(question_str_arr[i].substr(question_str_arr[i].indexOf("19"), question_str_arr[i].indexOf("19") + 2).replace(/,/g, " ").trim());				
				}
			
				if (question_str_arr[i].indexOf("20") >= 0) {
					question_year_arr.push(question_str_arr[i].substr(question_str_arr[i].indexOf("20"), question_str_arr[i].indexOf("20") + 2).split(",")[0].trim());
				}
			
			}

			for (var j in question_year_arr) {
				//var curr_year = question_year_arr[j];
				data.push({"year": question_year_arr[j], "value": question_num_arr[j]});
				/*console.log(curr_year);
				if (curr_year in years) {
					years[curr_year].push(question_num_arr[j]);
				} else {
					years[curr_year] = [question_num_arr[j]];
				}
			}

			/*console.log(years);

			for (var k in years) {
				var temp_dict = {};
				temp_dict["year"] = k
				temp_dict["value"] = 
				
				/*for (var l in years[k])
					temp_dict["value_" + l] = years[k][l];

				data.push(temp_dict);
			}*/


