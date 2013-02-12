module.exports = function(app, models) {
    app.get('/accounts/:id', function(req, res) {
        var accountId = req.params.id == 'me' ? req.session.accountId : req.params.id;
        models.Account.findById(accountId, function(account) {
            if ( accountId == 'me' || models.Account.hasContact(account, req.session.accountId) ) {
                account.isFriend = true;
            }
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

    app.get('/accounts/:id/contacts', function(req, res) {
        var accountId = req.params.id == 'me' ? req.session.accountId : req.params.id;
        models.Account.findById(accountId, function(account) {
            res.send(account.contacts);
        });
    });

    app.post('/contacts/find', function(req, res) {
        var searchStr = req.param('searchStr', null);
        if ( null === searchStr) {
            res.send(400);
            return;
        }

        models.Account.findByString(searchStr, function onSearchDone(err, accounts) {
            if (err || accounts.length === 0) {
                res.send(404);
            } else {
                res.send(accounts);
            }
        });
    });

    app.post('/accounts/:id/contact', function(req,res) {
        var accountId = req.params.id == 'me' ? req.session.accountId : req.params.id ;
        var contactId = req.param('contactId', null);

        // Missing contactId, dont't bother going any further
        if ( null === contactId ) {
            res.send(400);
            return;
        }

        models.Account.findById(accountId, function(account) {
            if ( account ) {
                models.Account.findById(contactId, function (contact) {
                    models.Account.addContact(account, contact);

                    // Make the reverse link
                    models.Account.addContact(contact, account);
                    account.save();
                });
            }
        });

        // Note: not in callback - this endpoint returns immediately and 
        // processes in the background
        res.send(200);
    });

    app.delete('/accounts/:id/contact', function(req, res) {
        var accountId = req.params.id == 'me' ? req.session.accountId : req.params.id;
        var contactId = req.param('contactId', null);

        // Missing contactid, don't bother going any further
        if ( null === contactId) {
            res.send(400);
            return;
        }

        models.Account.findById(accountId, function(account) {
            if ( !account ) return;
            models.Account.findById(contactId, function(contact, err) {
                if ( !contact) return;

                models.Account.removeContact(account, contactId);
                models.Account.removeContact(contact, accountId);
            });
        });
        
        res.send(200);
    });
};
