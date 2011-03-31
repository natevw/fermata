/*
var db = new fermata.Site({base_url:"http://localhost:5984/db"});

var app = db._design.world;
app['webgl.html'](function (code, value) {});

var stale = s._design.app._view({stale:'ok'})
stale.by_date({limit: 10})(function () {})
stale.by_date({limit: 10})(function () {}).method = body;

db[doc_id](function(code, value) {}).put = {};

url(cb);     // GET
url(query)(cb).method = body;

url(cb).post = data;
url(cb).post(data);
url(cb)({'Accept':'text/plain'}).get()


Site:
`new Site({base_url, default_headers, stringify, parse, request})`
`.url()` - URL wrapper
`.url(path[, query])` - absolute URL as string
`.stringify(obj)` - convert object to string/buffer
`.parse(string)` - convert string/buffer to object
`.request(method, obj, url, cb, headers)` - perform HTTP request

URL wrapper:
`()` - absolute URL as string
`(function)` - request targetting callback (GET by default)
`(object, function)` - request (PUT given data by default)
`(object)` - override query parameters
`(string/number[, bool])` - extend URL (opt: without encoding)
`[string]` - extend URL (with encoding)

Request object:
- automatically begins on next tick
`(object)` - override headers
`(string)` - overridden method function
`[string] = any` - method function, optionally assign request body
*/

var path = require('path'),
    url = require('url'),
    qs = require('querystring'),
    https = require('https'),
    http = require('http');

function extend(target, source) {
    for (key in source) {
        target[key] = source[key];
    };
    return target;
}

function Site(options) {
    extend(this, options);
    
    if (this.base_path && this.base_path.join) {
        this.base_path = this.base_path.join('/');
    }
    
    if (this.base_url) {
        this.url_parts = url.parse(this.base_url, true);
        if (this.url_parts.auth) {
            var auth = 'Basic ' + new Buffer(this.url_parts.auth).toString('base64');
            this.default_headers || (this.default_headers = {});
            extend(this.default_headers, {'Authorization': auth});
        }
        if (this.url_parts.query) {
            this.default_query || (this.default_query = {});
            extend(this.default_query, this.url_parts.query);
        }
        if (this.url_parts.pathname) {
            this.base_path = path.join(this.url_parts.pathname, this.base_path);
        }
    }
    
    this.base_path = path.resolve('/', this.base_path);
}
Site.prototype._url = function (rel_path, query) {
    if (rel_path.join) {
        rel_path = rel_path.join('/');
    }
    rel_path = path.resolve('/', rel_path);
    
    var query = extend(extend({}, this.default_query), arguments[1]);
    query = qs.stringify(query);
    if (query) {
        query = "?" + query;
    }
    return path.join(this.base_path, rel_path) + query;
}
Site.prototype.url = function () {
    if (!arguments.length) {
        // TODO: return URL wrapper
    } else {
        return url.format({
            protocol: this.url_parts.protocol,
            hostname: this.url_parts.hostname,
            port: this.url_parts.port,
            pathname: this._url(arguments[0], arguments[1])
        });
    }
};
Site.prototype.stringify = JSON.stringify;
Site.prototype.parse = JSON.parse;
Site.prototype.request = function (method, obj, rel_path, query, callback, headers) {
    method = method.toUpperCase();
    headers = extend(extend({
        'Content-Type': "application/json",
        'Accept': "application/json"
    }, this.default_headers), headers);
    
    var secure = (this.url_parts.protocol != 'http:');
    var req = ((secure) ? https : http).request({
        host: this.url_parts.hostname,
        port: this.url_parts.port,
        method: method,
        path: this._url(rel_path, query),
        headers: headers
    });
    
    if (obj) {
        var body = this.stringify(obj);
        req.setHeader('Content-Length', Buffer.byteLength(body));
        req.write(body);
    } else {
        req.setHeader('Content-Length', 0);
    }
    req.end();
    
    var this_parse = this.parse;
    req.on('error', function () {
        callback(0, null, "Connection error");
    });
    req.on('response', function (res) {
        res.setEncoding('utf8');
        var responseText = "";
        res.on('data', function (chunk) {
            responseText += chunk;
        });
        res.on('end', function () {
            var responseObj;
            try {
                responseObj = this_parse(responseText);
            } catch (e) {
                responseObj = null;
            }
            callback(res.statusCode, responseObj, responseText);
        });
    });
};

exports.Site = Site;