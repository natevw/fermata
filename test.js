f = require("./fermata.js");
assert = require('assert');

f.api({url:"http://pdxapi.com/"}).bicycle_parking.geojson({bbox:"-122.6785969,45.5167974,-122.6763439,45.51772964"})

u = f.api({url:"http://example.com"});
assert.equal(u(), "http://example.com/");
assert.equal(u.folder(), "http://example.com/folder");
assert.equal(u.folder1.folder2(), "http://example.com/folder1/folder2");

u = f.api({url:"dotcom"});
assert.equal(u({q:"search term"})(), "dotcom/?q=search%20term");
assert.equal(u({opt:[0,1,2]})(), "dotcom/?opt=0&opt=1&opt=2");
assert.equal(u({$key:[1,2,3]})(), "dotcom/?key=%5B1%2C2%2C3%5D");
assert.equal(u({$$opt:[1,'two',3]})(), "dotcom/?%24opt=1&%24opt=two&%24opt=3");

u = f.api({url:"site"});
assert.equal(u.path.subpath({q1:"search", q2:"term"})(), "site/path/subpath?q1=search&q2=term");
assert.equal(u.path({q1:"search", q2:"term"}).subpath(), "site/path/subpath?q1=search&q2=term");
assert.equal(u.path({q1:"old", q2:"term"}).subpath({q1:"search"})(), "site/path/subpath?q1=search&q2=term");

// actual over-the-network test. (whines if NON-fermata stuff is down...)
var timeout = setTimeout(function () {
    assert.ok(false, "Callback not called before timeout.");
}, 2500);
f.api({url:"http://pdxapi.com/"}).bicycle_parking.geojson({bbox:"-122.6785969,45.5167974,-122.6763439,45.51772964"}).get(function (e, o) {
    clearTimeout(timeout);
    assert.ifError(e);
    assert.ok(o.update_seq);
});
