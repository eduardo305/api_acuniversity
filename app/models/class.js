// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Class', new Schema({
	name: String,
	course: [{
		type: Schema.Types.ObjectId,
		ref: 'Course'
	}],
	limit: Number,
	available: Boolean,
	startdate: {type: Date, default: Date.now},
    enddate: {type: Date, default: Date.now},
}));