# Fermata v0.7 and beyond #

1. More sample plugins are needed, especially OAuth, to solidly prove that the plugin architecture in v0.6 will work for all use cases.

1. Should write some tests using the plugin architecture to verify more of the internals, and the plugin API itself.

1. It might also be nice to allow plugins to provide static utility functions, e.g. `var slug = fermata.blogposting.slugifyTitle("Here is a title");` Lame example. Maybe more useful would be static functions that take a URL as their first argument...or something?

1. Also, Fermata could maybe be easier to extend if it provided the "standard" JSON converter/error handling transport logic in an reusable form. Not quite sure how it would deal with header precedence and whatnot, but worth exploring...


// transport chain [vs. plugin chain?]
(user) -> twitter -> oauth -> defaults -> (platform)


fermata.utils			// how can plugins use from inside their CommonJS module?
fermata.transports		// vs. plugins? vs. not exposing?

fermata.registerPlugin('twitter', twitter, oauth, dataTypes, statusErr)		// ick?
fermata.registerPlugin('twitter', twitterPlugin, ['oauth', 'dataTypes', 'statusErr'])		// still ick, and still complicates initialization architecture...
this.dependsOn('dataTypes')		// but we already have local transport variable!
transport = transport.via('oauth', config).via('dataTypes').via('statusErr')	// wrong order (platform transport not directly followed by oauth)
transport = transport.using('statusCheck').using('dataTypes').using('OAuth', config);	// (nicely encapsulates plugin dependencies, also allows plugins to setup multiple transports if needed!)

// above assumes a "naming authority" for plugins that will be used as dependencies...is that a reasonable expectation/tradeoff?
// we could work around in the future if necessary:
fermata.renamePlugin('oauth', 'OAuth-1.0a');
fermata.registerPlugin('twitter', twitterPlugin, {oauth:'OAuth-1.0a'});

// oh, and then!
transport = transport.using('base', url).using('defaults').using('oauth', credentials)
// voilá, no more need of this.base! is that a good thing™?
// hmmmm, nope: can't really use "base" as plugin since () needs full URL info to create string...