var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaProjects = new Schema({
    name: String,
    projectID: String,
    desc: String,
    registrationDate: Date,
    devices: Array,
    functions : Array
});
module.exports = mongoose.model('projects', schemaProjects);
