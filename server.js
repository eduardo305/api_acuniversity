// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var config      = require('./config');
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var jwt      	= require('jsonwebtoken'); // used to create, sign, and verify tokens

var User     	= require('./app/models/user'); // get our mongoose model
var Course   	= require('./app/models/course'); // get our mongoose model
var Class    	= require('./app/models/class'); // get our mongoose model
var Comment    	= require('./app/models/comment'); // get our mongoose model
var auth 		= require('./app/routes/auth');


// =======================
// configuration =========
// =======================
mongoose.connect(config.mongo.uri, config.mongo.options);

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
    res.sendFile(__dirname + '/public/templates/index.html');
});

// Add headers
app.use(function (req, res, next) {

    // Website we wish to allow to connect
    res.header('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');

    // Request headers we wish to allow
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

require('./app/routes/userRoutes.js')(app, User, Course);
require('./app/routes/courseRoutes.js')(app, Course, Class);
require('./app/routes/commentRoutes.js')(app, Course, Comment);





// =======================
// start the server ======
// =======================
app.listen(config.port);
console.log('Magic happens at http://localhost:' + config.port);