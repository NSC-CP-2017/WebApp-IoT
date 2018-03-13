// dependencies
var express = require('express');
var https = require('https');
var http = require('http');
var fs = require("fs");
var path = require('path');
var favicon = require('serve-favicon');
var crypto = require('crypto');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passport = require('passport');
var passportLocalMongoose = require('passport-local-mongoose');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var multer = require('multer');
var flash = require('connect-flash');
var weatherCj = require('./weatherCronjob');
var upload = multer();
var randomstring = require("randomstring");
var nodemailer = require('nodemailer');
var async = require('async');
var compression = require('compression');
// create reusable transporter object using the default SMTP transport
var smtpConfig = {
  "service": "gmail", // X-Chnage
  "secure": true,   // X-Chnage
  auth: {
    user: 'moi.chula.platform@gmail.com', // X-Chnage
    pass: 'qwerty555' // X-Chnage
  }
};
var transporter = nodemailer.createTransport(smtpConfig);
var app = express();

//Middleware
app.use(favicon(path.join(__dirname, 'favicon.ico')))
app.set('views', __dirname + '/mypublic');
app.set('view engine', 'ejs');
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 } //1hour
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(compression());

//Schema
var Datas = require('./models/Datas');
var Projects = require('./models/Projects');
var Devices = require('./models/Devices');
var Risks = require('./models/Risks');
var Users = require('./models/Users');
var Weathers = require('./models/Weathers');
var Roads = require('./models/Roads');
var weather = require('./controllers/weather.controllers');
var location = require('./controllers/location.controllers');
////
var weatherCronJob = weatherCj();

var passport_config = require('./config/passport')(passport);

mongoose.connect('mongodb://localhost/IntelligentThings');

//Route
app.post('/login', passport.authenticate('local-login', {
  failureRedirect: '/',
}), function(req, res) {
  if (req.body.rememberme) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
  } else {
    req.session.cookie.expires = false; // Cookie expires at end of session
  }
  res.redirect('/');
});

app.post('/check-email', function(req, res) {
  Users.findOne({ email: req.body.email }, function(err, user) {
    if (user != null) {
      res.send(false);
    } else res.send(true);
  });
});

app.post('/register', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/',
  failureFlash: true
}));

app.post('/createproject', isLoggedIn, function(req, res) {
  var project = new Projects({
    name: req.body.pjname,
    desc: req.body.description,
    registrationDate: new Date(),
    owner: req.user._id,
    projectID: randomstring.generate(15),
    projectKey: randomstring.generate(15),
    projectSecret: randomstring.generate(15),
    devices: [],
    warningState: []
  });
  project.save(function(err) {
    if (err) {
      req.flash("message", "Error project has not been created!")
      res.redirect('/repository');
    } else {
      req.flash("message", "Project has been created!")
      res.redirect('/repository');
    }
  });
});

app.post('/createdevice', isLoggedIn, function(req, res) {
  var reqData = req.body;
  var device = new Devices()
  device.name = reqData.deviceName;
  device.owner = req.user._id;
  device.desc = reqData.desc;
  id = "" + device._id
  device.deviceID = id.substring(0, 7) + id.substring(19, 24);
  device.deviceKey = randomstring.generate(10);
  device.deviceSecret = randomstring.generate(10);
  device.online = false;
  device.lastOnline = "";
  device.data = {};
  device.lastData = [];
  //////create settings object
  settings = {};
  settings.lineColor = "Green";
  settings.wea = {};
  settings.geoW = {};
  settings.geoR = {};
  settings.wea.require = (reqData.weatherCheck == 'true') ? true : false;
  settings.geoW.require = (reqData.geoWaterCheck == 'true') ? true : false;
  settings.geoW.rad = (Number(reqData.geoWaterVal) >= 5) ? Number(reqData.geoWaterVal) : 5;
  settings.geoR.require = (reqData.geoRoadCheck == 'true') ? true : false;
  settings.geoR.rad = (Number(reqData.geoRoadVal) >= 5) ? Number(reqData.geoRoadVal) : 5;
  ///////
  device.settings = settings;
  device.save(function(err) {
    if (err) {
      req.flash("message", "Error device has not been created!")
      res.redirect('/repository');
      return;
    } else {
      req.flash("message", "Device has been created!");
      res.redirect('/repository');
    }
  });
});

app.post('/createrisk/:deviceid/:id', isLoggedIn, function(req, res) {
  var risk = new Risks();
  var reqname = req.body;
  risk.email = reqname.email;
  risk.subject = reqname.subject;
  risk.content = reqname.content;
  risk.phone = reqname.phone;
  valset = [];
  if (typeof(reqname.keyvalue) == Array) {
    for (var i = 0; i < reqname.keyvalue.length; i++) {
      var value = {}
      value.key = reqname.keyvalue[i];
      value.coef = (reqname.covalue[i].length != 0) ? reqname.covalue[i] : 0;
      // value.sq = (reqname.sqvalue[i].length != 0) ? reqname.sqvalue[i] : 0;
      valset.push(value);
    }
  } else {
    var value = {}
    value.key = reqname.keyvalue;
    value.coef = (reqname.covalue.length != 0) ? reqname.covalue : 0;
    // value.sq = (reqname.sqvalue.length != 0) ? reqname.sqvalue : 0;
    valset.push(value);
  }
  risk.valueSet = valset;
  risk.waterSet.coef = (reqname.cowater.length != 0) ? reqname.cowater : 0;
  // risk.waterSet.sq = (reqname.sqwater.length != 0) ? reqname.sqwater : 0;
  risk.roadSet.coef = (reqname.coroad.length != 0) ? reqname.coroad : 0;
  // risk.roadSet.sq = (reqname.sqroad.length != 0) ? reqname.sqroad : 0;
  risk.rainSet.coef = (reqname.corain.length != 0) ? reqname.corain : 0;
  // risk.rainSet.sq = (reqname.sqrain.length != 0) ? reqname.sqrain : 0;
  risk.humidSet.coef = (reqname.cohumid.length != 0) ? reqname.cohumid : 0;
  // risk.humidSet.sq = (reqname.sqhumid.length != 0) ? reqname.sqhumid : 0;
  risk.windSet.coef = (reqname.cowind.length != 0) ? reqname.cowind : 0;
  // risk.windSet.sq = (reqname.sqwind.length != 0) ? reqname.sqwind : 0;
  risk.tempSet.coef = (reqname.cotemp.length != 0) ? reqname.cotemp : 0;
  // risk.tempSet.sq = (reqname.sqtemp.length != 0) ? reqname.sqtemp : 0;
  risk.threshold = reqname.threshold;
  risk.createDate = Date.now();
  risk.deviceID = req.params.deviceid;
  risk.operation = reqname.operation;
  Devices.findOne({deviceID:req.params.deviceid},function(err,device){
    device.riskRule = risk;
    device.save();
    res.redirect('/device/' + req.params.deviceid);
  });
});

app.post('/editdevice/:deviceid/:id', isLoggedIn, function(req, res) {
  Devices.findOne({ deviceID: req.params.deviceid }, function(err, device) {
    if (device) {
      console.log("in the wae");
      var reqname = req.body;
      if (reqname.dename) device.name = reqname.dename;
      if (reqname.dedesc) device.desc = reqname.dedesc;
      var settings = {};
      settings.wea = {};
      settings.geoW = {};
      settings.geoR = {};
      settings.wea.require = (reqname.weatherCheck == 'true') ? true : false;
      settings.geoW.require = (reqname.geoWaterCheck == 'true') ? true : false;
      settings.geoR.require = (reqname.geoRoadCheck == 'true') ? true : false;
      if (reqname.geoWaterCheck) settings.geoW.rad = (Number(reqname.geoWaterVal) >= 5) ? Number(reqname.geoWaterVal) : 5;
      if (reqname.geoRoadCheck) settings.geoR.rad = (Number(reqname.geoRoadVal) >= 5) ? Number(reqname.geoRoadVal) : 5;
      if (reqname.lineColor) settings.lineColor = reqname.lineColor;
      device.settings = settings;
      device.save(function(err) {
        if (err) {
          req.flash("message", "Error, cannot save!")
          res.redirect('/device/' + req.params.deviceid);
        } else {
          req.flash("message", "Save successful!")
          res.redirect('/device/' + req.params.deviceid);
        }
      })
    }
  });
});

app.post('/forgotpassword', function(req, res) {
  Users.findOne({ email: req.body.email }).exec(function(err, user) {
    if (err || !user) {
      res.redirect('/');
    } else {
      var token = randomstring.generate();
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; ///1hour
      var mailOptions = {
        to: user.email,
        from: 'moi.chula.platform@demo.com',
        subject: 'reset password',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        if (err) {
          console.log(err);
          console.log("email has not been send");
        } else {
          console.log("email has been send");
        }
      });
      user.save(function(err) {
        res.redirect("/");
      });
    }
  });
});

app.post("/resetpassword/:userid", function(req, res) {
  Users.findOne({ _id: req.params.userid }, function(err, user) {
    if (err || !user) {
      req.flash('message', 'Reset password error , please contact the admin');
      res.redirect("/account");
    } else {
      var pass = req.body.pass;
      var newPass = req.body.newpass;
      if (pass !== newPass) {
        req.flash('message', 'Password did not match');
        res.redirect("/account");
        return;
      } else if (pass.length <= 5) {
        req.flash('message', 'Password must have at least 8 words');
        res.redirect("/account");
        return;
      }
      user.userpassword = bcrypt.hashSync(newPass, bcrypt.genSaltSync(8), null);
      user.save(function(err) {
        if (err) {
          req.flash('message', 'Reset password error , please contact the admin');
          res.redirect("/account");
        } else {
          req.flash('message', 'You password has been reset !!');
          res.redirect("/account");
        }
      });
    }
  })
});

app.post('/project/:pid', function(req, res) {
  console.log(req.body);
  var path = "/project/" + req.params.pid;

  Projects.findOne({_id: req.params.pid}, function(err, project){
    if (err || !project) {
      req.flash('message', 'Project has not found.');
      res.redirect(path);
    } else {
      try {
        project.devices.forEach(function(deviceID) {
          console.log(deviceID);
          if (deviceID == req.body.deviceid) {
            throw e;
          }
        });
      } catch (e) {
        req.flash('message', 'This device has already been added');
        res.redirect(path);
        return;
      }
      if(project.devices && project.devices.length >= 4){
        req.flash('message', 'Project can have at most four devices');
        res.redirect(path);
        return;
      }
      project.devices.push(req.body.deviceid);
      project.save(function(err) {
        if (err) {
          req.flash('message', 'Error, please contact the admin for more information');
          res.redirect(path);
        } else {
          Devices.findOne({ deviceID: req.body.deviceid }, function(err, device) {
            if (err || !device) {
              req.flash('message', '' + req.body.deviceid + ' has not found.');
              res.redirect(path);
            } else if ('' + device.owner != '' + req.user._id) {
              req.flash('message', '' + req.body.deviceid + ' is not authorized.');
              res.redirect(path);
            } else {
              req.flash('message', '' + req.body.deviceid + ' has beed added to project');
              res.redirect(path);
            }
          });
        }
      });
    }
  });
});

app.get('/reset/device/:deviceid', function(req, res) {
  Devices.findOne({ _id: req.params.deviceid }, function(err, device) {
    if (err) {
      res.redirect("/repository");
    } else {
      device.deviceKey = randomstring.generate(10);
      device.deviceSecret = randomstring.generate(10);
      path = "/device/" + device.deviceID;
      device.save(function(err) {
        if (err) {
          res.redirect(path);
        } else {
          res.redirect(path);
        }
      });
    }
  });
});

app.get('/remove/device/:deviceid', function(req, res) {
  Risks.remove({ deviceID: req.params.deviceid }, function(err) {
    if (err) {
      res.redirect("/repository");
    } else {
      Devices.remove({ deviceID: req.params.deviceid }, function(err) {
        if (err) {
          res.redirect("/repository");
        } else {
          Projects.findOneAndUpdate({devices : req.params.deviceid},
            {$pull : {devices : req.params.deviceid}}, function(err){
            res.redirect("/repository");
          });
        }
      });
    }
  });
});

app.get('/remove/risk/:deviceid/:riskid', function(req, res) {
  Risks.remove({ _id: req.params.riskid }, function(err) {
    if (err) {
      res.redirect("/device/" + req.params.deviceid);
    } else {
      res.redirect("/device/" + req.params.deviceid);
    }
  })
});

app.get('/', function(req, res, next) {
  res.render('index', {
    user: req.user,
    isLoggedIn: req.isAuthenticated(),
    title: "Index",
    message: req.flash('loginMessage')[0]
  });
});

app.get('/logout', isLoggedIn, function(req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/phone',function(req, res, next) {
  res.render('phone',{
    title: "Phone",
    isLoggedIn: req.isAuthenticated(),
  })
});
app.get('/newproject',function(req, res, next) {
  res.render('newproject',{
    title: "newproject",
    isLoggedIn: req.isAuthenticated(),
  })
});

app.get('/repository', isLoggedIn, function(req, res) {
  Projects.find({ owner: req.user._id }).exec(function(err, projects) {
    Devices.find({ owner: req.user._id }).exec(function(err, devices) {
      if (err) {
        res.redirect('/repository');
        return
      }
      var message = req.flash("message")[0];
      res.render('repository', {
        user: req.user,
        isLoggedIn: req.isAuthenticated(),
        message: message,
        projects: projects,
        devices: devices,
        title: "Repository"
      });
    });

  });
});

app.get('/account', isLoggedIn, function(req, res) {
  res.render('account', {
    user: req.user,
    isLoggedIn: req.isAuthenticated(),
    title: "Account",
    message: req.flash('message')[0]
  });
});

app.get('/resetpassword', function(req, res) {
  res.render('resetPassword', {
    user: req.user,
    message: req.flash('message')[0],
    isLoggedIn: req.isAuthenticated(),
    title: "Reset password"
  });
});

app.get('/reset/:token', function(req, res) {
  Users.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('message', 'Password reset token is invalid or has expired.');
      return res.redirect('/resetpassword');
    }
    var newPassword = randomstring.generate();
    user.userpassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(8), null);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    var mailOptions = {
      to: user.email,
      from: 'moi.chula.platform@demo.com',
      subject: 'Your new password',
      text: 'Hello,\n\n' +
        'Your new password is ' + newPassword + '.\n'
    };
    transporter.sendMail(mailOptions, function(err) {
      if (err) {
        console.log(err);
        console.log("email has not been send");
      } else {
        console.log("email has been send");
      }
    });
    user.save(function(err) {
      req.flash('message', 'Reset password error , please contact the admin');
      res.redirect('/resetpassword');
    });
    req.flash('message', 'Your password has been reset!! \nplease see your email for the new password');
    res.redirect('/resetpassword');
  });
});

app.get('/project/:pjid', isLoggedIn, function(req, res) {
  Projects.findOne({ _id: req.params.pjid }, function(err, project) {
    if (err || !project) {
      res.redirect('/repository');
      return;
    }
    Devices.find({ owner: project.owner }, function(err, allDevices) {
      var devices = [];
      project.devices.forEach(function(deviceID) {
        allDevices.forEach(function(device) {
          if (deviceID == device.deviceID) {
            devices.push(device);
          }
        });
      });
      res.render('project', {
        user: req.user,
        project: project,
        devices: devices,
        allDevices: allDevices,
        message: req.flash('message')[0],
        isLoggedIn: req.isAuthenticated(),
        title: "Project"
      });
    });
  });
});

app.get('/device/:deviceid', isLoggedIn, function(req, res) {
  Devices.findOne({ deviceID: req.params.deviceid }, function(err, device) {
    Risks.find({ deviceID: req.params.deviceid }, function(err, risk) {
      if (err || !device) {
        res.redirect('/repository');
        return
      }
      res.render('device', {
        risks: risk,
        user: req.user,
        device: device,
        message: "",
        isLoggedIn: req.isAuthenticated(),
        title: "Device"
      });
    })

  });
});

app.get('/remove/project/:pid', function(req, res) {
  Projects.remove({ _id: req.params.pid }, function(err) {
    if (err) {
      res.redirect("/repository");
    } else {
      res.redirect("/repository");
    }
  });
});

app.get('/project/:pid/remove/:deviceid', function(req, res) {
  Projects.findOne({ _id: req.params.pid }, function(err, project) {
    if (!project || err) {
      req.flash('message', 'Project has not found');
      res.redirect("/repository");
    } else {
      var devices = [];
      for (var i = 0; i < project.devices.length; i++) {
        if (project.devices[i] !== req.params.deviceid) {
          devices.push(project.devices[i]);
        }
      }
      project.devices = devices;
      project.save(function(err) {
        if (err) {
          req.flash('message', 'save section error');
          res.redirect("/project/" + req.params.pid);
        } else {
          res.redirect("/project/" + req.params.pid);
        }
      });
    }
  });
});

app.get('/data/:deviceid', function(req, res) {
  Devices.findOne({ deviceID: req.params.deviceid }, function(err, device) {
    if (device) {
      res.json(device.data);
    } else {
      res.json({});
    }
  });
});

app.get('/alldata/line/:deviceid', function(req, res) {
  Datas.find({ deviceID: req.params.deviceid }).sort({ "timeStamp": 1 }).exec(function(err, datas) {
    if (datas) {
      var line = [];
      datas.forEach(function(data) {
        line.push([data.pos[0], data.pos[1]])
      });
      var resData = {
        "id": "route" + req.params.deviceid,
        "type": "line",
        "source": {
          "type": "geojson",
          "data": {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "LineString",
              "coordinates": line
            }
          }
        },
        "layout": {
          "line-join": "round",
          "line-cap": "round"
        },
        "paint": {
          "line-color": "red",
          "line-width": 3,
          "line-opacity": 0.75
        }
      }
      res.json({ "line": resData });
    } else {
      res.json({ "line": [] });
    }
  });
});


app.get('/alldata/value/:deviceid', function(req, res) {
  Datas.find({ deviceID: req.params.deviceid }).sort({ "timeStamp": 1 }).exec(function(err, datas) {
    if (datas.length != 0) {
      var respondData = {}
      if (datas.length > 1000) {
        datas.splice(0, datas.length - 1000);
      }
      respondData.keyValue = [];
      respondData.x = ['x'];
      Object.keys(datas[0].value).forEach(function(key) {
        respondData.keyValue.push(key);
        respondData[key] = [];
        respondData[key].push(key);
      });
      datas.forEach(function(data) {
        respondData.keyValue.forEach(function(key) {
          respondData[key].push(data.value[key]);
        });
        var d = new Date(data.timeStamp);
        respondData['x'].push(d.toISOString());
      });
      var col = []
      respondData.keyValue.forEach(function(key) {
        col.push(respondData[key]);
      });
      col.push(respondData.x);
      var graph = {
        bindto: '#chart' + req.params.deviceid,
        zoom: {
          enabled: false,
          rescale: false
        },
        data: {
          x: 'x',
          xFormat: '%Y-%m-%dT%H:%M:%S.%LZ',
          columns: col
        },
        axis: {
          x: {
            type: 'timeseries',
            tick: {
              count: col[0].length / (col[0].length / 8),
              rotate: 75,
              format: '%Y-%m-%d %H:%M:%S'
            }
          },
          lines: {
            front: false
          }
        },
        point: {
          show: false
        }
      }
      res.json(graph);
    } else {
      res.json({});
    }
  });
});

app.get('/demo',function(req,res){
  console.log(req.query);
  var query = req.query;
  var dArray = query.d.split(",");
  res.render('phone',{deviceID:dArray[0],
                      deviceKey:dArray[1],
                      deviceSecret:dArray[2]});
});

app.get('/alldata/show/:devicename/:deviceid', isLoggedIn, function(req, res) {
  Datas.find({ deviceID: req.params.deviceid }).exec({ timeStamp: 1 }, function(err, datas) {
    if (err) {
      res.redirect('/repository');
    }
    if (datas.length != 0) {
      var respondData = {}
      respondData.keyValue = [];
      respondData.x = ['x'];
      Object.keys(datas[0].value).forEach(function(key) {
        respondData.keyValue.push(key);
        respondData[key] = [];
        respondData[key].push(key);
      });
      datas.forEach(function(data) {
        respondData.keyValue.forEach(function(key) {
          respondData[key].push(data.value[key]);
        });
        var d = new Date(data.timeStamp);
        respondData['x'].push(d.toISOString());
      });
      var data = {};
      data.x = 'x';
      data.columns = [];
      data.columns.push(respondData['x']);
      for (let i = 0; i < respondData.keyValue.length; i++) {
        data.columns.push(respondData[respondData.keyValue[i]]);
      }
      res.render('allDataAndShow', {
        name: req.params.devicename,
        info: data,
        user: req.user,
        isLoggedIn: req.isAuthenticated(),
        title: "Show all data"
      });
    } else {
      req.flash('message', 'No data in the database');
      res.redirect('/repository');
    }
  });
});

app.get("/getdata/:deviceid",function(req,res,next){
  if(!req.isAuthenticated()) res.sendStatus(401).end();
  Datas.find({deviceID:req.params.deviceid}).sort({timeStamp:1}).exec(function(err,datas){
    if (datas.length != 0){
      console.log('check');
      var body = '\uFEFF'+'"timeStamp","lon","lat",'
      var keyValue = [];
      Object.keys(datas[0].value).forEach(function(key){
        keyValue.push(key);
        body += '"'+key+'",';
      });
      if(datas[0].weather){
        body += '"rain","temperature","humidity","wind"';
      }
      var value = []
      datas.forEach(function(data){
        var text = '"'+data.timeStamp+'","'+data.pos[0]+'","'+data.pos[1]+'"';
        keyValue.forEach(function(key){
          text += ',"'+data.value[key]+'"';
        });
        if (data.weather){
          text += ',"'+data.weather.rain+'","'+data.weather.temp+'","'+data.weather.humidity+'","'+data.weather.wind+'"'
        }
        value.push(text);
      });
      res.set('Content-Type', 'text/csv');
      res.set('charset', 'utf-8');
      res.set('Content-disposition', 'attachment; filename=data-'+req.params.deviceid+'.csv');
      body += "\n"+value.join('\n');
      res.send(body).end();
    }
    else{
      res.sendStatus(204).end();
    }
  })
});

app.get('/testweather', weather.testFetch);
app.get('/fetchweather', weather.fetchWeather);
app.get('/getweatherfromid', weather.getWeatherFromCityID);
app.get('/getlocation', location.getLocationTypeTest);
app.get('/testgetpixels', location.testGetPixels);
app.get('/location/test', function(req, res) {
  res.render('test', {});
});

function generateHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

// 404 not found
// app.use(function(req, res, next) {
//     var err = {status:404,message:"ERROR 404 Page Not Found"}
//     res.render('404', {
//         status:(err.status || 500),
//         message : err.message,
//         title:"Error "+(err.status || 500)+" - One Click IoT",
//         user : req.user,
//         isLoggedIn: req.isAuthenticated(),
//     });
// });

// var secureServer = https.createServer({
//   key: fs.readFileSync("../Broker-IoT/tls-key.pem"), // X-Chnage
//   cert: fs.readFileSync("../Broker-IoT/tls-cert.pem") // X-Chnage
// }, app).listen(3353, function() {
//   console.log('One Click IoT Web Application - HTTPS on ' + secureServer.address().port);
// });

var insecureServer = http.createServer(app).listen(3352, function() {
  console.log('One Click IoT Web Application - HTTP on ' + insecureServer.address().port);
})
