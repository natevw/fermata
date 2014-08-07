// NOTE: when running under node.js, Fermata includes this plugin automagically.
//       This file is NOT needed (and will not work) in the browser: your client credentials are not safe there!

var fermata;
var oauth = function (transport, cred) {            // credentials = {client, client_secret[, token, token_secret]}
    return function (req, callback) {
        req.headers['Authorization'] = oauth.authorizeHMAC(req, cred);
        transport(req, callback);
    }
};
oauth.init = function (f) {
    fermata = f;
    return module.exports;
};

oauth.percentEncode = function (s) {
    // http://tools.ietf.org/html/rfc5849#section-3.6
    return encodeURIComponent(s).replace(/!/g, '%21').replace(/\*/g, '%2A').replace(/'|'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
};

oauth.signatureBaseString = function (req, auth) {
    // http://tools.ietf.org/html/rfc5849#section-3.4.1
    
    // base string URI
    var uri = fermata._stringForURL({base:(req._oauth_base || req.base), path:req.path, query:{}});
    /* TODO: make sure scheme/host are lowercase, remove default ports if included */
    
    // request parameters
    var params = [];
    var pushQ = function (q, isAuth) {
        fermata._flatten(q).forEach(function (kv) {
            if (isAuth) {
                if (kv[0] === "realm") {
                    return;
                }
                kv[0] = "oauth_" + kv[0];
            }
            params.push(kv);
        });
    };
    pushQ(req.query);
    pushQ(auth, "isAuth");
    if (req.data && req.headers['Content-Type'] === "application/x-www-form-urlencoded") {
        pushQ(req.data);
    }
    if (req._oauth_params) {
        pushQ(req._oauth_params);
    }
    params = params.map(function (p) { return p.map(oauth.percentEncode); });
    var cmp = function (a, b) { return (a < b) ? -1 : ((a > b) ? 1 : 0); };
    params.sort(function (a, b) {
        return cmp(a[0], b[0]) || cmp(a[1], b[1]);
    });
    params = params.map(function (p) { return p[0] + '=' + p[1]; }).join('&');
    
    return [req.method, oauth.percentEncode(uri), oauth.percentEncode(params)].join('&');
};

oauth.authorizeHMAC = function (request, cred) {
    var crypto = require('crypto');     // only node.js supported (browser leaks client credentials)
    
    var auth = {
        version: "1.0",
        signature_method: "HMAC-SHA1"
    };
    auth.consumer_key = cred.client;
    if (cred.token) {
        auth.token = cred.token;
    }
    if (cred.realm) {
        auth.realm = cred.realm;
    }
    if (cred.no_version) {
      delete auth.version;
    }
    // NOTE: by my understanding, nonce does not have to be cryptographically random, just unique
    auth.timestamp = cred.test_timestamp || Math.round(Date.now() / 1000);     // override via `cred` ONLY for testing purposes!
    auth.nonce = cred.test_nonce || ('' + Math.round(Math.random() * 1e16) + Math.round(Math.random() * 1e16) + '');
    
    
    // http://tools.ietf.org/html/rfc5849#section-3.4.2
    var baseString = oauth.signatureBaseString(request, auth),
        key = oauth.percentEncode(cred.client_secret) + '&' + oauth.percentEncode(cred.token_secret || ''),
        hmac = crypto.createHmac('sha1', key);
    hmac.update(baseString);
    auth.signature = hmac.digest('base64');
    
    // http://tools.ietf.org/html/rfc5849#section-3.5.1
    return "OAuth " + Object.keys(auth).map(function (k) {
        var v = auth[k];
        if (k !== 'realm') {
            k = "oauth_" + k;
        }
        return oauth.percentEncode(k) + "=\"" + oauth.percentEncode(v) + "\"";
    }).join();
};

module.exports = oauth;
