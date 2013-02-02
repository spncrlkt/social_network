var express = require('express');
var app = express();
var nodemailer = require('nodemailer');
var MemoryStore = require('connect').session.MemoryStore;
var dbPath  ='mongodb://localhost/nodebackbone';

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
    app.use(express.session(
        {secret: "SocialNet secret key", store: new MemoryStore()}));
    mongoose.connect(dbPath, function onMongooseerror(err) {
        if (err) throw err;
    });
});

app.get('/', function(req, res) {
    res.render("index.jade", {layout:false});
});

app.get('/account/authenticated', function(req, res) {
    if ( req.session.loggedIn) {
        res.send(200);
    } else {
        res.send(401);
    }
});

app.post('/register', function(req, res) {
    var firstName = req.param('firstName', '');
    var lastName = req.param('lastName','');
    var email = req.param('email', null);
    var password = req.param('password', null);
    if ( null === email || null === password ) {
        res.send(400);
        return;
    }

    models.Account.register(email, password, firstName, lastName);
    res.send(200);
});

app.post('/login', function(req, res) {
    console.log('login requst');
    var email = req.param('email', null);
    var password = req.param('password', null);

    if ( null === email || email.length < 1 || 
         null === password || password.length < 1) {
        res.send(400);
        return;
    }

    models.Account.login(email, password, function(account) {
        if (!account) {
            res.send(401);
            return;
        }
        console.log('login was successful');
        req.session.loggedIn = true;
        req.session.accountId = account._id;
        res.send(200);
    });
});

app.post('/forgotpassword', function(req, res) {
    var hostname = req.headers.host;
    var resetPasswordUrl = 'http://' + hostname + '/resetPassword';
    var email = req.param('email',null);
    if ( null === email || email.length < 1) {
        res.send(400);
        return;
    }

    models.Account.forgotPassword(email, resetPasswordUrl, function(success) {
        if (success) {
            res.send(200);
        } else {
            res.send(404);
        }
    });
});

app.get('/resetPassword', function(req, res) {
    var accountId = req.param('account', null);
    res.render('resetPassword.jade', {locals:{accountId:accountId}});
});

app.post('/resetPassword', function(req, res) {
    var accountId = req.param('accountId', null);
    var password = req.param('password', null);
    if (null !== accountId && null !== password) {
        models.Account.changePassword(accountId, password);
    }
    res.render('resetPasswordSuccess.jade');
});


app.get('/accounts/:id', function(req, res) {
    var accountId = req.params.id == 'me' ? req.session.accountId : req.params.id;
    models.Account.findById(accountId, function(account) {
        res.send(account);
    });
});

app.get('/accounts/:id/status', function(req, res) {
    var accountId = req.params.id == 'me' ? req.session.accountId : req.params.id;
    models.Account.findById(accountId, function(account) {
        res.send(account.status);
    });
});

app.post('/accounts/:id/status', function(req, res) {
    var accountId = req.params.id == 'me' ? req.session.accountId : req.params.id;
    models.Account.findById(accountId, function(account) {
        status = {
            name: account.name,
            status: req.param('status', '')
        };
        account.status.push(status);

        account.activity.push(status);
        account.save(function (err) {
            if (err) {
                console.log('Error saving account: ' + err);
            }
        });
    });
    res.send(200);
});

app.get('/accounts/:id/activity', function(req,res) {
    var accountId = req.params.id == 'me' ? req.session.accountId : req.params.id;
    models.Account.findById(accountId, function(account) {
        res.send(account.activity);
    });
});


app.listen(8008);
