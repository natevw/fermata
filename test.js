var Proxy = function () { if ('Proxy' in this) return this.Proxy; }();
if (typeof window === 'undefined') {
    f = require("./fermata.js");
    assert = require('assert');
    if (!Proxy) try {
        Proxy = require('node-proxy');
    } catch (e) {}
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

if (f.oauth) assert.equal(    // from http://tools.ietf.org/html/rfc5849#page-20
    f.plugins.oauth.signatureBaseString({base: "http://example.com", method:"POST", path:["", "request"], query:{b5:"=%3D", a3:"a", 'c@':'', a2:"r b"}, headers:{"Content-Type":"application/x-www-form-urlencoded"}, data:{c2:'', a3:"2 q"}}, {consumer_key:"9djdj82h48djs9d2", token:"kkk9d7dh3k39sjv7", timestamp:137131201, nonce:"7d8f3e4a", signature_method:"HMAC-SHA1"}),
    "POST&http%3A%2F%2Fexample.com%2Frequest&a2%3Dr%2520b%26a3%3D2%2520q%26a3%3Da%26b5%3D%253D%25253D%26c%2540%3D%26c2%3D%26oauth_consumer_key%3D9djdj82h48djs9d2%26oauth_nonce%3D7d8f3e4a%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D137131201%26oauth_token%3Dkkk9d7dh3k39sjv7" 
);
if (f.oauth) assert.ok(       // from http://tools.ietf.org/html/rfc5849#page-7
    f.plugins.oauth.authorizeHMAC(
        {base: "http://photos.example.net", method:"GET", path:["", "photos"], query:{file:"vacation.jpg", size:"original"}, headers:{}},
        {realm: "Photos", client:"dpf43f3p2l4k3l03", client_secret:"kd94hf93k423kf44", token:"nnch734d00sl2jdk", token_secret:"pfkkdhi9sl3r4s00", test_timestamp:137131202, test_nonce:"chapoH", no_version:true}
    ).indexOf('oauth_signature="MdpQcU8iPSUjWoN%2FUDMsK2sui9I%3D"') !== -1
);

// actual over-the-network test.
var timeout = setTimeout(function () {
    assert.ok(false, "Network request timed out.");
}, 2500);
f.json("http://ipcalf.com").get(function (e, d) {
    clearTimeout(timeout);
    assert.ifError(e, "Unsuccessful request; maybe network is down or browser blocks XHR cross-origin [informational]");
    assert.ok(d);
});

assert.ok(Proxy, "no proxy support in this browser, tested fallback methods instead [informational]");