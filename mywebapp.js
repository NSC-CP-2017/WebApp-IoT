// dependencies
var express = require('express');
var https = require('https');
var http = require('http');
var fs = require("fs");
var path = require('path');
//var favicon = require('serve-favicon');
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
// create reusable transporter object using the default SMTP transport
var smtpConfig = {
    "service": "gmail",    // X-Chnage
    //"secure": true,   // X-Chnage
    auth: {
        user: 'moi.chula.platform@gmail.com',     // X-Chnage
        pass: 'qwerty555'      // X-Chnage
    }
};
var transporter = nodemailer.createTransport(smtpConfig);
var app = express();

//Middleware
//app.use(favicon(__dirname + '/mypublic/favicon.ico'));
app.set('views', __dirname+'/mypublic');
app.set('view engine', 'ejs');
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 60 * 60 * 1000} //1hour
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//Schema
var Data = require('./models/Data');
var Projects = require('./models/Projects');
var Devices = require('./models/Devices');
var Users = require('./models/Users');
var Weather = require('./models/Weather');
var weather = require('./controllers/weather.controllers');
var weatherCronJob = weatherCj();

var passport_config = require('./config/passport');
require('./config/passport')(passport);

mongoose.connect('mongodb://localhost/IntelligentThings');

//Route
app.post('/login',passport.authenticate('local-login', {
    failureRedirect : '/',
}),function(req,res){
    if (req.body.rememberme) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
    }
    else {
        req.session.cookie.expires = false; // Cookie expires at end of session
    }
    res.redirect('/');
});

app.post('/check-email',function(req,res){
    Users.findOne({email:req.body.email},function(err,user){
        if (user != null){
            res.send(false);
        }
        else res.send(true);
    });
});

app.post('/register', passport.authenticate('local-signup', {
  successRedirect : '/',
  failureRedirect : '/',
  failureFlash : true
}));

app.post('/createproject',isLoggedIn,function(req, res){
    var project = new Projects({name: req.body.pjname,
                                desc: req.body.description,
                                registrationDate : new Date(),
                                owner: req.user._id,
                                device: [],
                                warningState:[]});
    project.save(function(err){
        if (err) {
            req.flash("message","Error project has not been created!")
            res.redirect('/repository');
        }
        else {
            req.flash("message","Project has been created!")
            res.redirect('/repository');
        }
    });
});

var id=1000000000;
app.post('/createdevice',isLoggedIn,function(req,res){
    var device = new Devices()
    device.name = req.body.deviceName;
    device.owner = req.user._id;
    device.deviceID = id+1;
    id = id+1;
    device.deviceKey = randomstring.generate(10);
    device.deviceSecret = randomstring.generate(10);
    device.online = false;
    device.lastOnine = new Date();
    joinData = []
    if (req.body.weatherData) joinData.push('weatherData');
    if (req.body.temperatureData) joinData.push('temperatureData');
    if (req.body.humidityData) joinData.push('humidityData');
    if (req.body.placesData) joinData.push('placesData');
    device.joinData = joinData;
    device.position = []
    device.data = []
    device.save(function(err){
        if (err) {
            req.flash("message","Error device has not been created!")
            res.redirect('/repository');
        }
        else {
            req.flash("message","Device has been created!")
            res.redirect('/repository');
        }
    });
});

app.post('/forgotpassword',function(req, res){
    Users.findOne({email:req.body.email}).exec(function(err,user){
        if(err || !user){
            res.redirect('/');
        }
        else{
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
                if (err){
                    console.log(err);
                    console.log("email has not been send");
                }
                else{
                    console.log("email has been send");
                }
            });
            user.save(function(err) {
                res.redirect("/");
            });
        }
    });
});

app.get('/reset/device/:deviceid',function(req, res){
    Devices.findOne({_id:req.params.deviceid},function(err,device){
        if (err){
            res.redirect("/repository");
        }
        else{
            device.deviceKey = randomstring.generate(10);
            device.deviceSecret = randomstring.generate(10);
            path =  "/device/"+req.params.deviceid;
            device.save(function(err){
                if (err){
                    res.redirect(path);
                }
                else{
                    res.redirect(path);
                }
            });
        }
    });
});

app.get('/remove/device/:deviceid',function(req, res){
    Devices.remove({_id:req.params.deviceid},function(err){
        if (err){
            res.redirect("/repository");
        }
        else{
            res.redirect("/repository");
        }
    });
});

app.get('/', function (req, res, next) {
    console.log(req.body.rememberme);
    res.render('index',{
        user : req.user,
        isLoggedIn : req.isAuthenticated(),
        title : "Index",
        logInMessage : req.flash('loginMessage')[0]
    });
});

app.get('/logout',isLoggedIn ,function(req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/repository',isLoggedIn ,function(req, res) {
    Projects.find({owner:req.user._id}).exec(function(err,projects){
        if (err) {
            return next(err);
        }
        Devices.find({owner:req.user._id}).exec(function(err,devices){
            console.log(devices);
            if (err) {
                return next(err);
            }
            console.log(devices);
            var message = req.flash("message")[0];
            res.render('repository',{
                user : req.user,
                isLoggedIn : req.isAuthenticated(),
                message : message,
                projects : projects,
                devices : devices,
                title : "Repository"
            });
        });
    });
});

app.get('/account',isLoggedIn ,function(req, res) {
    res.render('account',{
        user : req.user,
        isLoggedIn : req.isAuthenticated(),
        title : "Account"
    });
});

app.get('/resetpassword',function(req, res) {
    res.render('resetPassword',{
        user : req.user,
        message : req.flash('message')[0],
        isLoggedIn : req.isAuthenticated(),
        title : "Reset password"
    });
});

app.get('/reset/:token', function(req, res) {
    Users.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
            req.flash('message', 'Password reset token is invalid or has expired.');
            return res.redirect('/resetpassword');
        }
        var newPassword = randomstring.generate();
        user.userpassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(8), null);;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        var mailOptions = {
            to: user.email,
            from: 'moi.chula.platform@demo.com',
            subject: 'Your new password',
            text: 'Hello,\n\n' +
            'Your new password is '+ newPassword +'.\n'
        };
        transporter.sendMail(mailOptions, function(err) {
            if (err){
                console.log(err);
                console.log("email has not been send");
            }
            else{
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

app.get('/project/:pjid',isLoggedIn,function(req,res){
    Projects.findOne({_id:req.params.pjid},function(err,project){
        if(!project){
            res.redirect('/repository');
        }
        res.render('project',{
            user : req.user,
            project : project,
            message : "",
            isLoggedIn : req.isAuthenticated(),
            title : "Project"
        });
    });
});

app.get('/device/:deviceid',isLoggedIn,function(req,res){
    Devices.findOne({_id:req.params.deviceid},function(err,device){
        if(err || !device){
            res.redirect('/repository');
        }
        res.render('device',{
            user : req.user,
            device : device,
            message : "",
            isLoggedIn : req.isAuthenticated(),
            title : "Project"
        });
    });
});

app.get('/testweather', weather.testFetch);
app.get('/fetchweather', weather.fetchWeather);
app.get('/getweatherfromid', weather.getWeatherFromCityID);

function generateHash(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
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

var secureServer = https.createServer({
    key: fs.readFileSync(__dirname + '/ssl.key'),    // X-Chnage
    cert: fs.readFileSync(__dirname + '/ssl.cert')   // X-Chnage
}, app).listen(3353, function () {
    console.log('One Click IoT Web Application - HTTPS on ' + secureServer.address().port);
});

var insecureServer = http.createServer(app).listen(3352, function() {
    console.log('One Click IoT Web Application - HTTP on ' + insecureServer.address().port);
})
