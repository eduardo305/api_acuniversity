var jwt      	= require('jsonwebtoken'); // used to create, sign, and verify tokens
var jwtauth 	= require('./auth');
var config      = require('../../config');

var express     = require('express');
var apiRoutes 	= express.Router();

module.exports = function(app, User, Course) {

	// route to authenticate a user (POST http://localhost:8080/api/authenticate)
	apiRoutes.post('/authenticate', function(req, res) {

	  // find the user
	  User.findOne({
	    email: req.body.email
	  }, function(err, user) {

	    if (err) throw err;

	    if (!user) {
	      res.json({ success: false, message: 'Authentication failed. User not found.' });
	    } else if (user) {

	      // check if password matches
	      if (user.password != req.body.password) {
	        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
	      } else {

	        // if user is found and password is right
	        // create a token
	        var token = jwt.sign(user, /*app.get('secret')*/config.secret, {
	          expiresInMinutes: 1440 // expires in 24 hours
	        });

	        user.password = '';

	        // return the information including token as JSON
	        res.json({
	          success: true,
	          message: 'Enjoy your token!',
	          user: user,
	          token: token
	        });
	      }   
	    }
	  });
	});

	// Route to register a new user
	apiRoutes.post('/setup', function(req, res) {

	    User.findOne({
	        email: req.body.email
	    }, function(err, user) {
	        if (err) throw err;

	        if (!user) {

	          var user = new User({
	            name: req.body.name,
	            email: req.body.email,
	            password: req.body.password,
	            admin: false
	        });

	            user.save(function(err) {
	              if (err) throw err;
	              console.log('User saved successfully');
	              user.password = '';
	              res.json({
	                success: true,
	                user: user
	              });
	            });
	        } else {
	            res.json({
	                success: false,
	                message: 'User already exists!'
	            })
	        }
	    });
	});

	// Fetch all (full) users
	apiRoutes.get('/users', jwtauth.isAuthenticated, function(req, res) {

		User.find().select('-password').populate('classrooms approvals').exec(function(err, docs) {
			var options = {
	          path: 'classrooms.course approvals.course',
	          model: 'Course'
	        }

	        if (err) throw err;

	        User.populate(docs, options, function(err, users) {
	          res.json({ success: true, users: users });
	        });

		});
	});

	// Fetch user by it's email account
	apiRoutes.get('/users/:email', jwtauth.isAuthenticated, function(req, res) {

		User.find({email: req.params.email + '@avenuecode.com'}).select('-password').populate('classrooms approvals').exec(function(err, docs) {
			var options = {
	          path: 'classrooms.course approvals.course',
	          model: 'Course'
	        }

	        if (err) throw err;

	        User.populate(docs, options, function(err, user) {
	          res.json({ success: true, user: user });
	        });
		});
	});

	// Fetch a user's certificates by e-mail user
	// The e-mail needs to be sent without the domain (@avenuecode.com)
	apiRoutes.get('/users/certificates/:email', jwtauth.isAuthenticated, function(req, res) {

		User.find({email: req.params.email + '@avenuecode.com'}).populate('approvals').select('-classrooms -admin -__v -_id -name -email -password').exec(function(err, docs) {

			var options = {
	          path: 'approvals.course',
	          model: 'Course'
	        }

	        if (err) throw err;

	        User.populate(docs, options, function(err, certificates) {
	        	res.json({success: true, certificates: certificates});
	        });
		});

	});

	// Approve a student by updating his approval array with the new
	// classroom/course he got approval
	apiRoutes.put('/users/approvals/:email', jwtauth.isAuthenticated, function(req, res) {
		User.findOne({
			email: req.params.email + '@avenuecode.com'
		}, function(err, user) {
			if (err) throw err;

			if (!user) {
				res.json({success: false, message: 'user not found...'});
			} else {
				if (user.approvals.toString().indexOf(req.body.classroomid) === -1) {
					user.approvals.push(req.body.classroomid);

					user.save(function(err) {
						if (err) throw err;

						res.json({success: true, user: user});
					});

				} else {
					res.json({success: false, message: 'user already has this certificate'});
				}
			}
		}).select('-password');
	});

	// Fetch all students from a specific classroom
	apiRoutes.get('/students/:classroomid', function(req, res) {
	  User.find({classrooms: req.params.classroomid}, function(err, users) {
	    res.json(users);
	  }).select('-admin -password');
	});

	// Register/Unregister in a course
	apiRoutes.put('/register/:email', jwtauth.isAuthenticated, function(req, res) {
	  User.findOne({
	    email: req.params.email + '@avenuecode.com'
	  }, function(err, user) {
	    if (err) throw err;

	    if (!user) {
	      res.json({ success: false, message: 'Register failed. User not found.' });
	    } else {

	      if (user.classrooms.toString().indexOf(req.body.classrooms) === -1) {
	        user.classrooms.push(req.body.classrooms);

	        user.save(function(err) {
	            if (err) throw err;

	            user.password = '';
	            console.log('Registered successfully');
	            res.json({ success: true, user: user });
	        });
	      } else {
	        res.json({ success: false, message: 'You are already registered!' });
	      } 
	      
	    }
	  });
	});

	// Register/Unregister in a course
	apiRoutes.put('/quit/:email', jwtauth.isAuthenticated, function(req, res) {
	  User.findOne({
	    email: req.params.email + '@avenuecode.com'
	  }, function(err, user) {
	    var elementIndex = -1;

	    if (err) throw err;

	    if (!user) {
	      res.json({ success: false, message: 'Register failed. User not found.' });
	    } else {
	      if (user.classrooms.toString().indexOf(req.body.classrooms) !== -1) {

	        user.classrooms.splice(user.classrooms.indexOf(req.body.classrooms), 1);

	        user.save(function(err) {
	            if (err) throw err;

	            User.findOne({_id: user._id}).populate('classrooms').exec(function (err, docs) {
	              var options = {
	                path: 'classrooms.course',
	                model: 'Course'
	              }

	              Course.populate(docs, options, function(err, courses) {
	                res.json({status: 'success', user: courses});  
	              });

	            });
	        });

	      } else {
	        res.json({ success: false, message: 'You are not registered!' });
	      } 
	      
	    }
	  });
	});

	app.use('/api', apiRoutes);
}