// for http://www.flickr.com/services/api/

module.exports = function flickrPlugin(transport, oauth_cred) {
    this.base = "https://secure.flickr.com/services";
    transport = transport.using('statusCheck').using('autoConvert', "application/json").using('oauth', oauth_cred);
    return function (req, callback) {
        req._oauth_base = "http://secure.flickr.com/services";      // herp derp #1 (Flickr calculates sig base string with wrong URL scheme)
        if (req.path[1] === "oauth") {
            delete req.query['format'];
            delete req.query['nojsoncallback'];
            req.headers['Accept'] = "application/x-www-form-urlencoded";
        } else if (req.path[1] === "upload") {
            req._oauth_params = {};                                 // herp derp #2 (Flickr signs fields from places OAuth 1.0a spec prohibits)
            Object.keys(req.data).filter(function (k) { return k !== "photo" }).forEach(function (key) {
                req._oauth_params[key] = req.data[key];
            });
            req.headers['Accept'] = "text/xml";
        } else {
            req.query.format = 'json';
            req.query.nojsoncallback = 1;
        }
        transport(req, callback);
    };
};
