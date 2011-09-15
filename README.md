# Fermata #

Fermata is a <del>node.js</del><ins>JavaScript</ins> REST library that lets you simply state your HTTP requests using clean syntax.

## Why? ##

Fermata magically provides a clean JavaScript interface for access to any REST interface.

Fermata works well in modern browsers and even better in [node.js](http://nodejs.org/).
Its API naturally matches the authoritative HTTP documentation, so you always have access to each of your REST interfaces' latest and greatest features.
The simple plugin interface makes it easy to provide site-specific defaults, and/or support servers that don't use the standard JSON data format.

Fermata makes URLs so elegant, there is no need to use — or maintain! — some one-off "wrapper library" for every different service. The differences are subtle, but the result is magic!


## Magic? ##

### Let's GET started ###

So you need to fetch a JSON resource from "http://youraccount.example.com/api/v3/frobbles"?

In Fermata, that's just:

    var site = fermata.json("http://youraccount.example.com");
    site.api.v3.frobbles.get(function (err, result) {
       console.log("Here are your frobbles, sir!", result);
    });

***Fermata turns URLs into native JavaScript objects!***
Each path part becomes a property, and so slashes in HTTP paths simply turn into dot operators on JavaScript objects. When you pass a callback function, Fermata uses the last method call as the request's method.
It really couldn't *get* much cleaner.

Need to add query parameters?

    var newAPI = site.api.v4;
    newAPI.frobbles({ perPage: 10, page: myPageNum }).get(myPageHandler);

This does a `GET` on `http://youraccount.example.com/api/v4/frobbles?perPage=10&page=N`, then asynchronously passes the response data to the `myPageHandler` callback function, parsed as an object.

### Browser behind the times? ###

Unfortunately, the examples above will only work in node.js and Firefox 4+. But don't worry!
In browsers without JavaScript's upcoming [Proxy](http://wiki.ecmascript.org/doku.php?id=harmony:proxies) feature you just need to use parentheses to form URLs, instead of dots:

    var newAPI = site('api')('v4');
    newAPI('frobbles')({ perPage: 10, page: myPageNum }).get(myPageHandler);

Note how the dot syntax does still work for the final `.get`; Fermata provides fallbacks for the basic HTTP methods until browsers catch up.


### PUT ###

Of course, it's also easy to *update* a REST resource with Fermata. Let's set some configuration on "http://youraccount.example.com/api/v3/whoozits/&lt;ID&gt;/repertoire":

    (site.api.v3.whoozits[i].repertoire).put({
        tricks: [1,2,3,4]
    }, function (error, result) {
        if (!error) {
            console.log("Configuration accepted for Whoozit #" + i);
        } else {
            console.warn(error);
        }
    });


### POST ###

When the HTTP documentation says something like, "To create a Quibblelog, POST it to /utils/quibblelogger":

    site.utils.quibblelogger.post({ message: "All your base.", level: 'stern warning' }, someCallback);

Or for cross-browser support:

   site('utils')('quibblelogger').post({ message: "All your base.", level: 'stern warning' }, someCallback);

Voilà!


## Plugins ##

Every time you initialize a new Fermata URL, you do so through a plugin. Fermata provides two built-in plugins:

1. `json` — initialized with a base URL string, then simply sends a JavaScript object to the server as a JSON string and expects that the server will reply with JSON too.
2. `raw` - gives more direct access, whatever text/byte data you pass gets sent verbatim and your callback gets the full response info. This is a handy way to start when adding new plugins (see below).

Many useful REST servers might talk in XML, or require that every request be specially signed with a secret key. Or maybe you just want to build the base URL string from higher-level settings.

Enter custom plugins.

For example, many of the ideas in Fermata originated in a [node.js Chargify library](https://github.com/andyet/node-chargify) we wrote for their [payment management API](http://docs.chargify.com/api-introduction).

Without plugins, setting up Fermata to connect to Chargify is totally possible...but kinda ugly:

    var acct = fermata.json({url:"http://" + api_key + ":x@" + site_name + ".chargify.com"});

With the old custom Chargify-specific library this was a lot cleaner:

    var acct = chargify.wrapSite(site_name, api_key);

...but of course if we stick with the old custom library, we then have to learn how to use its old custom interface (which was a bit confusing, and didn't support Fermata's dot syntax).

Plugins give us the best of both worlds. Fermata's one magical native API, with useful service-specific smoke and mirrors hiding backstage:

    var acct = fermata.chargify(site_name, api_key);
    // WHOOHOO NOW WE ARE MONEY MAKING!!!


There's a tiny bit of setup to use plugins from node.js, since Fermata can't *actually* read your mind:

    var f = require('fermata');
    require('fermata-chargify').init(f, 'billing');     // installs Chargify plugin into our Fermata module, optionally with a custom name.
    
    f.billing(site_name, api_key);

In the browser, just include any plugins after the script tag for Fermata, and each plugin will be accessible through its default name.

Since such a "fermata-chargify" plugin hasn't been published yet, we can just register its implementation directly:

    fermata.registerPlugin('myChargify', function (transport, name, key) {
        // setup our custom base URL
        this.base = "http://" + key + ":x@" + name + ".chargify.com";

        return function (request, callback) {
            // we can make usage much cleaner by automatically appending this extension
            request.path[request.path.length-1] += ".json";
            
            // the rest is "borrowed" from the built-in JSON plugin
            request.headers['Accept'] = "application/json";
            request.headers['Content-Type'] = "application/json";
            request.data = JSON.stringify(request.data);
            transport(request, function (err, response) {
                if (!err) {
                    if (response.status.toFixed()[0] !== '2') { err = Error("Bad status code from server: " + response.status); }
                    try {
                        response = JSON.parse(response.data);
                    } catch (e) { err = e; }
                }
                callback(err, response);
            });
        };
    });

Plugin support is still young, and it might be nice to make it easier for plugins to build off of e.g. common JSON, OAuth, etc. foundations in the future.
Take a look at the detailed documentation below for tips on publishing plugins that can be easily used from both node.js and the browser.


## Complete documentation ##

*NOTE*: this API may continue to [undergo refinement](https://github.com/andyet/fermata/blob/master/ROADMAP.md) until a stable 1.0 release.


### URL proxy ###

* `fermata.json(base_url)` - create a URL proxy object for base_url using the built-in 'json' plugin
* `()` - absolute URL as string
* `.method([headers, [data,]] function)` - request targetting callback
* `(string/array...[, object])` - general extension syntax, each type documented below
* `(object)` - override query parameters (see $key:value details below)
* `(array)` - extend URL with components (without encoding)
* `(string[, string...])` - extend URL (with encoding)
* `[string]` - extend URL (with encoding)

Once you create a URL wrapper, you can extend it in various ways:

    var api = fermata.json({url:"http://api.example.com:5984"});
    var eg1 = api.database._design.app._view.by_date;
    var eg2 = api['database']['_design']['app']['_view']['by_date'];
    var eg3 = api("database")("_design")("app")("_view", "by_date");
    var eg4 = api.database(["_design/app", "_view/by_date"]);

These all result in the same API endpoint. We can dump the URL as a string using an empty `()`:

    eg1() === eg2() === eg3() === eg4() === "http://api.example.com:5984/database/_design/app/_view/by_date";

At any point in the process, you can set query parameters (a leading '$' on a key forces JSON stringification of the value):

    var api = fermata.api({url:"http://api.example.com:5984", user:"myuser", password:"mypassword");
    var faster_queries = api({ stale: 'ok' });
    var always_include_docs = faster_queries.database({ include_docs: true });
    var some_app = always_include_docs({ reduce: false })._design.app;
    var recent_items = some_app(['_view/by_date'], { $endkey: [2011, 4, 1] });
    recent_items({ limit: 10 })() === "http://api.example.com:5984/database/_design/app/_view/by_date?stale=ok&include_docs=true&reduce=false&limit=10&endkey=%5B2011%2C4%2C1%5D";

Then, presto! To make a request on any Fermata URL, simply provide your response callback to the JavaScript method corresponding to the HTTP verb:
    
    api.database.get(logging_callback);
    
    var data = {};
    api.database.put(data, logging_callback);
    
    var headers = {};
    api.database.post(headers, data, logging_callback).post(data);
    
    // any method name can be used, not just the usual HTTP suspects
    api.database.copy({Destination: "new_database"}, null, logging_callback);


### Default plugins ###


Fermata provides two high-level plugins:

* `fermata.json("http://example.com")` - send/receive data objects as JSON
* `fermata.raw({base:"http://example.com"})` - expects string request data, returns raw response from the platform-level transport, e.g. `yourCallback(null, {status:418 headers:{}, data:"..."})`

There are also several builtin plugins that are primarily intended for chaining within your own plugins:

* `fermata.statusCheck()` - simple plugin that sets the callback error parameter if the response status code is not 2xx.
* `fermata.autoConvert([defaultType])` - converts request/response data between native JS data objects and common HTTP content types, using header fields (currently supports: "text/plain", "application/json", "application/x-www-form-urlencoded")
* `fermata.oauth({client, client_secret[, token, token_secret]})` - adds an OAuth authorization signature to the requests it transports


### Adding plugins ###

* `fermata.registerPlugin(name, setupFunction)` - register a plugin initialization function that receives the platform transport function. This function should set this.base and must return a (typically wrapped/extended) transport function.

When the user calls `fermata.yourplugin(...)` to create a new URL wrapper, Fermata sets up a base "transport" function for your plugin to use and calls `yourSetupFunction(transport, ...)` with a `this` object set to an empty "internal URL" dictionary.
You can *chain* plugins with the `.using(name, ...)` method on the transport object you receive. For example, if you want your requests to be processed by  
The "internal URL" contains a subset of the request parameters (`{base:"", path:[""], query:{}}`) that the user will be extending through Fermata's API. You can add defaults in your setup function, setting `this.base` to a specific service's API root for example.

Fermata plugins intended for cross-platform use should generally try to follow the following template:

    var fermata;
    (function () {
        var plugin = function (transport, baseURL) {                // A plugin is a setup function which receives a base "raw" HTTP transport, followed by each argument supplied to the fermata.plugin call.
            this.base = baseURL;				    // ...this setup function can set default base/path/query items, then must return the (typically wrapped) request transport function.
            transport = transport.using('statusCheck').using('autoConvert', "application/json");		// any registered plugin may be used
            return function (request, callback) {                   // request = {base, method, path, query, headers, data}
                req.path[req.path.length - 1] += ".json";           // NOTE: automatically adding an extension like this breaks the URL string Fermata automatically returns on `()` calls, and so this pattern will likely need to be replaced somehow before v1.0
                transport(req, function (err, response) {           // response = {status, headers, data}
                    callback(err, response);
                });
            };
        };
        
        // some boilerplate to deal with browser vs. CommonJS
        if (fermata) {
            fermata.registerPlugin("jsonExtension", plugin);
        } else {
            module.exports = plugin;
        }
    })();

As of Fermata v0.7, this plugin API may still need some improvement (=change) but the basic idea is that Fermata can easily delegate the interesting high-level decisions to logic customized for a particular REST server interface.


## Release Notes ##

* 0.1 - initial release
* 0.2 - Better docs, API tweaks
* 0.3 - URL.method() redesign
* 0.5 - Browser support
* 0.6 - Plugin architecture
* 0.7 - Plugin chaining

## Roadmap ##

* 0.8 - multipart/binary requests?
* ... - [feedback welcome](https://github.com/andyet/fermata/issues)!


## License ##

Written by [Nathan Vander Wilt](http://twitter.com/natevw).
Copyright © 2011 &yet, LLC. Released under the terms of the MIT License:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.