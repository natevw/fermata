var oauth = require('./oauth');
var assert = require('assert');


// from http://tools.ietf.org/html/rfc5849#page-20
assert.equal(
    oauth.signatureBaseString({base: "http://example.com", method:"POST", path:["request"], query:{b5:"=%3D", a3:"a", 'c@':'', a2:"r b"}, headers:{"Content-Type":"application/x-www-form-urlencoded"}, data:{c2:'', a3:"2 q"}}, {consumer_key:"9djdj82h48djs9d2", token:"kkk9d7dh3k39sjv7", timestamp:137131201, nonce:"7d8f3e4a", signature_method:"HMAC-SHA1"}),
    "POST&http%3A%2F%2Fexample.com%2Frequest&a2%3Dr%2520b%26a3%3D2%2520q%26a3%3Da%26b5%3D%253D%25253D%26c%2540%3D%26c2%3D%26oauth_consumer_key%3D9djdj82h48djs9d2%26oauth_nonce%3D7d8f3e4a%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D137131201%26oauth_token%3Dkkk9d7dh3k39sjv7" 
);

// from http://tools.ietf.org/html/rfc5849#page-6
assert.ok(
    oauth.authorizeHMAC(
        {base: "http://photos.example.net", method:"GET", path:["photos"], query:{file:"vacation.jpg", size:"original"}, headers:{}},
        {realm: "Photos", client:"dpf43f3p2l4k3l03", client_secret:"kd94hf93k423kf44", token:"nnch734d00sl2jdk", token_secret:"pfkkdhi9sl3r4s00", test_timestamp:137131202, test_nonce:"chapoH"}
    ).indexOf('oauth_signature="74KNZJeDHnMBp0EMJ9ZHt%2FXKycU%3D"') !== -1
);

assert.ok(False);   // TODO: test form encoding

