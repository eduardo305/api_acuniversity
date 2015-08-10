// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
	name: String,
	username: String,
	password: String,
	email: String,
	admin: Boolean,
	classrooms: [{
		type: Schema.Types.ObjectId,
		ref: 'Class'
	}]
}));