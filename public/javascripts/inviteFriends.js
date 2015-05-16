$(document).ready(function() {
	getFriends();
	var user_friends;

	window.fbAsyncInit = function() {
		FB.init({
    		appId      : '486648534724015',// '150997527214'
    		cookie     : true,  // enable cookies to allow the server to access 
    		xfbml      : true,  // parse social plugins on this page
    		version    : 'v2.3' // use version 2.2
  		});
	};

	$(document).on("keyup", "#invite-search", function() {
		var search_value = $(this).val();
		d3.selectAll("#invite-friends-list li")
			.each(function(d, i) {
				if (d.name.toLowerCase().indexOf(search_value.toLowerCase()) < 0) {
					d3.select(this).attr("class", "hidden");
				} else {
					d3.select(this).attr("class", "inline-block");
				}
			});
	});

	$(document).on("click", "#invite-search", function() {
		var search_value = $(this).val();
		d3.selectAll("#invite-friends-list li")
			.each(function(d, i) {
				if (d.name.indexOf(search_value) < 0) {
					console.log(d3.select(this));
					d3.select(this).attr("class", "hidden");
				} else {
					d3.select(this).attr("class", "inline-block");
				}
			});
	});

	$(document).on("click", "#invite-friends-list li", function() {
		if ($(this).hasClass("selected-friend")) {
			$(this).removeClass("selected-friend");
			$(this).css("background-color", "transparent");
		} else {
			$(this).addClass("selected-friend");
			$(this).css("background-color", "rgba(150,150,150,.5)");			
		}
	});

	$(document).on("click", "#invite-button", function() {
		var id = d3.selectAll(".selected-friend").data()[0].id;
	});
});

function getFriends() {
	$.ajax({
		url: 'https://graph.facebook.com/me/invitable_friends',
		data: {access_token: accessToken},
		dataType: "jsonp",
		success: function(response) {
			user_friends = response.data;
			d3.select("#invite-friends-list")
				.selectAll("li")
				.data(user_friends)
				.enter()
				.append("li")
				.attr("class", "inline-block")
				.html(function(d, i) {
					return "<img src = '"+d.picture.data.url+"'/>"+d.name;
				});

			$("#invite-modal").append("<input type = 'button' class = 'custom-button clickable' id = 'invite-button' value = 'Invite!' />")
		}
	});
}

function inviteFriends() {
	FB.ui({
		method: 'send',
		link: 'https://stark-crag-5229.herokuapp.com',
	});
}







