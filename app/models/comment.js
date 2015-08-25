// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Comment', new Schema({
	comment: String,
	date: {type: Date, default: Date.now},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	course: {
		type: Schema.Types.ObjectId,
		ref: 'Course'
	},
	available: { type: Boolean, default: false }
}));