// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
	name: String,
	password: { type: String, select: true },
	email: String,
	admin: Boolean,
	classrooms: [{
		type: Schema.Types.ObjectId,
		ref: 'Class'
	}],
    google: {
        id: { type: String, select: false },
        token: { type: String, select: false },
        email: String,
        name: String,
        picture: String
    },
    approvals: [{
    	type: Schema.Types.ObjectId,
		ref: 'Class'
    }]
}));