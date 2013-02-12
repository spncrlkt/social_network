var express = require('express');
var http = require('http');
var app = express();
var nodemailer = require('nodemailer');
var MemoryStore = require('connect').session.MemoryStore;
var dbPath  ='mongodb://localhost/nodebackbone';
var fs = require('fs');

app.server = http.createServer(app);
app.sessionStore = new MemoryStore();

// Import the data layer
var mongoose = require('mongoose');
var config = {
    mail: require('./config/mail')
};

// Import the models 
var models = {
    Account: require('./models/Account')(config, mongoose, null, nodemailer)
};


app.configure(function() {
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/public'));
    app.use(express.limit('1mb'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: "SocialNet secret key",
        key: 'express.sid',
        store: app.sessionStore
    }));
    mongoose.connect(dbPath, function onMongooseError(err) {
        if (err) throw err;
    });
});

fs.readdirSync('routes').forEach(function(file) {
    var routeName = file.substr(0, file.indexOf('.'));
    require('./routes/'+routeName)(app, models);
});


app.listen(8008);
