module.exports = {
  host: 'localhost',
  port: 1234,
  secret: 'iloveacuniversity',
  tokenExpiration: 60*24,
  issuer: 'ACUniversity',
  mongo: {
	  //uri: 'mongodb://labadmin:labpass@ds061787.mongolab.com:61787/acuniversity_test1',
    uri: 'mongodb://admin:root@ds047692.mongolab.com:47692/acuniversity',
    //uri: 'localhost:27017/acuniversity',
	  options: {
		  db: {
			safe: true
		  }		  
	  }
  }
};