var user = {};
var accessToken2 = 'CAACEdEose0cBANZBMg6QpbEzpwNXX6f2bJdaernrv3YvO8CUSTu07j7jX9QGXJC3UKgvHkRf03xZCAooVNYA2FU4q2szrYid8C9ZAvG3QoVah5p6KZCFbXvXOkoo7gXXjBAp399Wk8fJZA5ngRdCJIk62e39RA1loki1mBWojsGzcppsMABUhBU5vhZAsEobXEwCdyarTKwKhisuy4tMPFwHV1AEABvMkZD';

$(document).ready(function() {

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

	var accessToken = hasCookie('fb_access');


	$(document).on("click", "#submit-consent", function() {
		submitConsent();
	});


	$(document).on("click", ".question-selector-circle", function() {
		$('.question-selector-circle.selected').removeClass('selected');
		$(this).addClass('selected');
		var ind = $('.question-selector-circle').index($(this));
		showQuestion(ind);
		/*$("iframe").attr('src', song[0].top_track.preview_url);
		$("#preview-album img").attr('src', song[0].top_track.album.images[0].url);
		$("#question-text").empty();
		$("#question-text").html("<span class = 'font-black'>" + song[0].name + ": </span><span class = 'font-grey'>" + song[0].song + "</span>");*/
	});


	$(document).on({
	    mouseenter: function () {
	    	$(this).children('.preview-star').css('fill', '#AD8D26');
			$(this).prevAll('svg').each(function() {
				if ($(this).attr('class').indexOf('selected-star') < 0)
					$(this).children('.preview-star').css('fill', '#AD8D26');
			});
			$(this).nextAll('svg').each(function() {
				$(this).children('.preview-star').css('fill','none');
			});
	    },
	    mouseleave: function () {
	    	if ($(this).attr('class').indexOf('selected-star') < 0)
	    		$(this).children('.preview-star').css('fill','none');
	    	$(this).prevAll('svg').each(function() {
				if ($(this).attr('class').indexOf('selected-star') < 0)
					$(this).children('.preview-star').css('fill', 'none');
			});
			$(this).nextAll('svg').each(function() {
				if ($(this).attr('class').indexOf('selected-star') >= 0)
					$(this).children('.preview-star').css('fill', '#AD8D26');
			});
	        
	    }
	}, "svg");


	$(document).on("click", "svg", function() {
		$(".custom-button").prop("disabled", false);
		$('.selected-star').attr('class', 'clickable');
		$('.preview-star').css('fill', 'none');
		$(this).children('.preview-star').css('fill', '#AD8D26');
		$(this).attr('class', 'clickable selected-star');

		$(this).prevAll('svg').each(function() {
			$(this).children('.preview-star').css('fill', '#AD8D26');
			$(this).attr('class', 'clickable selected-star');
		});

		var currData = d3.select('.selected').data();
	});


	$(document).on("click", "#submit-consent", function() {
		var questionnaireName = d3.selectAll(".question-selector-circle").data()[0].questionnaire;
		$("header li").text(capitalizeSentence(questionnaireName));
		$("#consent-form").fadeOut(500, function() {
			$("#container").fadeIn(100);
			showQuestion(0);
		});
		
	});


	$(document).on("click", "#show-song", function() {
		$(this).remove();
		var ind = $('.question-selector-circle').index($('.selected'));
		showSong(ind);
	});


	$(document).on("click", "#next-important", function() {
		$("svg").remove();
		addMusicKnowledge();

		var curr_question_ind = $(".question-selector-circle").index($(".selected"));
		var curr_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind];
		var next_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind + 1];

		if (curr_question_ind == $(".question-selector-circle").length - 1) {
			$("#next-important").attr('id','answer-more').val('Submit!');
		} else {
			$("#next-important").attr('id','next-question').val('Next');
		}

		$("input[type=button]").prop("disabled", true);
	});


	$(document).on("click", "#next-question, #skip-question, #skip-demographics", function() {
   		$("#skip-question").remove();

   		var ind = $('.question-selector-circle').index($('.selected'));
		var curr_question = d3.selectAll(".question-selector-circle").data()[ind];
		var next_question = d3.selectAll(".question-selector-circle").data()[ind + 1];

   		if ( $(".demographics-next").length > 0) {
   			submitUserInfo(0);
   			$("li:first").remove();
   			$("li.hidden").show();
   			showQuestion(ind);
   		} else {
   			$('.selected').removeClass('selected');
   			$($('.question-selector-circle')[ind]).next().addClass('selected');
   			showQuestion(ind + 1);
   		}
   	});


   	$(document).on("click", "svg", function() {
		if ($(".all-question").length == 0)
			var ind = $(".question-selector-circle").index($(".selected"));
		else
			var ind = $(".question-selector-circle").length + $("#questionnaires-list li").index($(".all-question-selected"));

		var blah = $("#user-questions").val()[ind].split("|");
		blah[0] = $(".selected-star").length;
		$("#user-questions").val()[ind] = blah.join("|");		
	});


	$(document).on("change", "input, select", function() {
		if ($(".demographics-next").length == 0) {
			$("input[type=button]").prop("disabled", false);
			if ($(".all-question").length == 0)
				var ind = $(".question-selector-circle").index($(".selected"));
			else
				var ind = $(".question-selector-circle").length + $("#questionnaires-list li").index($(".all-question-selected"));

			var blah = $("#user-questions").val()[ind].split("|");
			blah[1] = $(this).val();
			$("#user-questions").val()[ind] = blah.join("|");
		} else {
			var user = d3.select(".user-info").data()[0];
			user[$(this).attr("name")] = $(this).val();

			var empty_inputs = $('input[type=radio]').filter(function() { return this.value == ""; });

			if (empty_inputs.length == 0 && $(".radio-header").length == $("input[type=radio]:checked").length) {
				$("input[type=button]").prop("disabled", false);
			}

			console.log(user);

			d3.select("#user")
				.selectAll("div")
				.data([user])
				.enter()
				.append("div")
				.attr("class", "hidden user-info");
		}
	});


	$(document).on("click", "#get-user-info", function() {
		$(this).hide();
		$("li:first").remove();
		$("li.hidden:first").show();
		askDemographics();
	});


	$(document).on("click", "#submit-more-page", function() {
		$("#question-selector").css("display", "none");
		$(this).css("display", "none");
		$("#importance-section").remove();
		$("svg, iframe").remove();
		$("#question-text").html("<div class = 'font-black question-header'>Thanks for rating these songs! Would you like to hear more?</div>");
		$("#question-text").append("<input type = 'button' id = 'answer-more' value = 'Yes' class = 'clickable'/><input type = 'button' id = 'submit-questionnaire' value = 'No' class = 'clickable'/>");
	});


	$(document).on("click", "#submit-questionnaire, #answer-more", function() {
		getAllAnswers();
	});


	$(document).on("click", ".all-question", function() {
		$(this).addClass("italics");
		$(this).children().css("opacity", ".5");
		$("#question-text").empty();
		$(".all-question-selected").removeClass("all-question-selected");
		$(this).addClass("all-question-selected");
		var data = d3.select(this).data()[0];
		showAllQuestion(data);
	});


	$(document).on("click", "#invite-friends", function() {
		sendFriendsDialog();
	});

});

function getFriendsMusic(accessToken, callback) {
	//var accessToken = accessToken2;
	var artists = {};
    //url = '/me?fields=friends{music,name}&access_token='+accessToken;

    var url = 'https://graph.facebook.com/me?fields=friends{music,name}';
    //url = '/me/taggable_friends&access_token=' + accessToken;
    //url = 'https://graph.facebook.com/v2.3/me/taggable_friends?limit=1000';
    //console.log(accessToken);

    makeFriendAPICall(url, accessToken, artists, function(response) {
    	saveUserInfo(artists);
	});
}

function makeFriendAPICall(url, accessToken, artists, callback) {
	$.ajax({
		url: url,
		data: {access_token: accessToken},
		dataType: "jsonp",
		success: function(response) {
			//console.log(response);
			if (response.error != undefined) {
				//document.cookie = 'fb_access=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
				//window.location.href = '/login/music';
				return;
			} else {
				if (response.data != undefined && response.data.length == 0) {
					callback();
					return;
				} else {
					var curr_friends = response.friends.data;
					var music_list;
			    	curr_friends.forEach(function(frand) {

			    		if (frand.music != undefined) {
			    			music_list = frand.music.data;

			    			for (var i = 0; i < music_list.length; i++) {
			    				artist_id = music_list[i].id;

			    				if (artist_id in artists) {
				    				artists[artist_id]['friends'].push(frand.name);
				    			} else {
				    				new_artist_info = {name: music_list[i].name, artist: music_list[i], friends: [frand.name], user: user};
				    				artists[artist_id] = new_artist_info;
				    			}
			    			}
			    		}

			    	});

			    	if (response.friends.paging.next != undefined) {
			    		makeFriendAPICall(response.friends.paging.next, accessToken, artists, callback);
			    	} else {
			    		callback();
			    	}
				}
			}
		}
	});
}

function getArtistTopSong(randArtists, artists, i, callback) {
	var artist = artists[Object.keys(artists)[i]];
	var artistNameSearch = artist.name.replace(/ /g, '%20');
	var url = 'https://api.spotify.com/v1/search?q='+artistNameSearch+'&type=artist'; 

	$.ajax({
		url: url,
		dataType: 'JSON',
		success: function(data) {
			if (data.artists.items.length > 0) {
				var artistSpotifyID = data.artists.items[0].id;
				var url2 = 'https://api.spotify.com/v1/artists/'+artistSpotifyID+'/top-tracks?country=US';
				$.ajax({
					url: url2,
					dataType: 'JSON',
					success: function(top_track) {
						if (top_track != null && top_track.tracks.length > 0) {
							artist.top_track = top_track.tracks[0];
							artist.song = top_track.tracks[0].name;
							randArtists.push(artist);
						}

						callback(artists);
					}
				});
			} else {
				getArtistTopSong(randArtists, artists, i+1, callback);
			}

		}
	});
}

function switchDictionaryAggregate(artists, newKey) {
	var newArtists = {};
	for (var artist in artists) {
		var currLength = artists[artist][newKey].length;
		if ( currLength in newArtists ) {
			newArtists[currLength].push(artists[artist]);
		} else {
			newArtists[currLength] = [artists[artist]];
		}
	}
	return newArtists;
}

function getArtistDistribution(artists) {
	var newArtists = [];
	for (var artist in artists) {
		for (var artistPerson in artists[artist]) {
			newArtists.push(artists[artist][artistPerson]);
		}
	}
	return newArtists;
}

function getDistributionValues(size) {
	var len = Math.floor( ( size - 1) / 10);
	var lens = [];

	for (var i = 0; i < size - 1 - len; i += len) {
		var rand = Math.floor(Math.random() * len) + i;
		lens.push(rand);
	}

	return lens;
}

function saveUserInfo(artists) {
	var artistsNumLiked = switchDictionaryAggregate(artists,"friends");
	var artistsDistribution = getArtistDistribution(artistsNumLiked);
	var randVals = getDistributionValues(artistsDistribution.length);
	console.log(randVals);
	var randArtists = [];
	var count = 0;

	for (var rand in randVals) {
		var currArtist = artistsDistribution[randVals[rand]];
		console.log(currArtist);

		getArtistTopSong(randArtists, artists, randVals[rand], function(artists) {
			count++;
			if (count == randVals.length) {
				displaySongs(randArtists);
			}
		});
	}

}

function displaySongs(randArtists) {
	d3.select("#question-selector").selectAll("div")
		.data(randArtists)
		.enter()
		.append("div")
		.attr("class", "question-selector-circle clickable")
		.attr("id", function(d, i) { return "question-" + i; });

	$(".question-selector-circle").first().addClass("selected");

	var firstArtist = randArtists[0];

	$("#question-box div").append("<iframe src = '' id = 'preview-iframe'></iframe>");
	$("#question-box div").append("<div id = 'preview-album'><div id = 'question-text'></div></div>");
	for (var i = 0; i < 5; i++) {
		$("#preview-album").append('<svg height="26" width="26" class = "clickable"><polygon points=".25,10 6,10 8,5.5 10,10 15.5,10 11.5,13.5 13,18.5 8.25,15.25 3.75,18.5 5,13.5" class = "preview-star"/></svg>');
	}

	$("#preview-album").append("<br/><img/>");
	$("iframe").attr('src', firstArtist.top_track.preview_url);
	$("#preview-album img").attr('src', firstArtist.top_track.album.images[0].url);
	$("#question-text").html("<span class = 'font-black'>" + firstArtist.name + ": </span><span class = 'font-grey'>" + firstArtist.song + "</span>");
}


function showQuestion(num) {
	var d = new Date();
	setTime(d, num);
	setDate(d, num);

	var question = d3.selectAll(".question-selector-circle").data()[num];
	$("#question-box div").html("<div id = 'preview-album'><div id = 'question-text'></div></div>");
	$("#question-text").html("<div id = 'question-title' class = 'font-black'>" + question.artist + " - <span class ='italics'> " + question.song + "</span></div>");

	showTreatment(num);
}


function showTreatment(num) {
	var question = d3.selectAll(".question-selector-circle").data()[num];

	//$("#preview-album img").attr('src', question.info.album.images[0].url);
	if (question.treatment_type.toLowerCase() != "control") {
		if (question.treatment.length > 0) {
			switch(question.treatment_type) {
				case "treatment_g":
					$("#question-text").append("<div class = 'font-black font-15 bold italics' id = 'question-treatment'>This song has " + question.treatment + " Last FM listeners.</div>");
					break;
				default:
					$("#question-text").append("<div class = 'font-black font-15 bold italics' id = 'question-treatment'>" + question.treatment + "</div>");
					break; 
			}
		}
	}

	$("#question-text").append("<input type='button' class='custom-button clickable' id='show-song' value='Next'/>");
}


function showSong(num) {
	var question = d3.selectAll(".question-selector-circle").data()[num];
	$("#preview-album").append("<iframe src = '' id = 'preview-iframe' class = 'center'></iframe>");
	$("iframe").attr('src', question.url);
	showStars();
}


function showStars() {
	for (var i = 0; i < 5; i++) {
		$("#preview-album").append('<svg height="26" width="26" class = "clickable rating-star"><polygon points=".25,10 6,10 8,5.5 10,10 15.5,10 11.5,13.5 13,18.5 8.25,15.25 3.75,18.5 5,13.5" class = "preview-star"/></svg>');
	}

	$("#preview-album").append("<br/><input type='button' class='custom-button clickable' id='next-important' value='Rate!'/>");
	$("#next-important").prop("disabled", true);
}


function showAllQuestion(question) {
	var ind = $(".all-question").index($(".all-question-selected")) + $(".question-selector-circle").length;
	var user_answer = parseInt($("#user-questions").val()[ind].split("|")[0]);
	$("#question-text").html("<div id = 'preview-album'></div>");

	for (var i = 0; i < 5; i++) {
		if (user_answer.length != NaN && i < user_answer) {
			$("#preview-album").append('<svg height="26" width="26" class = "clickable selected-star"><polygon points=".25,10 6,10 8,5.5 10,10 15.5,10 11.5,13.5 13,18.5 8.25,15.25 3.75,18.5 5,13.5" class = "preview-star" style="fill: #ad8d26;"/></svg>');
			
		} else {
			$("#preview-album").append('<svg height="26" width="26" class = "clickable rating-star"><polygon points=".25,10 6,10 8,5.5 10,10 15.5,10 11.5,13.5 13,18.5 8.25,15.25 3.75,18.5 5,13.5" class = "preview-star"/></svg>');
		}
	}
	

	$("#preview-album").append("<div class = 'font-black bold'>" + question.title + "</div>");

	if (question.treatment_type.toLowerCase() != 'control' && question.treatment != null && question.treatment.length > 0) {
		switch(question.treatment_type) {
			case "treatment_l":
				$("#preview-album").append("<div class = 'font-black font-15' id = 'question-treatment'>Your friend Juan David gave this song " + question.treatment + " stars</div>");
				break;
			case "treatment_i":
				$("#preview-album").append("<div class = 'font-black font-15' id = 'question-treatment'>" + question.treatment + "</div>");
				break;
			case "treatment_g":
				$("#preview-album").append("<div class = 'font-black font-15' id = 'question-treatment'>" + question.treatment + " Last FM Listeners</div>");
				break;
			default:
				$("#preview-album").append("<div class = 'font-black font-15' id = 'question-treatment'>" + question.treatment_g + " Last FM Listeners</div>");
				break;
		}
	} else {
		$("#preview-album").append("<br/>");
	}

	$("#preview-album").append("<iframe src = '' id = 'preview-iframe' class = 'center'></iframe>");
	$("iframe").attr('src', question.url);

	//addMusicKnowledge2();

}

function getSongs(songs, callback) {
	var count = 0;
	for (var i in songs) {
		getSong(songs, i, songs[i].artist, songs[i].song);
		if (i == songs.length - 1) {
			callback(songs);
		}
	}
}

function getSong(songs, i, artist, song) {
	artist = artist.replace(/ /g,"%20");
	song = song.replace(/ /g, "%20");
	$.ajax({
		url: 'https://api.spotify.com/v1/search?q=artist:'+artist+'+track:'+song+'&type=track',
		dataType: 'JSON',
		success: function(response) {
			songs[i].info = response.tracks.items[0];
		}
	});
}

function getAllQuestions(questionnaire) {
	var questionIds = [];
	$(".question-selector-circle").each(function(i) {
		questionIds.push(d3.select(this).data()[0]._id);
	});

	getYoutubePlaylist(null, null, function(songs) {
		$.ajax({ 
			url: '/api/saveNewSongs',
			method: 'POST',
			data: JSON.stringify(songs),
			dataType: "JSON",
			contentType: "application/json",
			success: function(response) {
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
		});
	});
	
}


function displayAllQuestions(questions) {
	$(".display-table").html('<div class = "display-table-cell font-18" id = "questionnaires-wrapper">' +
								'<div id = "questionnaires" class = "border-box">' +
									'<div class = "global-title display-table-cell border-box font-15 center">Title</div>' + 
									'<div class = "global-num display-table-cell border-box font-15 center">YouTube Likes</div>' +
									'<ol id = "questionnaires-list" class = "no-list font-15">' +
									'</ol>' +
								'</div>' +
								'<div id = "question-text" class = "border-box">' +
								'</div>' +
							'</div>'); 

	$("#questionnaires").css("width", "40%");
	var numPrev = $(".question-selector-circle").length;
	$("#question-text").width("20%");
	$("#question-box").height("100% !important");

	d3.select("#questionnaires-list").selectAll("li")
		.data(questions)
		.enter()
		.append("li")
		.attr("class", function(d, i) {
			if (d.treatment != undefined)
				return "clickable all-question display-table center";
			else
				return "clickable all-question display-table";
		})
		.attr("id", function(d, i) {
			var currNum = numPrev + i;
			return 'question-'+ currNum;
		})
		.html(function(d, i) {
			if (d.treatment != undefined)
				return "<div class = 'global-title display-table-cell border-box'>" + d.title + "</div><div class = 'global-num display-table-cell border-box'>" + d.treatment + "</div>";
			else 
				return d.title;
		});

	for (var i in questions) {
		$("#user-questions").val().push("|");
	}

	$("#question-box").prepend("<div id = 'questionnaire-top-text'>Thanks for your ratings! Please feel free to rate more songs below.</div>");
	$("header").append("<input type = 'button' id = 'submit-questionnaire' value = 'Submit!' class = 'clickable'/>")
	
}

function getAllAnswers() {
	var answersArr = $("#user-questions").val();
	var tempArr, userAnswer;
	var userAnswers = [];
	var userID = d3.selectAll(".user-info").data()[0].id;
	var end_date = new Date();
	var end_time = end_date.getTime();

	if ($(".all-question").length > 0) {
		$(".all-question").each(function(i) {
			var questionID = d3.select(this).data()[0]._id;
			var treatment = d3.select(this).data()[0].treatment_type;
			var ind = i + $(".question-selector-circle").length;
			tempArr = answersArr[ind].split("|");
			userAnswer = {user_id: userID, question_id: questionID, question: tempArr[0], knowledge: tempArr[1], treatment: treatment};
			userAnswers.push(userAnswer);
		});
	} else {
		$(".question-selector-circle").each(function(i) {
			var question = d3.select(this).data()[0];
			var questionID = d3.select(this).data()[0]._id;
			var treatment = d3.select(this).data()[0].treatment_type;
			var localType = question.local_type;
			tempArr = answersArr[i].split("|");
			userAnswer = {user_id: userID, question_id: questionID, question: tempArr[0], importance: tempArr[1], treatment: treatment, treatment_l_type: localType, start_time: question.start_time, answer_time: question.answer_time};
			userAnswers.push(userAnswer);
		});
	}

	submitQuestionnaire(userAnswers);
}

function submitQuestionnaire(answers) {
	$.ajax({
		url: '/api/sendAnswers',
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify({answers: answers}),
		success: function(response) {	
			if ($(".all-question").length > 0) {
				$("#questionnaire-top-text").remove();
				$(".display-table-cell").html("Thank You! We also encourage you to invite your friends to <br/>participate in this study as well by clicking the button below!<br/>" + 
					"<br/><input type ='button' id = 'invite-friends' class = 'custom-button clickable' value = 'Finish'/>")
			} else {
				var questionnaireName = d3.selectAll(".question-selector-circle").data()[0].questionnaire;
				getAllQuestions(questionnaireName);
			}
		}
	});
}


function addMusicKnowledge() {
	$("iframe").after("<div id = 'importance-section'><div class = 'font-black importance-header'>Have you heard this song before?</div></div>");
	$("#importance-section").append("<input type = 'range' name='1' min='0' max='100'><ul id = 'importance-list' class = 'no-list font-15'></ul>");
	$("#importance-list").append("<li class = 'inline-block center'>Never <br/>Heard It</li>");
	$("#importance-list").append("<li class = 'inline-block center'>Sounds <br/>Familiar</li>");
	$("#importance-list").append("<li class = 'inline-block center'>Know of This<br/>Song or Artist</li>");
	$("#importance-list").append("<li class = 'inline-block center'>Know of This Song<br/>or Artist Very Well</li>");	
	$("#importance-list li").width("25%");
}

function addMusicKnowledge2() {
	$("#importance-section").remove();
	$(".display-table-cell").append("<div id = 'importance-section' class = 'center font-16'><div class = 'font-black importance-header'>Have you heard this song before?</div></div>");
	$("#importance-section").append("<input type = 'range' name='1' min='0' max='100'><ul id = 'importance-list' class = 'no-list font-15'></ul>");
	$("#importance-list").append("<li class = 'inline-block center'>Never <br/>Heard It</li>");
	$("#importance-list").append("<li class = 'inline-block center'>Sounds <br/>Familiar</li>");
	$("#importance-list").append("<li class = 'inline-block center'>Know of This<br/>Song or Artist</li>");
	$("#importance-list").append("<li class = 'inline-block center'>Know of This Song<br/>or Artist Very Well</li>");	
	$("#importance-list li").width("25%");
}
