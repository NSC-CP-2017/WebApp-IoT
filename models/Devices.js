var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaDevices = new Schema({
    name : String,
    owner : Schema.ObjectId,
    deviceID: String,
    deviceKey: String,
    online: Boolean,
    lastOnine: Date,
    authorized: Boolean,
    position: Array,
    internalData : Array,
    externalData : Array
});
module.exports = mongoose.model('devices', schemaDevices);
