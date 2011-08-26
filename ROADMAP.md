# Fermata v0.7 and beyond #

1. More sample plugins are needed, especially OAuth, to solidly prove that the plugin architecture in v0.6 will work for all use cases.

1. Should write some tests using the plugin architecture to verify more of the internals, and the plugin API itself.

1. It might also be nice to allow plugins to provide static utility functions, e.g. `var slug = fermata.blogposting.slugifyTitle("Here is a title");` Lame example. Maybe more useful would be static functions that take a URL as their first argument...or something?

1. Also, Fermata could maybe be easier to extend if it provided the "standard" JSON converter/error handling transport logic in an reusable form. Not quite sure how it would deal with header precedence and whatnot, but worth exploring...