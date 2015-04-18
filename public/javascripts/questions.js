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


	$(document).on("click", ".question-selector-circle", function() {
		var question = d3.select(this).data()[0];
		$('.question-selector-circle.selected').removeClass('selected');
		$(this).addClass('selected');
		$("#question-text").html("<div class = 'font-black question-header'>" + capitalize(question.question) + "</div>");
		var values = getValues(question.type, question.values);
		showValues(question.type, values);	
		addQuestionImportance();
	});

	$(document).on("change", "input", function() {
		var ind = $(".question-selector-circle").index($(".selected"));
		var blah = $("#user-questions").val()[ind].split("|");
		blah[$(this).attr("name")] = $(this).val();
		$("#user-questions").val()[ind] = blah.join("|");
	});

	$(document).on("click", "#submit-questionnaire", function() {
		var answersArr = $("#user-questions").val();
		var tempArr, userAnswer;
		var userAnswers = [];
		var userID = d3.select(".user-info").data()[0].id;
		$(".question-selector-circle").each(function(i) {
			var questionID = d3.select(this).data()[0]._id;
			tempArr = answersArr[i].split("|");
			userAnswer = {user_id: userID, question_id: questionID, question: tempArr[0], importance: tempArr[1]};
			userAnswers.push(userAnswer);
		});

		submitQuestionniare(userAnswers);
	});

});

function showQuestion(num) {
	var question = d3.selectAll(".question-selector-circle").data()[num];
	$("#question-box div").append("<div id = 'question-text'></div>");
	$("#question-text").html("<div class = 'font-black question-header'>" + capitalize(question.question) + "</div>");
	var values = getValues(question.type, question.values);
	showValues(question.type, values);	
	addQuestionImportance();
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
	if (type === "checklist" || type === "radio") {
		for (var i in values) {
			$("#question-text").append("<input type = '" + type + "' name = '0'>" + capitalize(values[i]) + "</span><br/>");
		}
	} else {
		$("#question-text").append("<span class = 'font-15'>" + values[0] + " <input type = 'range' name='0' min='" + values[0] + "' max='" + values[values.length - 1] + "'> " + values[1] + "</span><br/>");
	}
}

function addQuestionImportance() {
	$("#question-text").append("<div class = 'font-black importance-header'>How important is this topic for you?</div>");
	$("#question-text").append("<span class = 'font-15'>Not Important <input type = 'range' name='1' min='1' max='5'> Very Important</span>");
}

function submitQuestionniare(answers) {
	$.ajax({
		url: '/api/sendAnswers',
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify({answers: answers}),
		success: function(response) {	
			console.log(response);
		}
	});
}






