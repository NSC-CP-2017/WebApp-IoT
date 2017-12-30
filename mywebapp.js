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

//app.use(favicon(__dirname + '/mypublic/favicon.ico'));
app.set('views', __dirname+'/mypublic');
app.set('view engine', 'ejs');
app.use('/assets', express.static(__dirname + '/mypublic/assets'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

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
var Weather = require('./models/Weather');

var weather = require('./controllers/weather.controllers');
var weatherCronJob = weatherCj();


app.use(passport.initialize());
app.use(passport.session());

var passport_config = require('./config/passport');
require('./config/passport')(passport);

mongoose.connect('mongodb://localhost/IntelligentThings');

//=======
//=Route=
//=======
app.get('/', function (req, res, next) {
    res.render('index',{
        user : req.user,
        isLoggedIn : req.isAuthenticated()
    });
});

app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));

app.post('/check-email',function(req,res){
    console.log(req.body);
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


app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/account',isLoggedIn ,function(req, res) {
    res.render('account',{
        user : req.user,
        isLoggedIn : req.isAuthenticated()
    });
});

app.get('/repository',isLoggedIn ,function(req, res) {
    res.render('repository',{
        user : req.user,
        isLoggedIn : req.isAuthenticated()
    });
});

app.get('/testweather', weather.testFetch);
app.get('/fetchweather', weather.fetchWeather);
app.get('/getweatherfromid', weather.getWeatherFromCityID);

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
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



// HTTPS
// var secureServer = https.createServer({
//     key: fs.readFileSync(__dirname + '/ssl.key'),    // X-Chnage
//     cert: fs.readFileSync(__dirname + '/ssl.cert')   // X-Chnage
// }, app).listen(3353, function () {
//     console.log('One Click IoT Web Application - HTTPS on ' + secureServer.address().port);
// });

var insecureServer = http.createServer(app).listen(3352, function() {
    console.log('One Click IoT Web Application - HTTP on ' + insecureServer.address().port);
})
