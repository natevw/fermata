/* CouchDB (and friends) plugin for Fermata, with preliminary support for change events and default base URL.

Example use:
    <script src="fermata.js"></script>
    <script src="plugins/couchdb.js"></script>
    <script>
        var db = fermata.couchdb()('dev');      // db() === "http://localhost:5984/dev"
        fermata.plugins.couchdb.watchChanges(db, 50000, function (r) {
            console.log("Got change results:", r);
        });
    </script>
*/

var fermata;
(function () {
    var plugin = function (transport, url) {
        // TODO: better URL guessing (especially if window.location is available)
        this.base = url || "http://localhost:5984";
        return transport.using('statusCheck').using('autoConvert', "application/json");
    };
    
    plugin.watchChanges = function (db, lastSeq, callback, interval) {
        var currentSeq = lastSeq,
            DEFAULT_DELAY = interval || 100,
            backoff = DEFAULT_DELAY,
            feedType = (interval) ? 'normal' : 'longpoll',
            activeRequest = null,
            cancelled = false;
        function poll() {
            /* Deal with effects of IE caching — will poll rapidly once IE decides to screw up
               as described in e.g. http://www.dashbay.com/2011/05/internet-explorer-caches-ajax/ */
            // NOTE: see also https://issues.apache.org/jira/browse/COUCHDB-257 (shouldn't have been closed?!)
            db = db({nocache:Math.random()});
            activeRequest = db('_changes', {feed:feedType, $since:currentSeq}).get(function (e,d) {
                activeRequest = null;
                if (cancelled) return;
                else if (e) {
                    if (console && console.warn) console.warn("Couldn't fetch CouchDB _changes feed, trying again in ", backoff, " milliseconds.", e, d);
                    setTimeout(poll, backoff);
                    if (!interval) backoff *= 2;
                } else {
                    backoff = DEFAULT_DELAY;
                    if (d.results.length) try {
                        callback(d.results);
                    } catch (e) {
                        if (console && console.warn) console.warn("CouchDB _changes callback handler threw exception", e);
                    }
                    currentSeq = d.last_seq;
                    setTimeout(poll, backoff);
                }
            });
        }
        setTimeout(poll, 0);        // starting this after script completes helps avoid "progress" indicators
        return function () {
            cancelled = true;
            if (activeRequest) activeRequest.abort();
        };
    };
    
    // some boilerplate to deal with browser vs. CommonJS
    if (fermata) {
        fermata.registerPlugin("couchdb", plugin);
    } else {
        module.exports = plugin;
    }
})();