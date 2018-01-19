var request = require("request");
var PNG = require('png-js');
var getPixels = require("get-pixels")
var mapboxKey = require("../secrets/mapboxKey");

exports.getLocationTypeTest = function(req, res){
  if(req.query.lat && req.query.lon){
      if(req.query.lat == req.query.lon){
        res.status(200).json({type : "water"});
      }
      else{
        res.status(200).json({type : "normal"});
      }
  }
  else{
    res.status(400).json({msg : "invalid format"});
  }
};


exports.testGetPixels = function(req, res){
  var url = 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/static/0,0,1/1x1@2x?access_token='+mapboxKey.appid;
  var pix;
  getPixels(url, function(err, pixels) {
      if(err) {
        console.log("Bad image path");
        res.status(500).json({msg : "error"});
        return;
      }
      console.log("got pixels", pixels);
      res.status(200).json({msg : "done", data : pixels});
      return;
  });
};
