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

});

function statusChangeCallback(url, response) {
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
    	// Logged into your app and Facebook.
      var accessToken = response.authResponse.accessToken;

      $.ajax({
        url: 'https://graph.facebook.com/oauth/access_token',
        method: 'POST',
        data: {grant_type: 'fb_exchange_token', client_id: '486648534724015', client_secret: '2774e05ae31b641f9e23c29c70102536', fb_exchange_token: accessToken},
        success: function(response) {
          //var d = new Date();
          //var expiresTime = response.authResponse.expires + d.getTime();
          console.log(response.split("="));
          document.cookie = "fb_access=" + response.split("=")[1].split("&")[0] + ";expires=;path=/";
          window.location.href = url;
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

function checkLoginState(url) {
    FB.getLoginStatus(function(response) {
    	statusChangeCallback(url, response);
    });
}