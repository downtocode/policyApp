var user = {};

$(document).ready(function() {

  window.fbAsyncInit = function() {
  		FB.init({
    		appId      : '486648534724015',//'1561259110790451',
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

	var accessToken = getAccessToken();

	getUserInfo(accessToken);

	//getUserInfo(accessToken, function(response2) {
		//console.log(response2);
		getFriendsMusic(accessToken, function(response) {
			console.log('here');
		});
	//});

	$(document).on("click", ".song-preview", function() {
		var song = d3.select(this).data();
		$('.selected-song').removeClass('selected-song');
		$(this).addClass('selected-song');
		$("iframe").attr('src', song[0].top_track.preview_url);
		$("#preview-album img").attr('src', song[0].top_track.album.images[0].url);
		$("#preview-text").remove();
		$("#preview-album").append("<div id = 'preview-text'><span id = 'like-dislike'> [ <span id = 'like' class = 'clickable'>Like</span> | <span id = 'dislike' class = 'clickable'>Dislike</span> ] </span><p></p></div>");
	});

	$(document).on("click", "#like", function() {
		$("#preview-text p").text("You like this song!");
		/*d3.select('.selected-song').data(function(d, i) {
			console.log(d);
		});*/
	});

	$(document).on("click", "#dislike", function() {
		$("#preview-text p").text("You don't like this song...");
	});

});

function getAccessToken() {
	var cookies = document.cookie.split(";");
	var d = new Date();
	var n = d.getTime();
	var temp_cookie;
	for (var cookie in cookies) {
		temp_cookie = cookies[cookie].split("=");
		if (temp_cookie[0] == "fb_access") {
			return temp_cookie[1];
		}
	}

    document.cookie = "fb_access=0;expires=0;";
	window.location.href = 'index.html';
}

function getUserInfo(accessToken) {
	var accessToken = 'CAACEdEose0cBAKZBsBQTpEDXZBLtbADTxOCxnN7YG5KuhUmt82JB4IQISSlpZCWcLZCS913iHZBjh7vSL5rjKiZC3vyvLW5keHVo4dTxndaw0Kglff0pTZAVg3NGt89sI1SFLMkK5lBAqjXOpyikmrfMlFHL0ZClcWxvXZBHlORW4Rt87y5Uw3MWXulpSUN3JD8TsDdHJaocctZCZCkAw085K5GLmHUWZCTpnTQZD ';
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
	var accessToken = 'CAACEdEose0cBAKZBsBQTpEDXZBLtbADTxOCxnN7YG5KuhUmt82JB4IQISSlpZCWcLZCS913iHZBjh7vSL5rjKiZC3vyvLW5keHVo4dTxndaw0Kglff0pTZAVg3NGt89sI1SFLMkK5lBAqjXOpyikmrfMlFHL0ZClcWxvXZBHlORW4Rt87y5Uw3MWXulpSUN3JD8TsDdHJaocctZCZCkAw085K5GLmHUWZCTpnTQZD ';
    var artists = {};
    //url = '/me?fields=friends{music,name}&access_token='+accessToken;

    var url = 'https://graph.facebook.com/me?fields=friends{music,name}';
    //url = '/me/taggable_friends&access_token=' + accessToken;
    //url = 'https://graph.facebook.com/v2.3/me/taggable_friends?limit=1000';
    //console.log(accessToken);

    makeFriendAPICall(url, accessToken, artists, function(response) {
    	var count = 0;

		for (var i in artists) {
			var artist = artists[i];
			getArtistTopSong(artist.name, artists, i, function(artists) {
				count++;

				if (count == Object.keys(artists).length) {
					saveUserInfo(artists);
				}
			});
		}
		
	});
}

function makeFriendAPICall(url, accessToken, artists, callback) {
	$.ajax({
		url: url,
		data: {access_token: accessToken},
		dataType: "jsonp",
		success: function(response) {
			if (response.error != undefined) {
				window.location.href = 'index.html';
				document.cookie = "fb_access=0=0";
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

function getArtistTopSong(artistName, artists, i, callback) {
	var artistNameSearch = artistName.replace(/ /g, '%20');
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
							var artist = artists[i];
							artist.top_track = top_track.tracks[0];
							artist.song = top_track.tracks[0].name;
							artists[i] = artist;
						}

						callback(artists);
					}
				});
			} else {
				delete artists[i];
				callback(artists);
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
	var len = Math.floor(size / 10);
	var lens = [];

	for (var i = 0; i < size; i += len) {
		var rand = Math.floor(Math.random() * len) + i;
		lens.push(rand);
	}

	return lens;
}

function saveUserInfo(artists) {
	var artistsNumLiked = switchDictionaryAggregate(artists,"friends");
	var artistsDistribution = getArtistDistribution(artistsNumLiked);
	var randVals = getDistributionValues(artistsDistribution.length);
	var randArtists = [];

	for (var rand in randVals) {
		var currArtist;
		var count = randVals[rand];

		do {
			if (randVals.indexOf(count) < 0) randVals.push(count);
			currArtist = artistsDistribution[count];
			var rand = Math.floor(Math.random() * 15);
			var randPow = Math.floor(Math.random() * 2) + 1;
			var randNum = Math.pow(-1, randPow) * rand;
			count += randNum;
		} while (randVals.indexOf(count) > -1 || currArtist.song == undefined);

		randArtists.push(currArtist);
	}

	d3.select("#friend-list").selectAll("li")
		.data(randArtists)
		.enter()
		.append("li")
		.attr("class", "song-preview clickable")
		.attr("id", function(i) { return "song-" + i; })
		.html(function(d, i) { 
			return "<span class = 'font-orange'>" + d.name + ":</span> " + d.song; 
		});

	$("#song-box").append("<iframe src = '' id = 'preview-iframe'></iframe>");
	$("#song-box").append("<div id = 'preview-album'><img/><div id = 'preview-text'></div></div>");
}

function getUserInfo(artists) {
	for (var artist in artists) {

	}
}

