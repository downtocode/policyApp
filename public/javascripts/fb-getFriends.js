//////////////////////////////////////////////////////////////
// This file is for functions that are unique to the music 	//
// questionnaire. It also includes old code	from using the 	//
// Spotify API.												//
//////////////////////////////////////////////////////////////

// Sets up key-value data storage for user info access later
var user = {};

// Access token for FB app permissions
var accessToken2 = 'CAACEdEose0cBANZBMg6QpbEzpwNXX6f2bJdaernrv3YvO8CUSTu07j7jX9QGXJC3UKgvHkRf03xZCAooVNYA2FU4q2szrYid8C9ZAvG3QoVah5p6KZCFbXvXOkoo7gXXjBAp399Wk8fJZA5ngRdCJIk62e39RA1loki1mBWojsGzcppsMABUhBU5vhZAsEobXEwCdyarTKwKhisuy4tMPFwHV1AEABvMkZD';

$(document).ready(function() {

	// Initializes FB object
	window.fbAsyncInit = function() {
  		FB.init({
    		appId      : '1724641247754857', // '486648534724015', // '150997527214'
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


	// Checks if a cookie exists with the FB token
	// Stores result in accessToken variable
	var accessToken = hasCookie('fb_access');

	
	/***************** EVENT HANDLERS *****************/

	// User clicks on "I Agree" button
	$(document).on("click", "#submit-consent", function() {
		submitConsent();
	});

	// User hovers over rating stars (fills in only that one 
	// and ones to the left)
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

	// When user clicks on rating star, keeps track of this by 
	// changing properties of elements and fills them in
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

	// When user submits the consent form and starts answering questions
	$(document).on("click", "#submit-consent", function() {

		// Get the questionnaire name to display on top based on first question information
		var questionnaireName = d3.selectAll(".question-selector-circle").data()[0].questionnaire;
		$("header li").text(capitalizeSentence(questionnaireName));

		// Hide consent form and show 1st question
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

	// When user rates the song and clicks the "Next" button for
	// how well they know the song
	$(document).on("click", "#next-important", function() {
		$("svg").remove();
		addMusicKnowledge();

		// Get current question's index so that we can get the next one
		var curr_question_ind = $(".question-selector-circle").index($(".selected"));
		var curr_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind];
		var next_question = d3.selectAll(".question-selector-circle").data()[curr_question_ind + 1];

		// If the next one is the last one, the following "Next" button 
		// is a "Submit" button instead 
		if (curr_question_ind == $(".question-selector-circle").length - 1) {
			$("#next-important").attr('id','answer-more').val('Submit!');
		} else {
			$("#next-important").attr('id','next-question').val('Next');
		}

		// Disable the button until the user answers
		$("input[type=button]").prop("disabled", true);
	});

	// When user either finishes the knowledge question, skips the question,
	// or skips the demographics, go to the next question
	$(document).on("click", "#next-question, #skip-question, #skip-demographics", function() {
   		$("#skip-question").remove();

   		// Get index of current question
   		var ind = $('.question-selector-circle').index($('.selected'));
		var curr_question = d3.selectAll(".question-selector-circle").data()[ind];
		var next_question = d3.selectAll(".question-selector-circle").data()[ind + 1];

		// Checks if this is the demographics
   		if ( $(".demographics-next").length > 0) {
   			// If so, submit user's info to database and then show question
   			submitUserInfo(0);
   			$("li:first").remove();
   			$("li.hidden").show();
   			showQuestion(ind);
   		} else {
   			// Otherwise just show the next question
   			$('.selected').removeClass('selected');
   			$($('.question-selector-circle')[ind]).next().addClass('selected');
   			showQuestion(ind + 1);
   		}
   	});

	// When user gives rating, adds their rating to a hidden value in 
	// an HTML div 
   	$(document).on("click", "svg", function() {
   		// Checks if this is the rating at the end with all songs
		if ($(".all-question").length == 0) // if not, then index is as is
			var ind = $(".question-selector-circle").index($(".selected"));
		else // if so, then index is num of "main" questions plus question's index in all questions list
			var ind = $(".question-selector-circle").length + $("#questionnaires-list li").index($(".all-question-selected"));

		// Adds user's answer to the array
		var blah = $("#user-questions").val()[ind].split("|");
		blah[0] = $(".selected-star").length;
		$("#user-questions").val()[ind] = blah.join("|");		
	});

   	// When user answers a question
	$(document).on("change", "input, select", function() {
		// Checks if demographic question
		if ($(".demographics-next").length == 0) { // if not, then add to user's answer array
			$("input[type=button]").prop("disabled", false);
			if ($(".all-question").length == 0)
				var ind = $(".question-selector-circle").index($(".selected"));
			else
				var ind = $(".question-selector-circle").length + $("#questionnaires-list li").index($(".all-question-selected"));

			var blah = $("#user-questions").val()[ind].split("|");
			blah[1] = $(this).val();
			$("#user-questions").val()[ind] = blah.join("|");
		} else { // else add to user's information array
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

	// When user gets to demographic page, get demographic questions
	$(document).on("click", "#get-user-info", function() {
		$(this).hide();
		$("li:first").remove();
		$("li.hidden:first").show();
		askDemographics();
	});

	// When user finishes answering questions, asks if they want to rate more
	$(document).on("click", "#submit-more-page", function() {
		$("#question-selector").css("display", "none");
		$(this).css("display", "none");
		$("#importance-section").remove();
		$("svg, iframe").remove();
		$("#question-text").html("<div class = 'font-black question-header'>Thanks for rating these songs! Would you like to hear more?</div>");
		$("#question-text").append("<input type = 'button' id = 'answer-more' value = 'Yes' class = 'clickable'/><input type = 'button' id = 'submit-questionnaire' value = 'No' class = 'clickable'/>");
	});

	// When user finishes answering all questions, submit to database
	$(document).on("click", "#submit-questionnaire, #answer-more", function() {
		getAllAnswers();
	});

	// When user clicks on a question in the all quetion list, display on right side
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

// Gets FB friends' music (not currently used)
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

// Makes actual FB API call and continues calling until all
// friends are retrieved
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

// Get the top song for each artist using Spotify API (also not used)
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

// Switches dictionary from key:value to value:key
// Next few functions not used
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

// Shows question at index num
function showQuestion(num) {
	// Gets current date/time to figure out amt of time spent on question
	var d = new Date();
	setTime(d, num);
	setDate(d, num);

	// Gets that question's data to display 
	var question = d3.selectAll(".question-selector-circle").data()[num];
	$("#question-box div").html("<div id = 'preview-album'><div id = 'question-text'></div></div>");
	$("#question-text").html("<div id = 'question-title' class = 'font-black'>" + question.artist + " - <span class ='italics'> " + question.song + "</span></div>");

	// Shows treatment for question
	showTreatment(num);
}

// Displays treatment
function showTreatment(num) {
	// Gets the current question information based on the index num provided
	var question = d3.selectAll(".question-selector-circle").data()[num];

	// If the treatment isn't a control 
	if (question.treatment_type.toLowerCase() != "control") {
		// If the treatment isn't undefined
		if (question.treatment.length > 0) {
			// Displays treatment based on what type it is
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

	// Adds "Next" button
	$("#question-text").append("<input type='button' class='custom-button clickable' id='show-song' value='Next'/>");
}

// Shows song itself from YouTube
function showSong(num) {
	var question = d3.selectAll(".question-selector-circle").data()[num];
	$("#preview-album").append("<iframe src = '' id = 'preview-iframe' class = 'center'></iframe>");
	$("iframe").attr('src', question.url);
	showStars();
}

// Shows the stars for the user to rate song
function showStars() {
	for (var i = 0; i < 5; i++) {
		$("#preview-album").append('<svg height="26" width="26" class = "clickable rating-star"><polygon points=".25,10 6,10 8,5.5 10,10 15.5,10 11.5,13.5 13,18.5 8.25,15.25 3.75,18.5 5,13.5" class = "preview-star"/></svg>');
	}

	$("#preview-album").append("<br/><input type='button' class='custom-button clickable' id='next-important' value='Rate!'/>");
	$("#next-important").prop("disabled", true);
}

// Shows a song at the end when user is answering 
function showAllQuestion(question) {
	// Calculates the actual index based on position in the list
	var ind = $(".all-question").index($(".all-question-selected")) + $(".question-selector-circle").length;

	// Gets previous answer in case user already submitted rating previously
	var user_answer = parseInt($("#user-questions").val()[ind].split("|")[0]);
	$("#question-text").html("<div id = 'preview-album'></div>");

	// Displays the stars
	for (var i = 0; i < 5; i++) {
		if (user_answer.length != NaN && i < user_answer) {
			$("#preview-album").append('<svg height="26" width="26" class = "clickable selected-star"><polygon points=".25,10 6,10 8,5.5 10,10 15.5,10 11.5,13.5 13,18.5 8.25,15.25 3.75,18.5 5,13.5" class = "preview-star" style="fill: #ad8d26;"/></svg>');
			
		} else {
			$("#preview-album").append('<svg height="26" width="26" class = "clickable rating-star"><polygon points=".25,10 6,10 8,5.5 10,10 15.5,10 11.5,13.5 13,18.5 8.25,15.25 3.75,18.5 5,13.5" class = "preview-star"/></svg>');
		}
	}
	
	$("#preview-album").append("<div class = 'font-black bold'>" + question.title + "</div>");

	// Displays the treatment
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

	// Displays section asking how well they know the song/artist
	addMusicKnowledge2();

}

// Get songs from Spotify API (not used)
function getSongs(songs, callback) {
	var count = 0;
	for (var i in songs) {
		getSong(songs, i, songs[i].artist, songs[i].song);
		if (i == songs.length - 1) {
			callback(songs);
		}
	}
}

// Get single song
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

// Gets all songs from YouTube playlist 
function getAllQuestions(questionnaire) {
	var questionIds = [];
	$(".question-selector-circle").each(function(i) {
		questionIds.push(d3.select(this).data()[0]._id);
	});

	// Makes YouTube API call and gets data in variable songs
	getYoutubePlaylist(null, null, function(songs) {
		// Takes the songs retrieved and saves them into database
		$.ajax({ 
			url: '/api/saveNewSongs',
			method: 'POST',
			data: JSON.stringify(songs),
			dataType: "JSON",
			contentType: "application/json",
			success: function(response) {
				// Gets all questions from database
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

// Displays all song names in left column 
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

	// Creates list element for all songs
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

	// Appends to user answers array
	for (var i in questions) {
		$("#user-questions").val().push("|");
	}

	$("#question-box").prepend("<div id = 'questionnaire-top-text'>Thanks for your ratings! Please feel free to rate more songs below. <br/>If you like what you hear, <a href = 'https://www.youtube.com/playlist?list=PL-F_xeGwyiSKwU0g-4ygo2OjhKQxdF6LF' target=_blank>follow our playlist</a> on YouTube!</div>");
	$("header").append("<input type = 'button' id = 'submit-questionnaire' value = 'Submit!' class = 'clickable'/>")
	
}

// Gets all answers from user answers array and adds to database
function getAllAnswers() {
	var answersArr = $("#user-questions").val();
	var tempArr, userAnswer;
	var userAnswers = [];

	// Gets user's ID for database storage
	var userID = d3.selectAll(".user-info").data()[0].id;

	// Gets date/time for duration of last rating
	var end_date = new Date();
	var end_time = end_date.getTime();

	// Checks if song at the end is main song or in playlist
	// Changes the ind and treatment storage appropriately
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

	// After finishes creating the array of user answers, submits to database
	submitQuestionnaire(userAnswers);
}

// Submits user answers to database
function submitQuestionnaire(answers) {
	$.ajax({
		url: '/api/sendAnswers',
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify({answers: answers}),
		success: function(response) {	
			// If submitting the full playlist, then displays a thank you message and button for FB dialog
			if ($(".all-question").length > 0) {
				$("#questionnaire-top-text").remove();
				$(".display-table-cell").html("Thank You! We also encourage you to invite your friends to <br/>participate in this study as well by clicking the button below!<br/>" + 
					"<br/><input type ='button' id = 'invite-friends' class = 'custom-button clickable' value = 'Finish'/>")
			} else {
				// Otherwise, gets full playlist
				var questionnaireName = d3.selectAll(".question-selector-circle").data()[0].questionnaire;
				getAllQuestions(questionnaireName);
			}
		}
	});
}

// Adds the slider for if they've heard song before
function addMusicKnowledge() {
	$("iframe").after("<div id = 'importance-section'><div class = 'font-black importance-header'>Have you heard this song before?</div></div>");
	$("#importance-section").append("<input type = 'range' name='1' min='0' max='100'><ul id = 'importance-list' class = 'no-list font-15'></ul>");
	$("#importance-list").append("<li class = 'inline-block center'>Never <br/>Heard It</li>");
	$("#importance-list").append("<li class = 'inline-block center'>Sounds <br/>Familiar</li>");
	$("#importance-list").append("<li class = 'inline-block center'>Know of This<br/>Song or Artist</li>");
	$("#importance-list").append("<li class = 'inline-block center'>Know of This Song<br/>or Artist Very Well</li>");	
	$("#importance-list li").width("25%");
}

// Adds slider for playlist songs (displays differently)
function addMusicKnowledge2() {
	$("#importance-section").remove();
	$("iframe").after("<div id = 'importance-section' class = 'importance-section-2'><div class = 'font-black importance-header'>Have you heard this song before?</div></div>");
	$("#importance-section").append("<input type = 'range' name='1' min='0' max='100' class = 'importance-range-2'><ul id = 'importance-list' class = 'no-list font-15 importance-list-2'></ul>");
	$("#importance-list").append("<li class = 'inline-block center'>Never <br/>Heard It</li>");
	$("#importance-list").append("<li class = 'inline-block center'>Sounds <br/>Familiar</li>");
	$("#importance-list").append("<li class = 'inline-block center'>Know of This<br/>Song or Artist</li>");
	$("#importance-list").append("<li class = 'inline-block center'>Know of This Song<br/>or Artist Very Well</li>");	
	$("#importance-list li").width("25%");
	$("#importance-list li").css("vertical-align", "top");
	$("#importance-list li").css("border-bottom", "none");
}
