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

//Middleware
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
app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/',
        failureRedirect : '/?error',
}));

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
                                owner: req.user.email,
                                device: [],
                                warningState:[]
    });
    project.save(function(err){
        if (err) {
            throw err
        }
        else {
            req.flash("message","Project has been created!")
            res.redirect('/repository');
        }
    });
});

app.post('/createproject',isLoggedIn,function(req,req){
    var device = new Devices();
});

app.get('/', function (req, res, next) {
    var logInMessage = (typeof req.query.error !== 'undefined') ? 'username or email is incorrect':'';
    res.render('index',{
        user : req.user,
        isLoggedIn : req.isAuthenticated(),
        title : "Index",
        logInMessage : logInMessage
    });
});

app.get('/logout',isLoggedIn ,function(req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/repository',isLoggedIn ,function(req, res) {
    Projects.find({owner:req.user.email}).exec(function(err,projects){
        if (err) {
            return next(err);
        }
        console.log(req.user.email)
        console.log(projects);
        var message = req.flash("message")[0];
        res.render('repository',{
            user : req.user,
            isLoggedIn : req.isAuthenticated(),
            message : message,
            projects : projects,
            title : "Repository"
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


app.get('/testweather', weather.testFetch);
app.get('/fetchweather', weather.fetchWeather);
app.get('/getweatherfromid', weather.getWeatherFromCityID);

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
