// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Course', new Schema({
	name: String,
	description: String,
	hosts: [{
		type: Schema.Types.ObjectId,
		ref: 'User'
	}],
	classes: [{
		type: Schema.Types.ObjectId,
		ref: 'Class'
	}]
}));