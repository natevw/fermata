// get these via https://dev.twitter.com/apps and keep them secret!
CONSUMER_KEY = "";
CONSUMER_SECRET = "";
ACCESS_TOKEN = "";
ACCESS_TOKEN_SECRET = "";


var f = require('fermata'),
    t = require('fermata/plugins/twitter');
f.registerPlugin('twitter', t);

var twapi = f.twitter({client:CONSUMER_KEY, client_secret:CONSUMER_SECRET, token:ACCESS_TOKEN, token_secret:ACCESS_TOKEN_SECRET});

twapi.statuses.home_timeline.get(function (e, d) {
    console.log(e,d);
});

twapi.statuses.update.post({status:"I'm trying out @natevw's Fermata, a simple but powerful REST client for HTML5 and node.js: https://github.com/andyet/fermata /cc @andyet"}, function (e,d) {console.log(e,d);});
