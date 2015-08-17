// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
var Course = require('./app/models/course'); // get our mongoose model
var Class  = require('./app/models/class'); // get our mongoose model
    
// =======================
// configuration =========
// =======================
var port = process.env.PORT || 1234; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

app.use(express.static(__dirname + '/public'));

// =======================
// routes ================
// =======================
// basic route
app.get('/', function(req, res) {
    //res.send('Hello! The API is at http://localhost:' + port + '/api');
    res.sendFile(__dirname + '/public/templates/index.html');
});

// Add headers
app.use(function (req, res, next) {

    /*// Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS, DELETE');

    // Request headers you wish to allow
    //res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-access-token');
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin, X-Requested-With, Content-Type, Accept, x-access-token');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();*/

    console.log(req.headers);

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Accept, X-api-key, X-auth-token, Content-Type, Content-Length, x-access-token');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Accept, X-api-key, X-auth-token, Content-Type, Content-Length, x-access-token');
        res.send(200, {});
    }
    else {
      next();
    }
});

// Route to login page
app.get('/login', function(req, res) {
  res.sendFile(__dirname + '/public/templates/login.html');
});

// Route to register a new user
app.post('/setup', function(req, res) {

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



// API ROUTES -------------------
// get an instance of the router for api routes
var apiRoutes = express.Router(); 

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
        var token = jwt.sign(user, app.get('superSecret'), {
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

apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
});




apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Welcome to the coolest API on earth!' });
});

/*apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  }).populate('courses');
});*/

// Fetch one specific user/student
apiRoutes.get('/users/:userid', function(req, res) {
  User.find({_id: req.params.userid}).populate('classrooms').exec(function(err, docs) {
    var options = {
      path: 'classrooms.course',
      model: 'Course'
    }

    if (err) throw err;

    User.populate(docs, options, function(err, users) {
      res.json(users);
    });
  });
});

// Fetch all users
apiRoutes.get('/users', function(req, res) {
  User.find().populate('classrooms').exec(function(err, docs) {
    var options = {
      path: 'classrooms.course',
      model: 'Course'
    }

    if (err) throw err;

    User.populate(docs, options, function(err, users) {
      res.json(users);
    });
  });
});

// Fetch one specific course
apiRoutes.get('/courses/:courseid', function(req, res) {
  Course.find({_id: req.params.courseid}, function(err, course) {
    res.json({success: true, course: course});
  }).populate('hosts', '-password -admin -courses -classrooms').populate('classes');
});

// Fetch all courses
apiRoutes.get('/courses', function(req, res) {
  Course.find({}, function(err, courses) {
    res.json({success: true, courses: courses});
  }).populate('hosts', '-password -admin -courses').populate('classes');
});

/*apiRoutes.get('/courses', function(req, res) {
  Course.find().populate('hosts', '-password -admin').populate('classes').exec(function(err, docs) {

    var options = {
      path: 'classes.course',
      model: 'Course'
    }

    Course.populate(docs, options, function(err, courses) {
      res.json(courses);  
    });
  });
});*/

// Fetch all students from a specific classroom
apiRoutes.get('/students/:classroomid', function(req, res) {
  User.find({classrooms: req.params.classroomid}, function(err, users) {
    res.json(users);
  }).select('-admin -password');
});

// Register/Unregister in a course
apiRoutes.put('/register/:userid', function(req, res) {
  User.findOne({
    _id: req.params.userid
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
apiRoutes.put('/quit/:userid', function(req, res) {
  User.findOne({
    _id: req.params.userid
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


// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);