var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaDevices = new Schema({
  name: String,
  owner: Schema.ObjectId,
  deviceID: String,
  deviceKey: String,
  deviceSecret: String,
  online: Boolean,
  lastOnline: Date,
  weather: Object,
  forecastWeather: Object,
  features: Array,
  lastUpdateWeather: Date,
  lastUpdateFeatures: Date,
  data: Object,
  desc: String,
  settings: Object,
  riskRule: Object
});
module.exports = mongoose.model('devices', schemaDevices);
