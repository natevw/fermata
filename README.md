Fermata is a REST client library for node.js that allows succinct URL formation and access via the power of [harmony:proxies](http://wiki.ecmascript.org/doku.php?id=harmony:proxies).

## Example usage ##

Basic setup and GET request:

    var server = new fermata.Site({base_url:"http://localhost:5984"});
    var db = server.url().dev;	// create URL wrapper around /dev database
    
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


## License ##

Written by Nathan Vander Wilt.
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