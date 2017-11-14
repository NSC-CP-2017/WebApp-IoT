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
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var multer = require('multer');
var upload = multer();
var AWS = require("aws-sdk");


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

AWS.config.update({
    region: 'ap-southeast-1',
    endpoint: "https://dynamodb.ap-southeast-1.amazonaws.com",
    accessKeyId: 'AKIAIYANJTEIREHDY7NA',
    secretAccessKey: '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'
});

var app = express();

// view engine setup
//app.all('*', function(req, res, next){
//    if (req.secure && req.header("host") == 'iot-chula.com') {
//        return next();
//    };
//    res.redirect('https://iot-chula.com:443'+req.url);
//});

app.use(favicon(__dirname + '/public/favicon.ico'));
app.set('views', __dirname+'/public');
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


var schemaUsers = new Schema({
    usertype: String,
    fname: String,
    lname: String,
    username: { type: String, lowercase: true },
    password: String
});
var schemaProjects = new Schema({
    UserID: Schema.ObjectId,
    name: String,
    desc: String,
    appID: Number,
    appKey: String,
    appSecret: String,
    slots: Array
});
var schemaDevices = new Schema({
    appID: Number,
    name: String,
    online: Boolean,
    lastOnline: Date,
    color: String,
    lat: Number,
    lon: Number
});
var schemaReacts = new Schema({
    UserID: Schema.ObjectId,
    appID: Number,
    actID: Number,
    name: String,
    desc: String,
    slot: String,
    compare: String,
    threshold: Number,
    status: Boolean,
    sms: Boolean,
    phone: String,
    email: String,
    subject: String,
    message: String,
});
var schemaReactLogs = new Schema({
    actID: Number,
    actionTime: Date,
    email: String,
    subject: String,
    message: String,
    success: Boolean,
    UserID: Schema.ObjectId
});
//var schema...


schemaUsers.plugin(passportLocalMongoose, {errorMessages: {UserExistsError:"อีเมลดังกล่าวมีอยู่ในระบบแล้ว"} });

var Users = mongoose.model('users', schemaUsers);
var Projects = mongoose.model('projects', schemaProjects);
var Devices = mongoose.model('devices', schemaDevices);
var Reacts = mongoose.model('reacts', schemaReacts);
var ReactLogs = mongoose.model('reactlogs', schemaReactLogs);

passport.use(new LocalStrategy(Users.authenticate()));
passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());

mongoose.connect('mongodb://localhost/SmartIoT');    // X-Chnage


function sendMail(to,subject,message){
    if(typeof to == 'undefined' || to == '') return false;
    var mailOptions = {
        from: '"Smart ReActs" <react@iot-chula.com>',
        to: to,
        subject: subject,
        html: message
    };
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
            return false;
        }
        console.log('Message sent: ' + info.response);
        return true;
    });
}

function getLatestRecords(limits,user,path){

}
function createDynamoD(name){
    var dynamodb = new AWS.DynamoDB();

    var params = {
        TableName : "data."+name,
        KeySchema: [
            { AttributeName: "dataSlot", KeyType: "HASH"},  //Partition key
            { AttributeName: "timeStamp", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [
            { AttributeName: "dataSlot", AttributeType: "S" },
            { AttributeName: "timeStamp", AttributeType: "N" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 2
        }
    };

    dynamodb.createTable(params, function(err, data) {
        if (err) {
            return console.error("Unable to create "+params.TableName+". Error JSON:", JSON.stringify(err, null, 2));
        } else {
            return console.log("Created "+params.TableName+". Table description JSON:", JSON.stringify(data, null, 2));
        }
    });
}
function clearData(name){
    var dynamodb = new AWS.DynamoDB();

    dynamodb.deleteTable({TableName : "data."+name}, function(err, data) {
        if (err) {
            console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
        }
        setTimeout(function(){createDynamoD(name)},4000);
    });
}
//createDynamoD("56c676bf5310caa1323ef5a6");

function changePass(username,newPass){
    Users.findOne({ username: username }, function (err, doc){
        doc.setPassword(newPass,function(error){
            if (!error) {
                doc.save(function(error){
                    if (!error) { console.log("New pass of "+username+" is "+newPass) }
                    else { return console.log("error"); }
                });
            } else {
                return console.log("error");
            }
        });
    });
}

app.get('/', function (req, res, next) {
    res.render('index', {
        title: "One Click IoT - oneclickiot.com",
        isLoggedIn: req.isAuthenticated()
    });
});
app.get('/demo', function (req, res, next) {
    res.render('demo', {
        title: "One Click IoT - oneclickiot.com",
        isLoggedIn: req.isAuthenticated()
    });
});

app.get('/tutorials', function (req, res, next) {
    res.render('tutorial', {
        title: "One Click IoT's Tutorials - oneclickiot.com",
        isLoggedIn: req.isAuthenticated()
    });
});

app.get('/download', function (req, res, next) {
    res.render('download', {
        title: "Download SmartIoTLib - oneclickiot.com",
        isLoggedIn: req.isAuthenticated()
    });
});

app.get('/terms', function (req, res, next) {
    res.render('tos', {
        title: "Term of Service - oneclickiot.com",
        isLoggedIn: req.isAuthenticated()
    });
});

app.get('/privacy', function (req, res, next) {
    res.render('privacy', {
        title: "Privacy Policy - oneclickiot.com",
        isLoggedIn: req.isAuthenticated()
    });
});

app.get('/ping', function(req, res){
    res.status(200).send("pong!");
});


app.get('/register', function(req, res) {
    if(req.isAuthenticated()) res.redirect('/account');
    res.render('register', {
        title:"Register - One Click IoT",
        isLoggedIn: false,
        info:''
    });
});

app.post('/register', function(req, res, next) {
    if(req.body.username) req.body.username = req.body.username.toLowerCase();
    Users.register(new Users({ username : req.body.username, fname:"", lname:"" }), req.body.password, function(err, account) {
        if (err) {
            return res.render("register", {
                info: "ขออภัย อีเมลดังกล่าวเคยลงทะเบียนในระบบแล้ว",
                isLoggedIn: false,
                title: "Register - One Click IoT"
            });
        }

        passport.authenticate('local')(req, res, function () {
            req.session.save(function (err) {
                if (err) {
                    return next(err);
                }
                createDynamoD(req.user._id);
                res.redirect('/account/edit');
            });
        });
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

app.post('/login', passport.authenticate('local', { failureRedirect: '/login?error', successRedirect: '/projects' }), function(req, res, next) {
    req.session.save(function (err) {
        if (err) return next(err);
        res.redirect('/projects');
    });
});

app.get('/logout', function(req, res, next) {
    req.logout();
    req.session.save(function (err) {
        if (err) return next(err);
        res.redirect('/');
    });
});

app.get('/account', function (req, res, next) {
    if(!req.isAuthenticated()) res.redirect('/');
    res.render('myAccount', {
        user: req.user,
        isLoggedIn: true,
        title:"My Account - One Click IoT"
    });
});
app.get('/account/edit', function (req, res, next) {
    if(!req.isAuthenticated()) res.redirect('/');
    res.render('editAccount', {
        user: req.user,
        info: '',
        isLoggedIn: true,
        title:"Edit My Account - One Click IoT"
    });
});
app.post('/account/edit', function (req, res, next) {
    if(!req.isAuthenticated()) res.redirect('/');
    var opt = {
        user: req.user,
        isLoggedIn: true,
        info:'แก้ไขข้อมูลเรียบร้อยแล้ว',
        title:"Edit My Account - One Click IoT"
    };
    Users.findOne({ _id: req.user._id }, function (err, doc){
        if(req.body.fname) doc.fname = req.body.fname;
        if(req.body.lname) doc.lname = req.body.lname;
        if(req.body.newpass) {
            doc.setPassword(req.body.newpass,function(error){
                if (!error) {
                    doc.save(function(error){
                        delete doc.hash;
                        delete doc.salt;
                        req.user = doc;
                        opt.info = 'แก้ไขข้อมูลและเปลี่ยนรหัสผ่านเรียบร้อยแล้ว';
                        if (!error) { res.render('editAccount', opt); }
                        else { return next(error); }
                    });
                } else {
                    return next(error);
                }
            });
        } else {
            doc.save(function(error){
                if (!error) {
                    delete doc.hash;
                    delete doc.salt;
                    req.user = doc;
                    if (!error) res.render('editAccount', opt);
                    else return next(error);
                }
            });
        }
    });
});

app.get('/projects', function (req, res, next) {
    if(!req.isAuthenticated()) res.redirect('/');

    Projects.find({UserID:req.user._id}).exec(function(err, result) {
        if (err) {
            return next(err);
        }
        Reacts.find({UserID:req.user._id}).exec(function(err, reacts) {
            if (err) {
                return next(err);
            }
            res.render('myProject', {
                user: req.user,
                result: result,
                reacts: reacts,
                isLoggedIn: true,
                title:"My Projects - One Click IoT"
            });
        });
    });
});

app.post('/projects/new', function (req, res, next) {
    if(!req.isAuthenticated()) return res.redirect('/');


    Projects.findOne().sort({appID: -1}).exec(function(err, arra) {
        if (err) throw err;
        if(arra == null) arra = {'appID':10000 };
        var pjid = Number(arra['appID'])+1;
        var appKey = crypto.createHash('md5').update(req.user._id+pjid+Date.now()).digest("hex");
        var appSecret = crypto.createHash('md5').update(appKey+Date.now()).digest("hex");
        var slots = [];
        if(req.body.dev) {
            if(!Array.isArray(req.body.dev)) req.body.dev = [req.body.dev];
            for(var dev in req.body.dev) {
                if(req.body.dev[dev].replace(/ /g,'')) slots.push(req.body.dev[dev].replace(/ /g,''));
            }
        }

        var doc = new Projects({
            UserID: req.user._id,
            name: req.body.name,
            desc: req.body.desc,
            appID: pjid,
            appKey: appKey,
            appSecret: appSecret,
            slots: slots
        });
        doc.save(function(error){
            if (!error) { res.redirect('/projects/'+pjid); }
            else { return next(error); }
        });
    });

});

app.get('/projects/new', function (req, res, next) {
    if(!req.isAuthenticated()) res.redirect('/');
    res.render('newProject', {
        user: req.user,
        isLoggedIn: true,
        info:'',
        title:"New Project - One Click IoT"
    });
});

app.post('/projects/:pid', function (req, res, next) {
    if(!req.isAuthenticated()) res.redirect('/');

    var pid = parseInt(req.params.pid);

    var opt = {
        user: req.user,
        isLoggedIn: true,
        info:'แก้ไขข้อมูลเรียบร้อยแล้ว',
        title:"Edit My Project - One Click IoT"
    };
    Projects.findOne({ UserID:req.user._id,appID:pid }, function (err, doc){
        if(req.body.name) doc.name = req.body.name;
        if(req.body.desc) doc.desc = req.body.desc;
        var slots = [];
        if(req.body.dev)  {
            if(!Array.isArray(req.body.dev)) req.body.dev = [req.body.dev];
            for(var dev in req.body.dev) { if(req.body.dev[dev].replace(/ /g,'')) slots.push(req.body.dev[dev].replace(/ /g,'')); }
            doc.slots = slots;
        }
        doc.save(function(error){
            if (!error) {
                result = doc;
                if (!error) {
                    res.render('viewProject', {
                        user: req.user,
                        result: result,
                        isLoggedIn: true,
                        title:"My Projects - One Click IoT"
                    });
                } else {
                    return next(error);
                }
            }
        });

    });
});

app.get('/projects/delete/:pid', function (req, res, next) {
    if(!req.isAuthenticated()) res.redirect('/');

    var pid = parseInt(req.params.pid);
    Projects.findOne({UserID:req.user._id,appID:pid}).exec(function(err, result) {
        if (err) {
            return next(err);
        }
        if(result !== null) {
            result.remove({}, function(err) {
                console.log('collection '+pid+' removed')
            });
            res.redirect('/projects');
        } else {
            res.redirect('/projects');
        }

    });

});

app.get('/projects/:pid', function (req, res, next) {
    if(!req.isAuthenticated()) res.redirect('/');

    var pid = parseInt(req.params.pid);
    Projects.findOne({UserID:req.user._id,appID:pid}).exec(function(err, result) {
        if (err) {
            return next(err);
        }
        if(result !== null) {

            res.render('viewProject', {
                user: req.user,
                result: result,
                isLoggedIn: true,
                title:"My Projects - One Click IoT"
            });
        } else {
            res.redirect('/projects');
        }

    });

});

app.get('/analyse/:pid/:slot', function (req, res, next) {
    if(!req.isAuthenticated())  res.redirect('/');

    var pid = parseInt(req.params.pid);
    var slot = req.params.slot;

    Projects.findOne({UserID:req.user._id,appID:pid}).exec(function(err, project) {
        if (err) {
            console.log("Error "+err);
            return next(err);
        }
        if(project !== null) {
            res.render('viewData', {
                user: req.user,
                result: project,
                slot: slot,
                isLoggedIn: true,
                title:"Analyse My Data - One Click IoT"
            });
        } else {
            res.sendStatus(204).end();
        }

    });

});

app.get('/getDevices/:pid', function (req, res, next) {
    if(!req.isAuthenticated()) res.sendStatus(401).end();

    var pid = parseInt(req.params.pid);
    Projects.findOne({UserID:req.user._id,appID:pid}).exec(function(err, project) {
        if (err) {
            return next(err);
        }
        if(project !== null) {
            Devices.find({appID:pid}).exec(function(err, result) {
                var resp = {};
                result.forEach(function(item) {
                    resp[item.name] = {
                        online:item.online,
                        lastOnline:item.lastOnline,
                        color:item.color,
                        lat:item.lat,
                        lon:item.lon
                    };
                });
                res.json(resp);
            });
        } else {
            res.sendStatus(204).end();
        }

    });

});

app.get('/getData/:pid/:slot', function (req, res, next) {
    if(!req.isAuthenticated()) res.sendStatus(401).end();

    var pid = parseInt(req.params.pid);
    var slot = req.params.slot;
    var limit = (typeof req.query.num != 'undefined') ? Number(req.query.num) : 30;
    var high = (typeof req.query.high != 'undefined') ? true : false;
    var csv = (typeof req.query.csv != 'undefined') ? true : false;

    Projects.findOne({UserID:req.user._id,appID:pid}).exec(function(err, project) {
        if (err) {
            console.log("Error "+err);
            return next(err);
        }
        if(project !== null) {
            var docClient = new AWS.DynamoDB.DocumentClient();

            //console.log("Scan "+pid);
            var params = {
                TableName : "data."+req.user._id,
                KeyConditionExpression: "#data = :slotName",
                ExpressionAttributeNames:{
                    "#data": "dataSlot"
                },
                ScanIndexForward : false,
                ExpressionAttributeValues: {
                    ":slotName":pid+"/"+slot
                },
                Limit:limit
            };
            if(high || csv) delete params.Limit;

            docClient.query(params, function(err, data) {
                if (err) {
                    console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
                    return next(err);
                } else {
                    //console.log(data.Items);
                    var resp = (high || csv) ? []:{key:slot,data:[]};
                    data.Items.forEach(function(item) {
                        if(high) resp.push([item.timeStamp,Number(item.value)]);
                        else if(csv) resp.push('"'+item.timeStamp+'","'+Number(item.value)+'","'+item.device+'"');
                        else  resp.data.push({d:item.device,x:item.timeStamp,y:Number(item.value)});
                    });
                    if(csv) {
                        var body = '\uFEFF'+'"timeStamp","value","device"'+"\n";
                        res.set('Content-Type', 'text/csv');
                        res.set('charset', 'utf-8');
                        res.set('Content-disposition', 'attachment; filename=data-'+pid+'-'+slot+'.csv');
                        body += resp.join("\n");
                        res.send(body).end();
                    } else {
                        res.json(resp);
                    }
                }
            });
        } else {
            res.sendStatus(204).end();
        }
    });
});


app.get('/reacts', function (req, res, next) {
    res.redirect('/projects');
});

app.post('/reacts/new', function (req, res, next) {
    if(!req.isAuthenticated()) return res.redirect('/');

    Reacts.findOne().sort({actID: -1}).exec(function(err, arra) {
        if (err) throw err;
        if(arra == null) arra = {'actID':9999 };
        var pjid = Number(arra['actID'])+1;
        var a = (req.body.sms == '1')?true:false;
        var doc = new Reacts({
            UserID: req.user._id,
            appID: req.body.appID,
            actID: pjid,
            name: req.body.name,
            desc: req.body.desc,
            slot: req.body.slot,
            compare: req.body.compare,
            threshold: req.body.threshold,
            status: a,
            sms: req.body.sms,
            phone: req.body.phone,
            email: req.body.email,
            subject: req.body.subject,
            message: req.body.message,
        });
        doc.save(function(error){
            if (!error) {
                var message = "<p>Hello, "+req.user.fname+" "+req.user.lname+"</p>"+
                    "<p>Please click the link below to verify that you want to get notification from <b><i>"+doc.name+"</i> Smart ReAct</b> for Project ID: <b>"+doc.appID+"</b></p>"+
                    "<p><a href='https://iot-chula.com/reacts/verify/"+doc._id+"'>https://iot-chula.com/reacts/verify/"+doc._id+"</a></p>"+
                    "<p>Thank you,<br />Smart IoT Platfom Team</p>";
                sendMail(doc.email+", wisit@gipsic.com","Smart ReAct Verification",message);
                res.redirect('/reacts/'+pjid);
            }
            else { return next(error); }
        });
    });

});

app.get('/reacts/new', function (req, res, next) {
    if(!req.isAuthenticated()) res.redirect('/');
    var d = new Date();
    var n = d.toString();
    Projects.find({UserID:req.user._id}).exec(function(err, result) {
        if (err) {
            return next(err);
        }
        res.render('newReact', {
            user: req.user,
            result: result,
            isLoggedIn: true,
            info:'',
            title:"New Smart ReActs - One Click IoT"
        });
    });
});

app.get('/reacts/verify/:pid', function (req, res, next) {
    //if(!req.isAuthenticated()) res.redirect('/');
    var pid = req.params.pid;
    var id = mongoose.Types.ObjectId(pid);
    Reacts.findOne({_id:id}).exec(function(err, doc) {
        if(doc !== null) {
            doc.status = true;
            doc.save(function(error){
                if (!error) {
                    res.redirect('/reacts/'+doc.actID);
                }
                else { return next(error); }
            });
        } else {
            res.redirect('/reacts');
        }
    });
});


app.get('/reacts/delete/:pid', function (req, res, next) {
    if(!req.isAuthenticated()) res.redirect('/');

    var pid = parseInt(req.params.pid);
    Reacts.findOne({UserID:req.user._id,actID:pid}).exec(function(err, result) {
        if (err) {
            return next(err);
        }
        if(result !== null) {
            result.remove({}, function(err) {
                console.log('Reacts '+pid+' removed')
            });
            res.redirect('/reacts');
        } else {
            res.redirect('/reacts');
        }

    });

});

app.post('/reacts/:pid', function (req, res, next) {
    if(!req.isAuthenticated()) res.redirect('/');

    var pid = parseInt(req.params.pid);

    var opt = {
        user: req.user,
        isLoggedIn: true,
        info:'แก้ไขข้อมูลเรียบร้อยแล้ว',
        title:"Edit Smart ReAct - One Click IoT"
    };
    Reacts.findOne({UserID:req.user._id,actID:pid}).exec(function(err, doc) {
        if (err) throw err;
        doc.UserID = req.user._id;
        doc.appID = req.body.appID;
        doc.name = req.body.name;
        doc.desc = req.body.desc;
        doc.slot = req.body.slot;
        doc.compare = req.body.compare;
        doc.threshold = req.body.threshold;
        doc.sms = req.body.sms;
        if(req.body.sms == '1') doc.status = true;
        doc.phone = req.body.phone;
        doc.subject = req.body.subject;
        doc.message = req.body.message;

        doc.save(function(error){
            if (!error) {
                res.redirect('/reacts/'+doc.actID);
            }
            else { return next(error); }
        });
    });
});

app.get('/reacts/:pid', function (req, res, next) {
    if(!req.isAuthenticated()) res.redirect('/');

    var pid = parseInt(req.params.pid);
    Reacts.findOne({UserID:req.user._id,actID:pid}).exec(function(err, result) {
        if (err) {
            return next(err);
        }
        if(result !== null) {
            Projects.find({UserID:req.user._id}).exec(function(err, projects) {
                res.render('viewReact', {
                    user: req.user,
                    result: result,
                    projects: projects,
                    logs: result,
                    isLoggedIn: true,
                    title:"Smart ReAct - One Click IoT"
                });
            });
        } else {
            res.redirect('/reacts');
        }
    });
});


app.get('/admin', function (req, res, next) {
    if(!req.isAuthenticated() || typeof req.user.usertype == 'undefined' || req.user.usertype != 'admin') {
        res.redirect('/');
    }
    res.render('admin', {
        title: "One Click IoT - oneclickiot.com",
        user: req.user,
        isLoggedIn: req.isAuthenticated()
    });
});

app.get('/wisit/clear/:name', function(req, res) {
    if(!req.isAuthenticated() || req.user.username != 'wisit@gipsic.com') {
        res.redirect('/');
    } else {
        clearData(req.params.name);
    }
});

app.get('/iot-chula.com.html', function(req, res) {
    res.sendFile(__dirname + '/public/iot-chula.com.html')
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
