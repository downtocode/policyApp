//////////////////////////////////////////////////////////////
// This file is for functions that are unique to the  		//
// policy questionnaire.									//
//////////////////////////////////////////////////////////////


var real_appId = app.app_id;

$(document).ready(function() {

	// FB init
	window.fbAsyncInit = function() {
		FB.init({
			appId: real_appId, // '150997527214' '486648534724015'
			cookie: true, // enable cookies to allow the server to access 
			xfbml: true, // parse social plugins on this page
			version: 'v2.3' // use version 2.2
		});
	};


	(function(d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) {
			return;
		}
		js = d.createElement(s);
		js.id = id;
		js.src = "//connect.facebook.net/en_US/sdk.js";
		fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));


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

		if (ind == $(".question-selector-circle").length - 1) {
			if (question.treatment_type.toLowerCase() == 'treatment_l') {
				$("#next-important").after("<br/><input type = 'button' class = 'custom-button clickable' id = 'get-user-info' value = 'Prefer Not to Answer' />");
			} 
			else $("#next-important").after("<br/><input type = 'button' class = 'custom-button clickable' id = 'submit-questionnaire' value = 'Prefer Not to Answer' />");
			// else $("#next-important").after("<br/><input type = 'button' class = 'custom-button clickable' id = 'get-user-info' value = 'Prefer Not to Answer' />");
		} 
		else
			$("#next-important").after("<br/><input type = 'button' class = 'custom-button clickable' id = 'skip-question' value = 'Prefer Not to Answer' />");
	});


	// If user clicks "Next" button to get importance value
	$(document).on("click", "#next-important", function() {
		$("#skip-question").remove();
		$("#submit-questionnaire").remove();
		addQuestionImportance();
	});

	// If user clicks "Next" button to get the frequency question
	$(document).on("click", "#next-frequency", function() {
		$("skip-question").remove();
		$("#submit-questionnaire").remove();
		addHowOften();
	});

	// When user clicks "Next" button after frequency question
	$(document).on("click", "#petition-choice", function() {
		$("skip-question").remove();
		$("#submit-questionnaire").remove();
		askPetition();
	});



	// If user clicks on "Next" button for next question
	$(document).on("click", "#next-question, #skip-question, #skip-demographics", function() {
		$("#skip-question").remove();
		// Get the index of the current question
		var ind = $('.question-selector-circle').index($('.selected'));
		var curr_question = d3.selectAll(".question-selector-circle").data()[ind];
		var next_question = d3.selectAll(".question-selector-circle").data()[ind + 1];
		console.log(curr_question.treatment_type.toLowerCase(), 'treatment_l', ind + 1, $('.question-selector-circle').length - 1);

		// if we are in identity questions, or the next question is not identity i.e. demographics is done, or we just got out of demographics hence 
		// (".demographics-next") is still set and > 0
		if (curr_question.treatment_type.toLowerCase() == 'treatment_i' || next_question.treatment_type.toLowerCase() != "treatment_i" || $(".demographics-next").length > 0) {
			// Remove this question as the selected one
			$('.selected').removeClass('selected');
			// Make the next question the selected one
			$($('.question-selector-circle')[ind]).next().addClass('selected');

			if (curr_question.treatment_type.toLowerCase() == 'treatment_l' && ind == $('.question-selector-circle').length - 1) {
				$(this).hide();
				askDemographics(); // ask demographics at the end of local treatment to get user info
			} else if ($(this).hasClass('demographics-next')) {
				submitUserInfo();
			} else {
				if ($(this).attr('id') === 'skip-demographics') {
					$(this).remove();
					submitUserInfo(1);
					getNewIdentityTreatments(ind + 1);
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
				answerArr[$(this).attr("name")] = vals.substring(0, vals.length - 1);
			} else // Otherwise, this is a slider value or radio so we can add the one answer
				answerArr[$(this).attr("name")] = $(this).val();

			// Rejoin the first and second answers and set to array index
			$("#user-questions").val()[ind] = answerArr.join("|");
		} else {
			// Get all the user data
			var user = d3.select(".user-info").data()[0];

			user[$(this).attr("name")] = $(this).val();

			var empty_inputs = $('input[type=radio]').filter(function() {
				return this.value == "";
			});

			if (empty_inputs.length == 0 && $(".radio-header").length == $("input[type=radio]:checked").length) {
				$("input[type=button]").prop("disabled", false);
			}

		d3.select("#user")
			.selectAll("div")
			.data([user])
			.enter()
			.append("div")
			.attr("class", "hidden user-info");
		}
	});

	/*$("input[type=text], textarea, input[type=range]").each(function() {
		user[$(this).attr("name")] = $(this).val();
	}); */


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
		if (d3.select(".user-info").data()[0] == undefined){
			askDemographics();
		}
		var user = d3.select(".user-info").data()[0];
		// Get all the user answers
		getAllAnswers(user);
	});

	// If user clicks on the petition, records which one they clicked on
	$(document).on("click", ".petition-link a", function() {
		var petition = $(this).attr('id');
		var link = $(this).text();
		var userID = d3.select(".user-info").data()[0].id;

		$.ajax({
			url: '/api/petitionClick',
			method: 'POST',
			data: {
				petition: petition,
				link: link,
				user_id: userID
			},
			success: function(response) {
				console.log(response);
			}
		});
	});


	// If user clicks "Finish" button, shows invite dialog box
	$(document).on("click", "#invite-friends", function() {
		sendFriendsDialog();
	});

});

// Shows question based on index number
function showQuestion(num) {
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
}

// Shows treatment appropriately
function showTreatment(num) {
	// Gets the corresponding question based on the index provided in variable num
	var question = d3.selectAll(".question-selector-circle").data()[num];

	// Displays the question's title (ie. Moral Dilemma, Same-Sex Marriage)
	$("#question-text").prepend("<div id = 'question-title'>" + capitalizeSentence(question.title) + "</div>");

	// If there is a treatment (ie. not control)
	if (question.treatment_type.toLowerCase() != 'control' && question.treatment != undefined) {
		// If we want to create a graph for the treatment (ie. global treatment)
		if (question.treatment.indexOf("|") >= 0 && question.treatment_type.toLowerCase() != "treatment_s" && question.title != "moral_dilemma") {
			var arr = question.treatment.split('|');
			$("#question-text").append("<div class = 'font-black font-18 bold' id = 'question-treatment'>" +
				capitalize(arr[0]) + "<br/></div>");

			var data = [];

			// Set up data in format that is understandable to d3 library
			data.push({
				"year": arr[1].split(":")[0].trim(),
				"value": arr[1].split(":")[1].trim()
			});
			data.push({
				"year": arr[2].split(":")[0].trim(),
				"value": arr[2].split(":")[1].trim()
			});

			makeBarGraph(data);
			$("#question-treatment").append("<div id = 'question-treatment-reference' class = 'font-15 italics bold'>[Click <a href='/references#" + question["ref_num_g"] + "' target='_blank'>here</a> to see reference]</div></div>");

		} else {
			// Otherwise just show the treatment as is displayed
			if (question.treatment_type.toLowerCase() == "treatment_g")
				$("#question-treatment").append("<div id = 'question-treatment-reference' class = 'font-15 italics bold'>[Click <a href='/references#" + question["ref_num_g"] + "' target='_blank'>here</a> to see reference]</div></div>");
			else if (question.treatment_type.toLowerCase() == "treatment_i")
				$("#question-treatment").append("<div id = 'question-treatment-reference' class = 'font-15 italics bold'>[Click <a href='" + question["reference_identity"] + "' target='_blank'>here</a> to see reference]</div></div>");

			$("#question-text").append("<div class = 'font-black font-15 italics bold' id = 'question-treatment'>" + capitalize(question.treatment) + "</div>");
		}

		// If a status treatment, then add on the reference link
		if (question.treatment_type.toLowerCase() == 'treatment_s') {
			if (question.reference_status != undefined) {
				var reference = question["ref_num_" + question.treatment_type.split("_")[1]];
				$("#question-treatment").append("<div id = 'question-treatment-reference' class = 'font-15 italics bold'>[Click <a href='/references#" + reference + "' target='_blank'>here</a> to see reference]</div></div>");
			}

			$("#question-treatment").append("<div class = 'font-black bold' id = 'question-footnote'>" + capitalize(question.treatment_s_footnote) + "</div>");
		}

	}


	$("#question-text").append("<input type='button' class='custom-button clickable' id='show-values' value='Next'/>");

	//$("#question-treatment").slideDown('slow');
}

// Displays actual question text
function showQuestionText(num) {
	var question = d3.selectAll(".question-selector-circle").data()[num];
	if (question.title != 'moral_dilemma') {
		$("#question-text").append("<div class = 'font-black question-header'>" + capitalize(question.question) + "</div>");
	}

	$("#question-text").append("<div id = 'question-answers'></div>");
}

// Spearates question choices into array so they are usable
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

// Shows question's choices with appropriate input type (ie. slider, radio buttons)
function showValues(type, values) {
	if ($(".question-header").text().length > 300) {
		$("#question-answers").append("<br/>Should " + $(".question-header").text().split(" ")[0] + ": <br/>");
	}

	if (type.toLowerCase().trim() === "checkbox" || type.toLowerCase().trim() === "radio") {
		$("#question-answers").append("<div class = 'hidden'><ul id = 'question-list-larger' class = 'no-list font-15'></ul></div>");
		for (var i in values) {
			$("#question-list-larger").append("<li class = 'left'><input type = '" + type + "' name = '0' value = '" + values[i] + "'><span class = 'question-text-text'>" + capitalize(values[i]) + "</span></li>");
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

		$("#question-list li").width((100 - 5 * values.length * 2) / values.length + "%");

	}

	$("#question-answers .hidden").slideDown('slow');
}

// Adds "Would you be willing to sign a petition on [treatment_title]?"
function askPetition() {
	$("#question-answers").children().remove();
	$("#question-answers").empty();
	$(".question-header").remove();

	var curr_question_ind = $(".question-selector-circle").index($(".selected"));
	var curr_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind];
	var next_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind + 1];
	var answersArr = $("#user-questions").val();
	var curr_answer = answersArr[curr_question_ind].split("|")[0];
	var title = curr_question.title;
	var question = "Are you willing to sign a petition ";
	var phrasing = "";
	if (curr_answer <= 50){
		// do not support

		if (title === "gun_control"){
			phrasing = "to protect The Second Amendment?";
		}
		else if (title === "global_warming"){
			phrasing = "against legislation limiting greenhouse gas emissions?";
		}
		else if (title === "abortion"){
			phrasing = "against the legalization of abortion?";
		}
		else if (title === "same-sex_marriage"){
			phrasing = "against the legalization of same-sex marriages?";
		}
		else if (title === "online_privacy"){
			phrasing = "to increase the protection of personal online data?";
		}
		else if (title === "vaccination"){
			phrasing = "against mandating children vaccinations?";
		}
		else if (title === "government_surveillance"){
			phrasing = "against NSA spying programs?";
		}
		else if (title === "marijuana_legalization"){
			phrasing = "against the legalization of marijuana?";
		}
		else if (title === "stem_cell_research"){
			phrasing = "to ban stem cell research?";
		}
	}
	else{
		if (title === "gun_control"){
			phrasing = "in support of increased gun control?";
		}
		else if (title === "global_warming"){
			phrasing = "in support of legislation limiting greenhouse gas emissions?";
		}
		else if (title === "abortion"){
			phrasing = "in support of the legalization of abortion?";
		}
		else if (title === "same-sex_marriage"){
			phrasing = "in support of the legalization of same-sex marriages?";
		}
		else if (title === "online_privacy"){
			phrasing = "against excessive protection of personal online data?";
		}
		else if (title === "vaccination"){
			phrasing = "in support of mandating children vaccinations?";
		}
		else if (title === "government_surveillance"){
			phrasing = "in support of NSA spying programs?";
		}
		else if (title === "marijuana_legalization"){
			phrasing = "in support of the legalization of marijuana?";
		}
		else if (title === "stem_cell_research"){
			phrasing = "for Government to allow stem cell research?";
		}
	}
	question = question + phrasing;
	
	$("#question-answers").append("<div id = 'petition-section'><div class = 'font-black importance-header'>" + question + "</div></div>");

	$("#question-answers").append("<div class = 'hidden'><ul id = 'question-list-larger' class = 'no-list font-15'></ul></div>");

	$("#question-list-larger").append("<li class = 'left'><input type = 'radio' name = '3' value = 'Yes'><span class = 'question-text-text'>Yes</span></li>");
	$("#question-list-larger").append("<li class = 'left'><input type = 'radio' name = '3' value = 'No'><span class = 'question-text-text'>No</span></li>");

	$("#petition-section").append("<div class = 'font-black bold' id = 'question-footnote'>[All petitions will be forwarded to <a href='http://www.petition2congress.com' target='_blank'>petition2congress.com</a>]</div>");

	if (curr_question_ind == $(".question-selector-circle").length - 1) { // if last question
		// if current question is local treatment add a Next button?
		/*if (curr_question.treatment_type.toLowerCase()=='treatment_l'  ) {
			$("#question-text input[type=button]").attr('id','get-user-info').val('Next');
		}*/
		// if not local treatment just add a Submit button 
		if (curr_question.treatment_type.toLowerCase()=='treatment_l'  ) {
			$("#question-text input[type=button]").attr('id','get-user-info').val('Next');
		} 
		else $("#question-text input[type=button]").attr('id','submit-questionnaire').val('Submit!');
		//else $("#question-text input[type=button]").attr('id','get-user-info').val('Submit!');
	}
	// if current question is not identity treatment but next question is
	else if (curr_question.treatment_type.toLowerCase() != "treatment_i" && next_question.treatment_type.toLowerCase() == "treatment_i") {
		// next button used to get user info
		$("#question-text input[type=button]").attr('id', 'get-user-info').val('Next');
	} 
	else { // if not last question and next question not identity treatment
		$("#question-text input[type=button]").attr('id', 'next-question').val('Next');
	}

	$("#question-answers .hidden").slideDown('slow');
	// Disables button until user answers question
	$("#question-text input[type=button]").prop("disabled", true);


$("#question-treatment").hide();

}


// Adds "How much have you thought about this topic in the past? after each importance question"
function addHowOften() {
	$("#question-treatment").remove();
	$("#question-answers").children().remove();
	$("#question-answers").empty();
	$(".question-header").remove();

	var curr_question_ind = $(".question-selector-circle").index($(".selected"));
	var curr_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind];
	var next_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind + 1];

	$("#question-answers").append("<div id = 'frequency-section'><div class = 'font-black importance-header'>How much have you thought about this topic in the past?</div></div>");
	$("#frequency-section").append("<input type = 'range' name='2' min='0' max='100'><ul id = 'frequency-list' class = 'no-list font-15'></ul>");
	$("#frequency-list").append("<li class = 'inline-block left text-top border-box'>Never</li>" + "<li class = 'inline-block right text-top border-box'>A lot</li>");
	$("#frequency-list li").width("50%");

	if (curr_question.title === "moral_dilemma") { // Skip petition question if question is moral dilemma
		if (curr_question_ind == $(".question-selector-circle").length - 1) {
			if (curr_question.treatment_type.toLowerCase()=='treatment_l'  ) {
					$("#question-text input[type=button]").attr('id','get-user-info').val('Next');
			} 
			else $("#question-text input[type=button]").attr('id','submit-questionnaire').val('Submit!');
			// else $("#question-text input[type=button]").attr('id','get-user-info').val('Submit!');
		}
		else if (curr_question.treatment_type.toLowerCase() != "treatment_i" && next_question.treatment_type.toLowerCase() == "treatment_i") {
			// next button used to get user info
			$("#question-text input[type=button]").attr('id', 'get-user-info').val('Next');
		} 
		else { // if not last question and next question not identity treatment
			$("#question-text input[type=button]").attr('id', 'next-question').val('Next');
		}
	} 
	else { 
		$("#question-text input[type=button]").attr('id', 'petition-choice').val('Next');
	}	
	// Disables button until user answers question
	$("#question-text input[type=button]").prop("disabled", true);
	$("#question-treatment").hide();
	
}

// Adds "How important is this to you" or "How hard was it for you to answer" (for moral dilemma)
function addQuestionImportance() {
	$("#question-treatment").remove();
	$("#question-answers").children().remove();
	$("#question-answers").empty();
	$(".question-header").remove();

	var curr_question_ind = $(".question-selector-circle").index($(".selected"));
	var curr_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind];
	var next_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind + 1];

	// Inserts correct phrasing based on title
	if (curr_question.title == 'moral_dilemma') {
		$("#question-answers").append("<div id = 'importance-section'><div class = 'font-black importance-header'>How hard was it for you to answer this question?</div></div>");
		$("#importance-section").append("<input type = 'range' name='1' min='0' max='100'><ul id = 'importance-list' class = 'no-list font-15'></ul>");
		$("#importance-list").append("<li class = 'inline-block left'>Not very hard</li>" + "<li class = 'inline-block right'>Very hard</li>");
		$("#importance-list li").width("50%");
	} else {
		$("#question-answers").append("<div id = 'importance-section'><div class = 'font-black importance-header'>How important is this topic for you?</div></div>");
		$("#importance-section").append("<input type = 'range' name='1' min='0' max='100'><ul id = 'importance-list' class = 'no-list font-15'></ul>");
		$("#importance-list").append("<li class = 'inline-block left'>Not Important</li>" +
			"<li class = 'inline-block right'>Very Important</li>");
		$("#importance-list li").width("50%");
	}

	$("#question-text input[type=button]").attr('id', 'next-frequency').val('Next');

	// Adds either "Next" button or "Submit" if it is the last question
	/*if (curr_question_ind == $(".question-selector-circle").length - 1) {
		if (curr_question.treatment_type.toLowerCase()=='treatment_l'  ) {
			$("#question-text input[type=button]").attr('id','get-user-info').val('Next');
		} 
		else $("#question-text input[type=button]").attr('id','submit-questionnaire').val('Submit!');
	} 
	else if (curr_question.treatment_type.toLowerCase() != "treatment_i" && next_question.treatment_type.toLowerCase() == "treatment_i") {
		$("#question-text input[type=button]").attr('id','get-user-info').val('Next');
	} 
	else {
		$("#question-text input[type=button]").attr('id','next-question').val('Next');
	}*/

	// Disables button until user answers question
	$("#question-text input[type=button]").prop("disabled", true);

	// if ($("#question-treatment").text().length > 500) {
	//question.treatment.length > 500 && (question.treatment_type.toLowerCase() === "treatment_s" || question.treatment_type.toLowerCase() === "treatment_i" ||
	//question.treatment_type.toLowerCase() === "treatment_g" )) {
	$("#question-treatment").hide();
	// }

}

// used to pass an identity value wherever it is created
// id is the question id, val is the identity value
function shareIdentityValue(id, val, support){
	// var curr_question = d3.selectAll(".question-selector-circle").data()[id];
	// curr_question.identity_value = val;
	// $("#user-questions").val()[id] = "" + val;
	$("#user-questions-ii").val()[id] = "" + val + "|" + support;
}


// Gets all user answers and submits to database
function getAllAnswers() {
	var answersArr = $("#user-questions").val();
	var tempArr, userAnswer;
	var userAnswers = [];
	var userID = d3.selectAll(".user-info").data()[0].id; // data()[0] is sometimes undefined resulting in an uncaught error here
	var petitions = {};
	var end_date = new Date();
	var end_time = end_date.getTime();
	var answerDict = $("#user-questions-ii").val();

	// Gets all main policy questions
	$(".question-selector-circle").each(function(i) {
		var question = d3.select(this).data()[0];
		var questionID = question._id;
		var treatment = question.treatment_type;
		var localType = question.local_type;
		tempArr = answersArr[i].split("|"); // answersArr now has four elements after this split. Third is 'frequency of thought' value. Fourth is willingess to sign petition
		var identity_value = answerDict[i].split("|")[0];
		var identity_support = answerDict[i].split("|")[1];
		


		// Creates dictionary for each answer with necessary information
		// UPDATE: Added frequency response after importance
		userAnswer = {
			user_id: userID,
			question_id: questionID,
			question: tempArr[0],
			importance: tempArr[1],
			frequency: tempArr[2],
			will_sign_petition: tempArr[3],
			identity_value: identity_value,
			identity_support: identity_support,
			treatment: treatment,
			treatment_l_type: localType,
			treatment_l_value: question.treatment_l_value,
			start_time: question.start_time,
			answer_time: question.answer_time
		};
		userAnswers.push(userAnswer);

		// Gets appropriate petition to display based on user's answer
		if (question.type.toLowerCase() == 'range') {
			if (tempArr[0] <= 50)
				petitions[question.title + "|" + question._id] = question.petitions_1;
			else
				petitions[question.title + "|" + question._id] = question.petitions_2;
		}
	});

	// If any additional questions, get answers and peitions for those as well
	if ($(".all-question").length > 0) {
		$(".all-question").each(function(i) {
			var question = d3.select(this).data()[0];
			var questionID = question._id;
			var treatment = question.treatment_type;
			var ind = i + $("#question-text li").index($(this));
			tempArr = answersArr[ind].split("|");
			userAnswer = {
				user_id: userID,
				question_id: questionID,
				question: tempArr[0],
				importance: tempArr[1],
				frequency: tempArr[2],
				will_sign_petition: tempArr[3],
				treatment: treatment
			};
			userAnswers.push(userAnswer);

			if (question.type.toLowerCase() == 'range') {
				if (tempArr[0] <= 50)
					petitions[question.title + "|" + question._id] = question.petitions_1;
				else
					petitions[question.title + "|" + question._id] = question.petitions_2;
			}

		});
	}

	submitQuestionnaire(userAnswers, petitions);

}

// Submits answers to database and displays petitions collected in previous function
function submitQuestionnaire(answers, petitions) {
	$.ajax({
		url: '/api/sendAnswers',
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify({
			answers: answers
		}),
		success: function(response) {
			$("#question-text").html("Thank you for participating in this study!" +	"<div id = 'petitions' class = 'left font-16'></div>");

/*			console.log(petitions);
			for (var p in petitions) {
				if (petitions[p].length > 0) {
					$("#petitions").append("<div class = 'petition-link'>" + capitalizeSentence(p.split("|")[0]) +
						": <a href = '" + petitions[p] + "' id = '" + p.split("|")[1] + "' target = _blank>" + petitions[p] + "</a></div>");
				}
			}*/

			// After petitions, displays button to invite friends to do questionnaire
			$("#petitions").after("<br/>We encourage you to invite your friends to participate in this study as well!" +
				"<br/><input type ='button' id = 'invite-friends' class = 'custom-button clickable' value = 'Finish'/>");

			var userID = d3.selectAll(".user-info").data()[0].id;
			// Change text to say Microworkers.com instead of Amazon Mechanical Turk
			$("#invite-friends").after("<br/>Your Microworkers value is: " + userID);
		}
	});
}

// Get any additional questions from backend
function getAllQuestions(questionnaire) {
	var questionIds = [];
	$(".question-selector-circle").each(function(i) {
		questionIds.push(d3.select(this).data()[0]._id);
	});

	$.ajax({
		url: "/api/getRestQuestions",
		method: "POST",
		data: JSON.stringify({
			questionIds: questionIds,
			questionnaire: questionnaire
		}),
		dataType: "JSON",
		contentType: "application/json",
		success: function(response) {
			displayAllQuestions(response);
		}
	});
}

// Displays all additional questions from database into list in left column on screen
function displayAllQuestions(questions) {
	// Checks to make sure there are actually additional questions
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
				return 'question-' + currNum;
			})
			.text(function(d, i) {
				return d.question;
			});

		for (var i in questions) {
			$("#user-questions").val().push("|");
		}
	} else { // If no additional questions, then just display "Finish" button
		$(".display-table").html('<div class = "display-table-cell font-18" id = "questionnaires-wrapper">' +
			'<span id = "error-msg">Sorry! There are actually no more questions to answer. Please click below to finish this questionnaire. Thanks!</span></div>' +
			'<div id = "question-text" class = "border-box">' +
			'</div>');
	}
}

// Helper function to get current question without index number
function getQuestion() {
	var ind = $(".question-selector-circle").index(".question-selector-circle.selected");
	return d3.selectAll(".question-selector-circle").data()[ind];
}

// Helper function to get current question with index number
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