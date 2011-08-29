var oauth = require('./oauth');

function _formEncode(data) {
    // see http://www.w3.org/TR/1998/REC-html40-19980424/interact/forms.html#h-17.13.4.1 and
    // http://www.w3.org/TR/html5/association-of-controls-and-forms.html#application-x-www-form-urlencoded-encoding-algorithm
    return oauth.listQuery(data).map(function (kv) {
        return encodeURIComponent(kv[0]).replace(/%20/g, '+') + '=' + encodeURIComponent(kv[1]).replace(/%20/g, '+');
    }).join("&");
}

function twitterPlugin(transport, cred) {    // credentials = {client, client_secret, token, token_secret}
    this.base = "https://api.twitter.com";
    return function (req, cb) {
        req.path[req.path.length - 1] += ".json";
        req.headers['Accept'] = "application/json";
        req.headers['Content-Type'] = "application/x-www-form-urlencoded";
        req.headers['Authorization'] = oauth.authorizeHMAC(req, cred);
        req.data = req.data && _formEncode(req.data);
        transport(req, function (err, response) {
            if (!err) {
                if (response.status.toFixed()[0] !== '2') {
                    err = Error("Bad status code from server: " + response.status);
                }
                try {
                    response = JSON.parse(response.data);
                } catch (e) {
                    err = e;
                }
            }
            cb(err, response);
        });
    };
}

exports.plugin = twitterPlugin;


/*
var f = require('./fermata'),
    t = require('./plugins/twitter');
f.registerPlugin('twitter', t.plugin);

var twebz = f.twitter({client:"", client_secret:"", token:"", token_secret:""});

twebz.statuses.home_timeline.get(function (e, d) {
    console.log(e,d);
});

twebz.statuses.update.post({status:"FRIST TWEET from Fermata!!1! (Using new OAuth stuff, in progress on https://github.com/andyet/fermata/tree/plugins branch)"}, function (e,d) {console.log(e,d);})

*/
