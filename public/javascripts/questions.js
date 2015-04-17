$(document).ready(function() {

	$(document).on("click", ".question-selector-circle", function() {
		var question = d3.select(this).data()[0];
		console.log(d3.select(this));
		$('.question-selector-circle.selected').removeClass('selected');
		$(this).addClass('selected');
		$("#question-text").empty();
		$("#question-text").html("<span class = 'font-black'>" + question.question + "</span>");
		var values = getValues(question.type, question.values);
		showValues(question.type, values);	
	});

});

function showQuestion(num) {
	var question = d3.selectAll(".question-selector-circle").data()[num];
	console.log(d3.selectAll(".question-selector-circle").data());
	$("#question-box div").append("<div id = 'question-text'></div>");
	$("#question-text").html("<span class = 'font-black'>" + question.question + "</span>");
	var values = getValues(question.type, question.values);
	showValues(question.type, values);	
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
			$("#question-text").append("<br/><input type = '" + type + "' name = 'question-" + i + "'>" + values[i] + "</span>");
		}
	} else {
		$("#question-text").append("<br/><input type = 'range' name='question-0' min='" + values[0] + "' max='" + values[values.length - 1] + "'>")
	}
}
