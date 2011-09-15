# Fermata v0.7 and beyond #

1. Binary data, especially files via Content-Type: form/multipart-data

1. "Dynamic" url strings, or some better pattern for handling the default ".json" extensions and whatnot that many APIs like

1. Should write some tests using the plugin architecture to verify more of the internals, and the plugin API itself.

1. It might also be nice to allow plugins to provide static utility functions, e.g. `var slug = fermata.blogposting.slugifyTitle("Here is a title");` Lame example. Maybe more useful would be static functions that take a URL as their first argument...or something?



{"other_field": "value", "file_field": [{"name": "type":"application/octet-stream", "data": }, {}] }

file = {name, type, data} // data following same text/bytes semantics as request (what about File type in browser, Stream in node.js?)
