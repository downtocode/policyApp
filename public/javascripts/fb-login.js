//////////////////////////////////////////////////////////////
// This file handles the FB login feature so that we are 	//
// able to access the FB API calls.							//
//////////////////////////////////////////////////////////////

// var real_appId = '1724641247754857'; // for live
// var real_secret = 'ecc1220ee8ccd42a989eae6e35862bb9'; // for live
// var url_name = 'https://stark-crag-dev.herokuapp.com';
// var real_appId = '1729142133971435'; // for local
// var real_secret = 'cb7830bb2f2376e1d88b89645de92f0b'; // for local
// var url_name = 'http://localhost:5000'; 
var real_appId = process.env.LOCAL_APP_ID;
var real_secret = process.env.LOCAL_APP_SECRET;
var url_name = process.env.LOCAL_URI;

$(document).ready(function() {

	// Initializes the FB object using app details
	window.fbAsyncInit = function() {
		FB.init({
			appId      : real_appId,// '150997527214' // original:'486648534724015'
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


});

function statusChangeCallback(url, response) {
	// The response object is returned with a status field that lets the
	// app know the current login status of the person.
	// Full docs on the response object can be found in the documentation
	// for FB.getLoginStatus().
	if (response.status === 'connected') {
		// Logged into your app and Facebook.
		var accessToken = response.authResponse.accessToken;
		// original client secret: '2774e05ae31b641f9e23c29c70102536'
		$.ajax({
			url: 'https://graph.facebook.com/oauth/access_token',
			method: 'POST',
			data: {grant_type: 'fb_exchange_token', client_id: real_appId, client_secret: real_secret, fb_exchange_token: accessToken},
			success: function(response) {
				//var d = new Date(); 'cb7830bb2f2376e1d88b89645de92f0b'
				//var expiresTime = response.authResponse.expires + d.getTime();
				document.cookie = "fb_access=" + response.split("=")[1].split("&")[0] + ";expires=;path=/";

				/*$.ajax({
					url: 'https://graph.facebook.com/me',
					data: {access_token: accessToken},
					dataType: "jsonp",
					success: function(response) {
					  var loginUrl = url.split("/")[2];

					  var urlArray = window.location.href.split("/");
					  if (urlArray.length > 4) {
						$.ajax({
						  method: 'POST',
						  url: '/api/addFriend',
						  data: {userID: response.id, friendID: urlArray[urlArray.length - 2]}
						});
					  }

					  FB.ui({
						method: 'send',
						link: 'https://stark-crag-5229.herokuapp.com/login/'+loginUrl+'/'+response.id+'/'
					  }, function(response) {
						window.location.href = 'https://stark-crag-5229.herokuapp.com'+url;
					  });
					 }
				});*/


				window.location.href = url_name+url;
			}
		});
	} else if (response.status === 'not_authorized') {
	  // The person is logged into Facebook, but not your app.
		document.getElementById('status').innerHTML = 'Please log into this app.';
	} else {
	  // The person is not logged into Facebook, so we're not sure if
	  // they are logged into this app or not.
	  
	  document.getElementById('status').innerHTML = 'Please log into Facebook.';
	}
}

// Checks state of login so can make appropriate response
function checkLoginState(url) {
	console.log('callback url is: ' +url);
	FB.getLoginStatus(function(response) {
		console.log('login response: '+ response.status);
		statusChangeCallback(url, response);
	});
}

// Displays original modal of friends to invite (NOT USED)
function showModal(url) {
  $("body").prepend('<div id = "invite-modal-wrapper" class = "border-box display-table">'+
	  '<div class = "border-box display-table-cell full-width-height">'+
		'<div id = "invite-modal" class = "center">'+
		  'Please invite your friends to use the application!<br/>'+
		  '<input type = "search" results = "5" id = "invite-search">'+
		  '<div id = "invite-friends-section">'+
			'<ul id = "invite-friends-list" class = "list-style-none display-inline left">'+
			'</ul>'+
		  '</div>'+
		'</div>'+
	  '</div>'+
	'</div>');

  $("#invite-modal").append("<input type = 'button' class = 'custom-button clickable' id = 'invite-button' value = 'Invite!' />");
}





