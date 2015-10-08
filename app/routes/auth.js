var jwt      	= require('jsonwebtoken'); // used to create, sign, and verify tokens
var config      = require('../../config');

var Auth = function() {

	var verifyAuth = function(req) {
		// check header or url parameters or post parameters for token
	  	var token = req.body.token || req.query.token || req.headers['x-access-token'];

	  	// decode token
	  	if (token) {
	  		try {
	  			req.token = jwt.verify(token, config.secret, {/*issuer: config.issuer, */ignoreExpiration: false});
        		return true;
	  		} catch(err) {
	  			console.log('Request unauthorized. Error decoding token.');
        		return false;
	  		}
	  	} else {
	  		console.log('Request unauthorized. No token available.');
      		return false;
	  	}
	};

	this.isAuthenticated = function(request, response, next) {
		if (verifyAuth(request)) {
			next();
		} else {
			response.sendStatus(403);
		}
	};
};

module.exports = new Auth();

/*module.exports = function(apiRoutes, jwt, config) {

	apiRoutes.use(function(req, res, next) {

	  // check header or url parameters or post parameters for token
	  var token = req.body.token || req.query.token || req.headers['x-access-token'];

	  // decode token
	  if (token) {

	    // verifies secret and checks exp
	    jwt.verify(token, config.secret, function(err, decoded) {      
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
};*/

