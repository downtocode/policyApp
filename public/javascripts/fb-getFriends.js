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

	getUserInfo(accessToken);

	//getUserInfo(accessToken, function(response2) {
		//console.log(response2);
		getFriendsMusic(accessToken, function(response) {
			console.log('here');
		});
	//});

	$(document).on("click", ".question-selector-circle", function() {
		var song = d3.select(this).data();
		$('.question-selector-circle.selected').removeClass('selected');
		$(this).addClass('selected');
		$("iframe").attr('src', song[0].top_track.preview_url);
		$("#preview-album img").attr('src', song[0].top_track.album.images[0].url);
		$("#question-text").empty();
		$("#question-text").html("<span class = 'font-black'>" + song[0].name + ": </span><span class = 'font-grey'>" + song[0].song + "</span>");
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

});

function getUserInfo(accessToken) {
	var accessToken = accessToken2;
	var url = 'https://graph.facebook.com/me';
	console.log(accessToken);
	$.ajax({
		url: url,
		data: {access_token: accessToken},
		dataType: "JSON",
		success: function(response) {
			console.log(response);
			user = response;
		}
	});
}

function getFriendsMusic(accessToken, callback) {
	var accessToken = accessToken2;
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
			if (response.error != undefined) {
				document.cookie = 'fb_access=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
				window.location.href = '/login/music';
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

function getUserInfo(artists) {
	for (var artist in artists) {

	}
}

