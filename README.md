# Fermata #

Fermata is a <del>node.js</del><ins>JavaScript</ins> library that lets you simply state your REST requests using JavaScript property "dot" syntax.


## Why? ##

Your REST service maintains authoritative documentation for their interface.
Their servers define the latest and greatest available featureset.
So why bother figuring out (or worse: maintaining!) an additional "wrapper library" layer over each of your favorite web APIs?

Fermata magically provides one clean, native JavaScript library for every REST interface.
It works in node.js, and it works in modern browsers (although using the property syntax requires FF4).
It's always got the REST interface's newest features, and its documentation is always the reference documentation.


## Magic? ##

### Let's GET started ###

So the REST API reference says "Our service base URL is http://youraccount.example.com/api. To lookup Frobble data GET /v3/frobbles".
In Fermata, that's just:

    var api = fermata.api({url:"http://youraccount.example.com/api"});
    (api.v3.frobbles).get(function (err, result) {
       console.log("Here are your frobbles, sir!", result);
    });

***Fermata turns URLs into native JavaScript objects!***
Subpaths are "dot syntax" properties, and a `GET` request is as easy as passing your "return value" callback to the `.get()` method on any Fermata URL.
It really couldn't *get* much cleaner.

Need to add query parameters? Append a dictionary object before providing the callback function:

    var newAPI = fermata.api({url:"http://youraccount.example.com"}).api.v4;
    newAPI.frobbles({ perPage: 10, page: myPageNum }).get(myPageHandler);

This does a `GET` on `http://youraccount.example.com/api/v4/frobbles?perPage=10&page=N` and returns the result via the asyncronous `myPageHandler` callback function.

### Browser behind the times? ###

Currently, the example above will only work in node.js and Firefox 4.
In browsers without JavaScript's upcoming [Proxy](http://wiki.ecmascript.org/doku.php?id=harmony:proxies) feature, you will need to use parentheses:

    var newAPI = fermata.api({url:"http://youraccount.example.com"})('api')('v4');
    newAPI('frobbles')({ perPage: 10, page: myPageNum }).get(myPageHandler);

Note how the dot syntax does still work for the final `.get`; Fermata provides fallbacks for the basic HTTP methods until browsers catch up.


### PUT ###

Okay? So your REST provider's documentation says "To teach a Whoozit new tricks, PUT them to /v3/whoozits/&lt;ID&gt;/repertoire":

    var api = fermata.api({url:"http://youraccount.example.com/api"});
    (api.v3.whoozits[myFavouriteWhoozit.api_id].repertoire).put({ tricks: [1,2,3,4] }, function (error, result) {
        if (!error) {
            console.log("Whoozit configuration accepted.");
        } else {
            console.warn(error);
        }
    });


### POST ###

"To create a Quibblelog, POST it to /utils/quibblelogger":

    var utils = fermata.api({url:"http://youraccount.example.com/api"});
    (utils.quibblelogger).post({ message: "All your base.", level: 'stern warning' }, someCallback);

Voilà!


## Plugins ##

By default, Fermata is initialized with a base URL and simply sends a JavaScript object to the server as a JSON string and expects that the server will reply with JSON too.
For many perfectly useful REST servers, this is too simple: they need to talk in XML, or require that every request be specially signed with a secret key, or maybe it's just that the base URL could be configured in higher-level terms.
Enter plugins.

For example, many of the ideas in Fermata originated in a [node.js Chargify library](https://github.com/andyet/node-chargify) we wrote for their [payment management API](http://docs.chargify.com/api-introduction).

Without plugins, setting up Fermata to connect to Chargify is totally possible...but kinda ugly:

    
    var chargifyAccount1 = chargify.wrapSite(site_name, api_key);
    var chargifyAccount2 = fermata.api({url:"http://" + api_key + ":x@" + site_name + ".chargify.com"});
    // ok now we have to choose which library to use...

Plugins give us the best of both worlds. Fermata's one magical native API, with useful service-specific smoke and mirrors hiding backstage:

    var chargifyAccount = fermata.chargify({site_name:site_name, api_key:api_key});
    // WHOOHOO NOW WE ARE MONEY MAKING!!!


There's a tiny bit of setup to use them from node.js, since Fermata can't *actually* read your mind:

    var f = require('fermata');
    require('fermata-chargify').init(f, 'billing');     // installs Chargify plugin into our local Fermata library, optionally with different name.
    
    f.billing({site_name:site_name, api_key:api_key});

In the browser, just include any plugins after the script tag for Fermata, and defaults will be used.


## Complete documentation ##

*NOTE*: this API may continue to [undergo refinement](https://github.com/andyet/fermata/blob/master/ROADMAP.md) until a stable 1.0 release.


### URL proxy ###

* `fermata.api({url:base_url, [user, password]})` - create a URL proxy object for base_url
* `()` - absolute URL as string
* `.method([headers, [data,]] function)` - request targetting callback
* `(object)` - override query parameters (see $key:value details below)
* `(array)` - extend URL with components (without encoding)
* `(string[, string...])` - extend URL (with encoding)
* `[string]` - extend URL (with encoding)


Once you create a URL wrapper, you can extend it in various ways:

    var api = fermata.api({url:"http://api.example.com:5984"});
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
    var recent_items = some_app._view.by_date({ $endkey: [2011, 4, 1] });
    recent_items({ limit: 10 })() === "http://api.example.com:5984/database/_design/app/_view/by_date?stale=ok&include_docs=true&reduce=false&limit=10&endkey=%5B2011%2C4%2C1%5D";

Then, presto! To make a request on a Fermata URL, simply provide your response callback to the JavaScript method corresponding to the HTTP verb:
    
    api.database.get(logging_callback);
    
    var data = {};
    api.database.put(data, logging_callback);
    
    var headers = {};
    api.database.post(headers, data, logging_callback).post(data);
    
    // any method name can be used, not just the usual HTTP suspects
    api.database.copy({Destination: "new_database"}, null, logging_callback);


### Writing plugins ###

Fermata plugins should generally try to follow the following template:

    var fermata;
    (function () {
        var plugin = {
            // shared "base" state can be stored when a new URL is made via the plugin name, e.g. `fermata.api({url:"http://example.com"})`
            name: "api",
            baseURL: null,
            setup: function (config) {
                this.baseURL = config.url;
            },
            
            // three basic methods for customizing what happens between the native/client code and the network/server communication
            bufferType: 'text',                                     // this plugin transports UTF-8 strings, vs. 'bytes' (=Buffer in Node, UInt8Array in supporting DOM, Array otherwise)
            translateRequest: function (data, request) {            // request = {method, url={protocol, hostname, port, path, query}, headers}
                request.headers['Content-Type'] = "application/json";
                return JSON.stringify(data);
            },
            transport: function (request, buffer, callback) {       // callback = (response, buffer)
                request.url = request.url.resolve(this.base_url);
                request.headers['Accept'] = "application/json";
                request.send(buffer, callback);
            },
            translateResponse: function (buffer, response) {        // reponse = {request, status, headers}
                if (response.status.toFixed()[0] !== '2') {
                    throw Error("Bad status code from server: " + response.status);
                }
                return JSON.parse(buffer);
            }
        };
        
        // some boilerplate to deal with CommonJS vs. browser
        if (fermata) {
            fermata.registerPlugin(plugin);
        } else {
            exports.init = function (fermata, name) { fermata.registerPlugin(plugin, name); }
        }
    })();

As of Fermata v0.6, this plugin API is still likely to need improvement (=change) but the basic idea is that Fermata can delegate the interesting high-level decisions to logic customized for a particular REST server interface.


## Release Notes ##

* 0.1 - initial release
* 0.2 - Better docs, API tweaks
* 0.3 - URL.method() redesign
* 0.5 - Browser support
* 0.6 - Plugin architecture


## Roadmap ##

* 0.7 - more plugin samples+refinement?
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