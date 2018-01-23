var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaData = new Schema({
    deviceID: String,
    pos: Array, // [lat,lon]
    value: Object,
    timeStamp: Number,
    weather: Object,
    forcastWeather: Object,
    features: Array
});
module.exports = mongoose.model('data', schemaData);
