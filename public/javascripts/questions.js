$(document).ready(function() {

	$(document).on("click", ".question-selector-circle", function() {
		var question = d3.select(this).data()[0];
		console.log(d3.select(this));
		$('.question-selector-circle.selected').removeClass('selected');
		$(this).addClass('selected');
		$("#question-text").empty();
		$("#question-text").html("<div class = 'font-black' id = 'question-header'>" + capitalize(question.question) + "</div>");
		var values = getValues(question.type, question.values);
		showValues(question.type, values);	
	});

});

function showQuestion(num) {
	var question = d3.selectAll(".question-selector-circle").data()[num];
	console.log(d3.selectAll(".question-selector-circle").data());
	$("#question-box div").append("<div id = 'question-text'></div>");
	$("#question-text").html("<div class = 'font-black' id = 'question-header'>" + capitalize(question.question) + "</div>");
	var values = getValues(question.type, question.values);
	showValues(question.type, values, num);	
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

function showValues(type, values, num) {
	if (type === "checklist" || type === "radio") {
		for (var i in values) {
			$("#question-text").append("<input type = '" + type + "' name = 'question-" + num + "'>" + capitalize(values[i]) + "</span><br/>");
		}
	} else {
		$("#question-text").append(values[0] + "<input type = 'range' name='question-" + num + "' min='" + values[0] + "' max='" + values[values.length - 1] + "'>" + values[1] + "<br/>");
	}
}
