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
var passportLocalMongoose = require('passport-local-mongoose');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var multer = require('multer');
var upload = multer();

var passport = require('./config/passport');
var passport = passport();

var nodemailer = require('nodemailer');
// create reusable transporter object using the default SMTP transport
var smtpConfig = {
    "host": "",       // X-Chnage
    "port": 465,      // X-Chnage
    "secure": true,   // X-Chnage
    auth: {
        user: '',     // X-Chnage
        pass: ''      // X-Chnage
    }
};
var transporter = nodemailer.createTransport(smtpConfig);

var app = express();

// view engine setup
//app.all('*', function(req, res, next){
//    if (req.secure && req.header("host") == 'iot-chula.com') {
//        return next();
//    };
//    res.redirect('https://iot-chula.com:443'+req.url);
//});

app.use(favicon(__dirname + '/public/favicon.ico'));
app.set('views', __dirname+'/mypublic');
app.set('view engine', 'ejs');
app.use('/assets', express.static(__dirname + '/public/assets'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

var schemaReacts = new Schema({
    sms: Boolean,
    phone: String,
    threshold: Number,
    status: Boolean,
    email: String,
    subject: String,
    message: String
});

var Data = require('./models/Data');
var Projects = require('./models/Projects');
var Devices = require('./models/Devices');
var Users = require('./models/Users');

passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());

mongoose.connect('mongodb://localhost/SmartIoT');

app.get('/', function (req, res, next) {
    res.render('index', {
        title: "One Click IoT - oneclickiot.com",
        isLoggedIn: req.isAuthenticated()
    });
});

app.get('/login', function(req, res) {
    if(req.isAuthenticated()) res.redirect('/account');
    var info = (typeof req.query.error !== 'undefined') ? 'อีเมล และ/หรือ รหัสผ่านไม่ถูกต้อง':'';
    res.render('login', {
        title:"Login - One Click IoT",
        isLoggedIn: false,
        info:info
    });
});

app.get('/signup', function(req, res) {
    if(req.isAuthenticated()) res.redirect('/account');
    res.render('signup', {
        title:"Register - One Click IoT",
        isLoggedIn: false,
        info:''
    });
});

app.get('/account', function (req, res, next) {
    if(!req.isAuthenticated()) res.redirect('/');
    res.render('account', {
        user: req.user,
        isLoggedIn: true,
        title:"My Account - One Click IoT"
    });
});


// 404 not found
app.use(function(req, res, next) {
    var err = {status:404,message:"ERROR 404 Page Not Found"}
    //console.log(err);
    res.render('404', {
        status:(err.status || 500),
        message : err.message,
        title:"Error "+(err.status || 500)+" - One Click IoT",
        user : req.user,
        isLoggedIn: req.isAuthenticated(),
    });
});

// HTTPS
var secureServer = https.createServer({
    key: fs.readFileSync(__dirname + '/ssl.key'),    // X-Chnage
    cert: fs.readFileSync(__dirname + '/ssl.cert')   // X-Chnage
}, app).listen(3353, function () {
    console.log('One Click IoT Web Application - HTTPS on ' + secureServer.address().port);
});

var insecureServer = http.createServer(app).listen(3352, function() {
    console.log('One Click IoT Web Application - HTTP on ' + insecureServer.address().port);
})
