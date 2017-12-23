var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaWeather = new Schema({
  city : String,
  city_id : Number,
  lat : Number,
  lon : Number,
  dt : Number,
  temp : Number,
  humidity : Number,
  weather : [],
  rain : Number,
  wind : Number
});
module.exports = mongoose.model('weather', schemaWeather);
