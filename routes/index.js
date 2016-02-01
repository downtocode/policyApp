//////////////////////////////////////////////////////////////
// This file is for basic routing information (directing 	//
// to the correct page and returning necessary information	//
// upon receiving the URL request.							//
//////////////////////////////////////////////////////////////

var express = require('express');
var router = express.Router();

// Capitalize word (ie. policy -> Policy)
function capitalize(str) {
	var arr = str.split(" ");
	var strCap = "";
	for (var i in arr) {
		strCap += arr[i].charAt(0).toUpperCase() + arr[i].substring(1, arr[i].length) + " ";
	}

	return strCap.trim();
}

// Loads home page with appropriate questions retrieved from database
// Can either be for admin page or question page
router.get('/home/:name/:fid?', function(req, res, next) {
	// Get parameters if they have
	// :name means there is a name variable for which questionnaire
	// :fid means there is a value for a friend ID so we can add connection to backend
	// :fid? with question mark means fid is optional 
	// ie. /music or /music/12345667
	var db = req.db;
	var name = req.params.name;
	var limit = {};

	// If admin, then simply render HTML page
	if (name.toLowerCase() === "admin") {
		res.render(name + 'Home');
	} else { // Otherwise is a question page so fetch questions
		var questionnaire = name.replace(/-/g, " ").toLowerCase();

		// Limit to 15 main questions
		limit.limit = 15;
		var query = {
			questionnaire: questionnaire
		};

		if (name.toLowerCase() === "music") {
			query.main = 1;
		}

		db.questions.find(query, {}, limit, function(err, questions) {
			// Questions are returned in variable questions
			questionnaire = capitalize(questionnaire);

			// If music questionnaire, then return information as is
			if (name.toLowerCase() === "music")
				res.render(name + 'Home', {
					questions: questions,
					title: questionnaire,
					name: name
				});
			else { // Otherwise if policy, also get coefficients to later calculate identity treatments
				db.coefficients.find({
					name: "coefficients"
				}, {
					type: 1
				}, function(err, coeffs) {
					var hasIdentity = [];
					for (var k in coeffs) {
						hasIdentity.push(coeffs[k].type); // this becomes an array with the titles of all question which have coeffitients for identity.
					}
					res.render('questions', {
						questions: questions,
						title: questionnaire,
						name: name,
						hasIdentity: hasIdentity
					});
				});
			}

		});
	}
});

// Loads login page and contains information for the FB metadata 
// (what shows up when invite friends dialog is displayed)
router.get('/login/:name/:fid?', function(req, res, next) {
	var name = capitalize(req.params.name);
	var questionnaire = capitalize(name.replace(/-/g, " ").toLowerCase());

	if (name.toLowerCase() === 'admin')
		res.render('adminLogin');
	else {
		if (name.toLowerCase() === 'music') {
			var desc = "Discover, rate and follow great music. Would you like to volunteer in our study about music taste? ";
			var meta_title = "Music Taste";
		} else if (name.toLowerCase() === 'policy') {
			var desc = "Find out statistics about American’s stands on controversial policies while participating on our survey study.";
			var meta_title = "Controversial Policies in America?";
		}

		res.render('questionsLogin', {
			name: name,
			meta_title: meta_title,
			meta_name: meta_title,
			meta_url: "http://localhost:5000/login/" + name.toLowerCase() + "/" + req.params.fid,
			meta_desc: desc
		});
	}
});

router.get('/createQuestionnaire', function(req, res, next) {
	res.render('createQuestions');
});

// Gets references from questions for reference page
router.get('/references', function(req, res, next) {
	var db = req.db;

	db.questions.find({
		questionnaire: 'policy'
	}, {
		reference_global: 1,
		reference_status: 1
	}, function(err, references) {
		res.render('references', {
			references: references
		});
	});
});

// Default page is questions login
// Page that loads when URL doesn't have any specific data
router.get('/', function(req, res, next) {
	res.render('questionsLogin', {
		name: 'policy'
	});
});

router.post('/', function(req, res) {
	res.redirect('/');
});

router.post('*', function(req, res) {
	res.redirect('/');
});

router.get('*', function(req, res, next) {
	res.render('questionsLogin', {
		name: 'policy'
	});
});


module.exports = router;