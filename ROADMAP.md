# Fermata v0.3 (0.5? 0.9?) #

Here are my notes on some upcoming design improvements (aka "breaking changes") that I've got planned for the next Fermata release or two. Hopefully these changes will put us close to something we can freeze as a stable 1.0 API.

## Cleaner API ##

The v0.2 interface is doin it rong:

    site.path.subpath.noun(callback)(headers).verb = data	// bwah?!

This is a cryptic, overzealous mis-wielding of harmony:proxies. Resources are NOUNs, methods are VERBs. JavaScript has nouns and verbs too:

    site.path.subpath.noun.verb([[headers,] data,] callback)

I think the clearest way of writing this in practice would be:

    (db._design.some_app._view.my_filter).get(callback)
    db._design.some_app._view.my_filter({limit:42}).get(callback)

Basically, when you provide a callback function it sort of "backtracks" and uses the last piece as the method instead of a path component.
This fairly consistent with how in JavaScript `a.b.c()` means do `c()` as a method of `a.b` (i.e. within `c`, `this` is `b`).


For the parenthetical (non-Proxy) fallback, I think we'll hardcode the four basic (GET/PUT/POST/DELETE) methods to keep it real:

    db("_design")("some_app")("_view")("my_filter").get(callback)
    // ...or the recommended alternative in this case:
    db(["_design/some_app/_view/my_filter"]).get(callback)



## Plugins ##

Many interesting REST APIs have more complicated authentication or might only speak XML.
Or maybe there's just a template-ish base URL pattern (e.g. "http://APIKEY:x@USERNAME.example.com/api/v3/") that we want to abstract a bit.

Since the promise of Fermata is a consistent direct-HTTP interface, we don't want to encourage site-specific *wrappers*.
Instead, we can let a SITE plugin fix up requests and responses, which can be handled by the platform's TRANSPORT plugin.

Plugin use cases:
- Abstract low-level protocol (XHR vs. http.request vs. test harness) [TRANSPORT]
- Handle custom authorization/headers (client certs, OAuth, OAuth2, FlickrAuth, etc.) [SITE]
- Format conversion (XML, www-form-urlencoded, etc.) [SITE]
- Better error handling (site-specific handling of 2xx vs. 4xx/5xx statuses instead of user needing to check raw code) [SITE]

Basic architecture:

    wrapper.method(headers, object, callback)
    ----
    request({method, path, query, headers, object})		// converts object to buffer, adds default headers, adds OAuth sig...
      transport({method, url, headers}, data)		// also pluggable (default to http.request/XHR)
    response(status, headers, data)			// checks status for error, converts buffer to object
    ----
    callback(error, object)

Potential setup/use:

    fermata = require('fermata')
    require('fermata-flickr').into(fermata, 'flickr')	// or some such
    api = fermata.site({ flickr: { user: u.id, key: u.token } })
