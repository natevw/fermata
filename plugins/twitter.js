// for https://dev.twitter.com/docs/api

module.exports = function twitterPlugin(transport, oauth_cred) {
    this.base = "https://api.twitter.com";
    transport = transport.using('statusCheck').using('autoConvert', "application/json").using('oauth', oauth_cred);
    
    return function (req, callback) {
        req.path[req.path.length - 1] += ".json";
        req.headers['Content-Type'] = "application/x-www-form-urlencoded";
        transport(req, callback);
    };
};
