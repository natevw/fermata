var Proxy;
if (typeof window === 'undefined') {
    f = require("./fermata.js");
    assert = require('assert');
    Proxy = true;
} else {
    f = fermata;
    assert = {
        equal: function (a, b, msg) {
            if (a != b) {
                var e = Error(msg || [a,b].join(" != "));
                document.body.textContent += e;
                throw e;
            }
        },
        ok: function (a, msg) { assert.equal(Boolean(a), true, msg); },
        ifError: function (e, msg) { assert.equal(Boolean(e), false, msg); }
    };
}

u = f.raw({base:"http://example.com"});
if (Proxy) assert.equal(u(), "http://example.com");
if (Proxy) assert.equal(u.folder(), "http://example.com/folder");
if (Proxy) assert.equal(u.folder1.folder2(), "http://example.com/folder1/folder2");

u = f.raw({base:"http://localhost:5984/db"});
assert.equal(u('_design')('app')('_view')('by_date')(), "http://localhost:5984/db/_design/app/_view/by_date");
assert.equal(u('_design','app')(['_view/by_date'])(), "http://localhost:5984/db/_design/app/_view/by_date");
assert.equal(u(['_design','app','_view/by_date'])(), "http://localhost:5984/db/_design/app/_view/by_date");
assert.equal(u(['_design/app/_view/by_date'])(), "http://localhost:5984/db/_design/app/_view/by_date");

u = f.raw({base:"dotcom"});
assert.equal(u({q:"search term"})(), "dotcom?q=search%20term");
assert.equal(u({opt:[0,1,2]})(), "dotcom?opt=0&opt=1&opt=2");
assert.equal(u({$key:[1,2,3]})(), "dotcom?key=%5B1%2C2%2C3%5D");
assert.equal(u({$$opt:[1,'two',3]})(), "dotcom?%24opt=1&%24opt=two&%24opt=3");

u = f.raw({base:"site"});
if (Proxy) assert.equal(u.path.subpath({q1:"search", q2:"term"})(), "site/path/subpath?q1=search&q2=term");
if (Proxy) assert.equal(u.path({q1:"search", q2:"term"}).subpath(), "site/path/subpath?q1=search&q2=term");
if (Proxy) assert.equal(u.path({q1:"old", q2:"term"}).subpath({q1:"search"})(), "site/path/subpath?q1=search&q2=term");

u = f.raw({base:""});
assert.equal(u('abc', 'def', {q:123})(), "/abc/def?q=123");
assert.equal(u(['abc', 'def'], {q:123})(), "/abc/def?q=123");
assert.equal(u(['abc', 'def', {q:123}])(), "/abc/def/[object Object]");

// actual over-the-network test.
var timeout = setTimeout(function () {
    assert.ok(false, "Network request timed out.");
}, 2500);
f.json("http://pdxapi.com")('bicycle_parking')('geojson')({bbox:"-122.6785969,45.5167974,-122.6763439,45.51772964"}).get(function (e, o) {
    clearTimeout(timeout);
    assert.ifError(e, "Unsuccessful request; maybe network is down or browser blocks XHR cross-origin [informational]");
    assert.ok(o.update_seq);
});

assert.ok(Proxy, "no proxy support in this browser, tested fallback methods instead [informational]");