define(['models/StatusCollection'], function(StatusCollection) {
    var Account = Backbone.Model.extend({
        urlRoot: '/accounts',

        initialize: function() {
            debugger;
            this.status = new StatusCollection();
            this.status.url = '/accounts/' + this.id + '/status';
            this.activity = new StatusCollection();
            this.activity.url = '/accounts/' + this.id + '/activity';
        }
    });

    return Account;
});

