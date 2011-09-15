// for http://www.flickr.com/services/api/

module.exports = function flickrPlugin(transport, oauth_cred) {
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
