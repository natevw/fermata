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
    if (req.headers['Content-Type'] === "application/x-www-form-urlencoded") {
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

oauth.authorizeHMAC = function (request, auth, secrets) {
    auth.signature_method = "HMAC-SHA1";
    
    // NOTE: by my understanding, nonce does not have to be cryptographically random, just unique
    auth.timestamp = Date.now() / 1000;
    auth.nonce = '' + Math.round(Math.random() * 1e16) + Math.round(Math.random() * 1e16) + '';
    
    var baseString = oauth.baseString(request, auth);
    auth.signature = "THEN A MIRACLE HAPPENS";  // TODO: miracle
    
    // http://tools.ietf.org/html/rfc5849#section-3.5.1
    return "OAuth " + Object.keys(auth).map(function (k) {
        var v = auth[k];
        if (k !== 'realm') {
            k = "oauth_" + k;
        }
        return oauth.percentEncode(k) + "=\"" + oauth.percentEncode(v) + "\"";
    }).join();
};


function twitterPlugin(transport, client_key, request_token, secrets) {
    this.base = "https://api.twitter.com";
    
    return function (req, cb) {
        var auth = {consumer_key:client_key};
        if (request_token) {
            auth.token = request_token;
        }
        req.headers['Content-Type'] = "application/x-www-form-urlencoded";
        req.headers['Authorization'] = oauth.authorizeHMAC(req, auth, secrets);
        // http://www.w3.org/TR/1998/REC-html40-19980424/interact/forms.html#h-17.13.4.1
        // http://www.w3.org/TR/html5/association-of-controls-and-forms.html#application-x-www-form-urlencoded-encoding-algorithm
        req.data = oauth.listQuery(req.data).map(function (kv) {
            return encodeURIComponent(kv[0].replace(/ /g, '+')) + '=' + encodeURIComponent(kv[1].replace(/ /g, '+'));
        }).join("&");
        transport(req, cb);
    };
}

var ours = oauth.signatureBaseString({base: "http://example.com", method:"POST", path:["request"], query:{b5:"=%3D", a3:"a", 'c@':'', a2:"r b"}, headers:{"Content-Type":"application/x-www-form-urlencoded"}, data:{c2:'', a3:"2 q"}}, {consumer_key:"9djdj82h48djs9d2", token:"kkk9d7dh3k39sjv7", timestamp:137131201, nonce:"7d8f3e4a", signature_method:"HMAC-SHA1"});
var docs = "POST&http%3A%2F%2Fexample.com%2Frequest&a2%3Dr%2520b%26a3%3D2%2520q%26a3%3Da%26b5%3D%253D%25253D%26c%2540%3D%26c2%3D%26oauth_consumer_key%3D9djdj82h48djs9d2%26oauth_nonce%3D7d8f3e4a%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D137131201%26oauth_token%3Dkkk9d7dh3k39sjv7";
console.log(ours);
console.log(docs);
console.log(ours===docs);