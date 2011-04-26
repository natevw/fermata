# Fermata #

Fermata is a node.js library that lets you simply state your REST requests using JavaScript property "dot" syntax.


## Why? ##

Your REST service maintains authoritative documentation for their interface.
Their servers define the latest and greatest available featureset.
So why bother figuring out (or worse: maintaining!) an additional "wrapper library" layer over each of your favorite web APIs?

Fermata magically provides one clean, native JavaScript library for every REST interface.
It's never missing the newest features, and its documentation is always the reference documentation.


## Magic? ##

### Let's GET started ###

So the documentation says "Our service base URL is http://youraccount.example.com/api. To lookup Frobble data GET /v3/frobbles".
In Fermata, that's just:

    var api = fermata.site("http://youraccount.example.com/api");
    api.v3.frobbles(function (status, result) {
       console.log("Here are your frobbles, sir!", result);
    });

Fermata turns the REST server into a native JavaScript ([proxy](http://wiki.ecmascript.org/doku.php?id=harmony:proxies)) object. Paths in the URL become "dotted" property lookups, and a `GET` request is as easy as passing a result callback to any path component.
It really couldn't get much cleaner.

Need to add query parameters? Append a dictionary object before providing the callback function:

    var newAPI = fermata.site("http://youraccount.example.com").api.v4;
    newAPI.frobbles({ perPage: 10, page: myPageNum })(myPageHandler);

This does a `GET` on `http://youraccount.example.com/api/v4/frobbles?perPage=10&page=N` and returns the result via the asyncronous `myPageHandler` callback function.


### PUT ###

So the documentation says "To teach a Whoozit new tricks, PUT data to /v3/whoozits/<ID>/repertoire":

    var api = fermata.site("http://youraccount.example.com/api");
    api.v3.whoozits[myFavoriteWhoozit.api_id].repertoire({ tricks: [1,2,3,4] }, function (status, result) {
        if (status === 201) {
            console.log("Whoozit configuration accepted.");
        } else {
            console.warn("Those tricks were not tricksy enough.");
        }
    });


### POST ###

"To create a Quibblelog, POST it to /utils/quibblelogger":

    var utils = fermata.site("http://youraccount.example.com/api");
    utils.quibblelogger(someCallback).post({ message: "All your base.", level: 'stern warning' });

Voilà!


## Complete documentation ##

### URL proxy ###

* `fermata.site(base_url)` - create a URL proxy object for base_url (handles basic auth!)
* `()` - absolute URL as string
* `(function)` - request targetting callback (GET by default)
* `(object, function)` - request (PUT given data by default)
* `(object)` - override query parameters (see $key:value details below)
* `(string/number[, bool])` - extend URL (opt: without encoding)
* `[string]` - extend URL (with encoding)


Once you create a URL wrapper, you can extend it in various ways:

    var api = fermata.site("http://user:pass@api.example.com:5984");
    var ex1 = api.database._design.app._view.by_date;
    var ex2 = api['database']['_design']['app']['_view']['by_date'];
    var ex3 = api("database")("_design")("app")("_view")("by_date");

These all result in the same API endpoint. We can dump the URL as a string using an empty `()`:

    ex1() === ex2() === ex3() === "http://api.example.com:5984/database/_design/app/_view/by_date";

At any point in the process, you can build query parameters (a leading '$' on a key forces JSON stringification of the value):

    var api = fermata.site("http://user:pass@api.example.com:5984");
    var faster_queries = api({ stale: 'ok' });
    var always_include_docs = faster_queries.database({ include_docs: true });
    var some_app = always_include_docs({ reduce: false })._design.app;
    var recent_items = some_app._view.by_date({ $endkey: [2011, 4, 1] });
    recent_items({ limit: 10 })() === "http://api.example.com:5984/database/_design/app/_view/by_date?stale=ok&include_docs=true&reduce=false&limit=10&endkey=%5B2011%2C4%2C1%5D";
    
As soon as you pass a function to the wrapper, you get back a request object instead of another URL wrapper:

    function logging_callback(status, response) {
        console.log(status, response);
    }
    var req = api.database(logging_callback);   // `req` object now follows the API below, instead


### Request object ###

* \- automatically begins on next tick
* `(object)` - override headers
* `(string)` - overridden method function
* `[string] = any` - method function, optionally assign request body

Hey presto, if you don't override the default request method or headers or data, Fermata will start a basic GET request soon after control returns to the event loop. 
    
    var get = api.database(logging_callback);
    
    var data = {};
    var put1 = api.database(data, logging_callback);
    var put2 = api.database(logging_callback).put(data);
    var put3 = api.database(logging_callback).put = data;
    
    var post1 = api.database(logging_callback).post(data);
    var post2 = api.database(logging_callback).post = data;

You can set custom headers before choosing a method, and you aren't limited to basic HTTP methods either:
    
    var custom_post = api.database(logging_callback)({'X-Requested-With': "XMLHttpRequest"}).post = data;
    var webdav_like = api.database(logging_callback)({Destination: "new_database"}).copy();


## Roadmap ##

1. Better support for non-JSON APIs (you can currently pass custom converter functions to `fermata.site(url, {stringify: objToXML, parse: xmlToObj})` but this might not be good enough?)
1. OAuth library integration. Many popular APIs require signed requests; we should pick a good OAuth library and integrate the necessary hooks from within Fermata.
1. Browser support? (especially if harmony:proxies and CORS catch on.)
1. ??? - feedback welcome!


## License ##

Written by [Nathan Vander Wilt](http://github.com/natevw).
Copyright © 2011 by &yet, LLC. Released under the terms of the MIT License:

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