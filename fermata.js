/*

## Example usage ##


Basic setup and GET request:

    var server = new fermata.Site({base_url:"http://localhost:5984/"});
    var db = server.url().dev;
    var views = db._design.glob._view;
    views['by_date']({$startkey: [2010], reduce:false, limit:2})(function (status, result) { console.log(status, result); });
    // 200 with a few items


Storing query parameters, getting raw URL:

    var stale = views({stale:'ok', reduce:false});
    stale.by_date({limit: 10})();
    // "http://localhost:5984/dev/_design/glob/_view/by_date?stale=ok&reduce=false&limit=10"

POST request, assigning data:

    var doc = {_id:"example", content:42};
    db(function(code, value) { console.log(code); doc._rev = value.rev; }).post = doc;
    // 201 once doc has been added to db

PUT request shortcut:

    doc.content = 43;
    db[doc._id](doc, function(code, value) { console.log(code); })
    // 201 if we waited for post above to complete


## Documentation ##

Site:

* `new Site({base_url, base_path, default_headers, stringify, parse, request})`
* `.url()` - URL wrapper
* `.url(path[, query])` - absolute URL as string
* `.stringify(obj)` - convert object to string/buffer
* `.parse(string)` - convert string/buffer to object
* `.request(method, obj, url, cb, headers)` - perform HTTP request

URL wrapper:

* `()` - absolute URL as string
* `(function)` - request targetting callback (GET by default)
* `(object, function)` - request (PUT given data by default)
* `(object)` - override query parameters
* `(string/number[, bool])` - extend URL (opt: without encoding)
* `[string]` - extend URL (with encoding)

Request object:

* \- automatically begins on next tick
* `(object)` - override headers
* `(string)` - overridden method function
* `[string] = any` - method function, optionally assign request body

*/

var Proxy = require('node-proxy');
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

function fermatable(impl) {
    // for some reason node/node-proxy calls "inspect" and "constructor" a ton without provocation...
    var PASSTHROUGH = {inspect:true, constructor:true};
    return Proxy.createFunction({
        // NOTE: node-proxy has a different set of required handlers than harmony:proxies proposal
        getOwnPropertyDescriptor: function (name) {
            var desc = Object.getOwnPropertyDescriptor(impl, name);
            if (desc) { desc.configurable = true; }
            return desc;
        },
        enumerate: function () { return []; },
        delete: function () { return false; },
        fix: function () {},
        
        get: function (target, name) {
            if (PASSTHROUGH[name]) {
                return impl[name];
            } else {
                return impl(name);
            }
        },
        
        set: function (target, name, val) {
            if (PASSTHROUGH[name]) {
                impl[name] = val;
            } else {
                impl(name)(val);
            }
        }
    }, impl);
}

var counter = 0;
function makeWrapper(site, pathArray, query) {
    return fermatable(function () {
        if (arguments.length === 0) {
            return site.url(pathArray, query);
        } else if (arguments.length === 1 && typeof(arguments[0]) === 'function') {
            return startRequest(site, pathArray, query, arguments[0], 'GET', {}, null);
        } else if (arguments.length === 1 && typeof(arguments[0]) === 'object') {
            var extendedQuery = extend(extend({}, query), arguments[0]);
            return makeWrapper(site, pathArray, extendedQuery);
        } else if (arguments.length === 2 && typeof(arguments[1]) === 'function') {
            return startRequest(site, pathArray, query, arguments[1], 'PUT', {}, arguments[0]);
        } else if (typeof(arguments[0]) !== 'function') {
            var component;
            if (arguments[1]) {
                component = '' + arguments[0];
            } else {
                component = encodeURIComponent(arguments[0]);
            };
            var extendedPathArray = pathArray.concat(component);
            return makeWrapper(site, extendedPathArray, query);
        }
    });
}

function startRequest(site, pathArray, query, callback, method, headers, data) {
    process.nextTick(function () {
        site.request(method, data, pathArray, query, callback, headers);
    });
    
    var headerify;
    return headerify = fermatable(function () {
        if (typeof(arguments[0]) === 'object') {
            extend(headers, arguments[0]);
            return headerify;
        } else if (typeof(arguments[0]) === 'string') {
            method = arguments[0];
            return function (setData) {
                data = setData;
            };
        }
    });
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
    Object.keys(query).forEach(function (key) {
        if (key[0] !== '$') return;
        
        var realKey = key.slice(1);
        if (key[1] !== '$') {
            query[realKey] = JSON.stringify(query[key]);
        } else {
            query[realKey] = query[key];
        }
        delete query[key];
    });
    query = qs.stringify(query);
    if (query) {
        query = "?" + query;
    }
    return path.join(this.base_path, rel_path) + query;
};
Site.prototype.url = function () {
    if (!arguments.length) {
        return makeWrapper(this, [], {});
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
