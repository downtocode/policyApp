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

function statusChangeCallback(response) {
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    console.log(response);
    if (response.status === 'connected') {
    	// Logged into your app and Facebook.
    	console.log(response);
    	var d = new Date();
    	var expiresTime = response.authResponse.expires + d.getTime();
    	document.cookie = "fb_access=" + response.authResponse.accessToken + "=" + expiresTime;
    	window.location.href = '/home';
    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app.
      	document.getElementById('status').innerHTML = 'Please log into this app.';
    } else {
      // The person is not logged into Facebook, so we're not sure if
      // they are logged into this app or not.
      document.getElementById('status').innerHTML = 'Please log into Facebook.';
    }
}

function checkLoginState() {
    FB.getLoginStatus(function(response) {
    	statusChangeCallback(response);
    });
}