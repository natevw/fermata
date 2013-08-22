# Preparing for a stable Fermata v1.0 #

1. Better support for binary responses [binary by default, plugin to convert to text!]

1. Better support for node.js streams [streams by default, plugin to convert to binary…?]

1. Handling for the default ".json" extensions and whatnot that many APIs like [plugin should set this.prepare like it does this.base, etc.]

1. Should write some tests using the plugin architecture to verify more of the internals, and the plugin API itself. [lol tests]

1. It might also be nice to allow plugins to provide static utility functions, e.g. `var slug = fermata.blogposting.slugifyTitle("Here is a title");` Lame example. Maybe more useful would be static functions that take a URL as their first argument...or something? [see CouchDB plugin]

1. Need anonymous plugins, and ability for user to override transport (see notes below)


{"other_field": "value", "file_field": [{"name": "type":"application/octet-stream", "data": }, {}] }

file = {name, type, data} // data following same text/bytes semantics as request (what about File type in browser, Stream in node.js?)



fermata(fermata.json(), fermata.followRedirects())

var url = fermata(function (transport, arg1, arg2) {
    transport = transport.using('statusCheck').using('autoConvert', "application/json").using(function () { /* … */ });
}, "stuff", "things");