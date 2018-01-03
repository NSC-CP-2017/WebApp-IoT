var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaDevices = new Schema({
    name : String,
    owner : String,
    deviceID: String,
    deviceKey: String,
    deviceSecret: String,
    online: Boolean,
    lastOnine: Date,
    position: Array,
    internalData : Array,
    externalData : Array
});
module.exports = mongoose.model('devices', schemaDevices);
