// for http://www.flickr.com/services/api/

module.exports = function flickrPlugin(transport, oauth_cred) {
    // Flickr's "REST" API is not particularly RESTful - but we can deal...
    this.base = "https://secure.flickr.com/services";
    transport = transport.using('statusCheck').using('autoConvert', "application/json").using('oauth', oauth_cred);
    return function (req, callback) {
        req.oauth_base = "http://secure.flickr.com/services";     // herp derp?
        if (req.path[1] === "oauth") {
            delete req.query['format'];
            delete req.query['nojsoncallback'];
            req.headers['Accept'] = "application/x-www-form-urlencoded";
        } else {
            req.query.format = 'json';
            req.query.nojsoncallback = 1;
        }
        transport(req, callback);
    };
};

/*

var f = require('./fermata'), r = require('./plugins/flickr');
f.registerPlugin('flickr', r);

var token, token_secret;
f.flickr({client:"", client_secret:""}).oauth.request_token({oauth_callback:"oob"}).get(function (e,d) {
    token = d.oauth_token;
    token_secret = d.oauth_token_secret;
    console.log(f.flickr({}).oauth.authorize({oauth_token:d.oauth_token, perms:"read"})());
});

// this part not working for me...
var verifier = "";
f.flickr({client:"XXX", client_secret:"XXX", token:token, token_secret:token_secret}).oauth.access_token({oauth_token:token, oauth_verifier:verifier}).get(function (e,d) {
    console.log(e,d);
});

*/