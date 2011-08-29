var oauth = {};

oauth.percentEncode = function (s) {
    return encodeURIComponent(s).replace(/!/g, '%21').replace(/\*/g, '%2A').replace(/'|'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
};

oauth.listQuery = function (q) {
    var list = [];
    Object.keys(q).forEach(function (k) {
        var v = q[k];
        if (k[0] === '$') {
            k = k.slice(1);
            if (k[0] !== '$') {
                v = JSON.stringify(v);
            }
        }
        [].concat(v).forEach(function (v) {
            list.push([k, (v !== null) ? ''+v : '']);
        });
    });
    return list;
};

oauth.signatureBaseString = function (req, auth) {
    // http://tools.ietf.org/html/rfc5849#section-3.4.1
    
    // base string URI
    var uri = req.base + '/' + req.path.map(function (c) {
        return (c.join) ? c.join('/') : encodeURIComponent(c);
    }).join('/');
    // TODO: make sure scheme/host are lowercase, remove default ports if necessary
    
    // request parameters
    var params = [];
    var pushQ = function (q, isAuth) {
        oauth.listQuery(q).forEach(function (kv) {
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
    
    var auth = {signature_method:"HMAC-SHA1"};
    auth.consumer_key = cred.client;
    if (cred.token) {
        auth.token = cred.token;
    }
    if (cred.realm) {
        auth.realm = cred.realm;
    }
    // NOTE: by my understanding, nonce does not have to be cryptographically random, just unique
    auth.timestamp = cred.test_timestamp || (Date.now() / 1000);     // override via `cred` ONLY for testing purposes!
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

function twitterPlugin(transport, cred) {    // credentials = {client, client_secret, token, token_secret}
    this.base = "https://api.twitter.com";
    
    return function (req, cb) {
        req.headers['Content-Type'] = "application/x-www-form-urlencoded";
        req.headers['Authorization'] = oauth.authorizeHMAC(req, cred);
        // http://www.w3.org/TR/1998/REC-html40-19980424/interact/forms.html#h-17.13.4.1
        // http://www.w3.org/TR/html5/association-of-controls-and-forms.html#application-x-www-form-urlencoded-encoding-algorithm
        req.data = req.data && oauth.listQuery(req.data).map(function (kv) {
            return encodeURIComponent(kv[0].replace(/ /g, '+')) + '=' + encodeURIComponent(kv[1].replace(/ /g, '+'));
        }).join("&");
        transport(req, cb);
    };
}

module.exports = oauth;
exports.plugin = twitterPlugin;

