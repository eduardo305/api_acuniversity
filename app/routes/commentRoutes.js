var jwtauth = require('./auth');

var express     = require('express');
var apiRoutes = express.Router();

module.exports = function(app, Course, Comment) {

	// Fetch all comments from a specific course
	apiRoutes.get('/comments/:courseid', function(req, res) {
	  Comment.find({course: req.params.courseid}, function(err, comments) {
	    res.json(comments);
	  }).sort({date: 'desc'}).select('-user');
	});

	// Post a comment to a specific course
	apiRoutes.post('/comments/:courseid', jwtauth.isAuthenticated, function(req, res) {
	  Course.findOne({
	    _id: req.params.courseid
	  }, function(err, course) {
	    if (err) throw err;

	    if (!course) {
	      res.json({ success: false, message: 'Comment failed. Course not found.' });
	    } else {
	      var comment = new Comment({
	        comment: req.body.comment,
	        user: req.body.user,
	        course: req.params.courseid
	      });

	      comment.save(function(err) {
	        if (err) throw err;

	        res.json({success: true, comment: comment});
	      });
	    }
	  });
	});

	app.use('/api', apiRoutes);
};