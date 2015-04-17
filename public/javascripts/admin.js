$(document).ready(function() {

	getQuestionnaires();

	$(document).on("click", "#admin-login", function() {
		checkAdminLogin();
	});

	$(document).on("keypress", function(e) {
		var key = e.keyCode || e.which;
		if(key == 13) {
			checkAdminLogin();
		}
	});

	$(document).on("click", "#questionnaires-list li", function() {
		getQuestions($(this).text());
	});

	$(document).on("click", "#back-questionnaire", function() {
		window.location.href = '/adminHome';
	});

	$(document).on("click", "#add-button", function() {
		var numQuestions = $("#questions-form .question").length + 1;

		$("#questions-form").append('<div class = "question">' +
				'<label for = "question-'+numQuestions+'">Q'+numQuestions+' </label><textarea type = "text" name = "question-'+numQuestions+' " placeholder = "Question"></textarea>' +
				'<select>' +
					'<option>--Type--</option>' +
					'<option>Slider</option>' +
					'<option>Radio</option>' +
					'<option>Checklist</option>' +
				'</select>' +
			'<textarea name = "choices-1" class = "choices" placeholder = "Range, or Values by Commas"></textarea>' +
			'</div><br/>');

		var questionsFormHeight = document.getElementById("questions-form").scrollHeight;

		/*$("#questions-form").animate({ 
			scrollTop: questionsFormHeight
		}, 2000);*/
	});

	$(document).on("click", "#save-questionnaire", function() {
		var questionnaire = $('#questionnaire-title').val();
		var fullData = [];
		$("#questions-form .question").each(function(i) {
			console.log($(this));
			var question = $(this).children("textarea").first().val();
			var values = $(this).children("textarea").last().val();
			var type = $(this).children("select").val();
			if (question != "" && values != "" && type != "") {
				var data = {questionnaire: questionnaire.toLowerCase(), question: question, values: values, type: type};
				fullData.push(data);
			}
		});
		addQuestionnaire(fullData);
	});

});

function checkAdminLogin() {
	var username = $("#admin-username").val();
	var password = $("#admin-password").val();
	var hashedPassword = hash(password);
	$.ajax({
		url: '/api/adminLogin',
		method: 'POST',
		data: {username: username, password: hashedPassword},
		dataType: 'JSON',
		success: function(response) {
			if (response.loggedIn === 'true') {
				var now = new Date();
				var time = now.getTime();
				time += 3600 * 5000;
				now.setTime(time);
				document.cookie = "mps=loggedIn;expires="+now.toUTCString()+";path=/";
				window.location.href = '/adminHome';
			} else {
				$("#login-error").text("Incorrect username/password. Please try again!");
			}
		}
	});
}

function getQuestionnaires() {
	$.ajax({
		url: '/api/getQuestionnaires',
		method: 'GET',
		dataType: 'JSON',
		success: function(questionnaires) {
			for (var i in questionnaires) {
				$("#questionnaires-list").append("<li class = 'clickable'>" + capitalize(questionnaires[i]) + "</li>");
			}
		}
	});
}

function getQuestions(questionnaire) {
	$.ajax({
		url: '/api/getQuestions',
		method: 'POST',
		data: {questionnaire: questionnaire.toLowerCase()},
		dataType: 'JSON',
		success: function(questions) {
			$("#questions-list").empty();
			for (var i in questions) {
				$("#questions-list").append("<li>" + capitalize(questions[i].question) + "</li>");
			}
		}
	});
}

function addQuestionnaire(questions) {
	$.ajax({
		url: '/api/addQuestionnaire',
		method: 'POST',
		data: JSON.stringify({questions: questions}),
		dataType: 'JSON',
		contentType: 'application/json',
		success: function(res) {
			$("#save-response").addClass(res.font);
			$("#save-response").text(res.msg);
		}
	});
}

function hash(string) {
	var hash = 0, i, chr, len;
	if (string.length == 0) 
		return hash;

	for (i = 0, len = string.length; i < len; i++) {
		chr   = string.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0;
	}

	return hash;
}