var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaDevices = new Schema({
<<<<<<< HEAD
    name : String,
    owner : Schema.ObjectId,
    deviceID: String,
    deviceKey: String,
    deviceSecret: String,
    online: Boolean,
    lastOnline: Date,
    weather: Object,
    lastData: Array,
    riskRule: Object,
    forecastWeather: Object,
    features : Array,
    lastUpdateWeather : Date,
    lastUpdateFeatures : Date,
    data : Object,
    desc : String,
    settings : Object
=======
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
>>>>>>> origin/master
});
module.exports = mongoose.model('devices', schemaDevices);
