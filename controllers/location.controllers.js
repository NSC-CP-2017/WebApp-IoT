
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
