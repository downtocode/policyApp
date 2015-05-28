function capitalize(string) {
	return string.charAt(0).toUpperCase() + string.substring(1,string.length);
}

function capitalizeSentence(string) {
	var strArr = string.split(" ");
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

function checkIfDone(questions) {
	console.log(questions);
	/*if (num_finished + Object.keys(local_treatments).length - 1== questions.length) {
		console.log(local_treatments, questions);
	}*/
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