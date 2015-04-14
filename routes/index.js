var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Log In' });
});

router.get('/home', function(req, res, next) {
  res.render('fbHome', { title: 'Home' });
});

module.exports = router;
