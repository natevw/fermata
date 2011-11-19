// get these via http://www.flickr.com/services/apps/create/ and keep them secret!
APP_KEY = "";
SECRET = "";

// set this path to an image you want to share on Flickr
FILE = "/Users/yourname/Sample Photograph.JPG";



var f = require('fermata'),
    r = require('fermata/plugins/flickr');
f.registerPlugin('flickr', r);


// boring example, just fetches a bit of public data
f.flickr({client:APP_KEY, client_secret:SECRET}).rest({method:"flickr.panda.getList"}).get(function (e, d) {
    console.log(e,d);
});

// this example requires a bit of manual intervention for OAuth delegation
var CREDS = {client:APP_KEY, client_secret:SECRET},
    public_flickr = f.flickr(CREDS);
public_flickr.oauth.request_token({oauth_callback:"oob"}).get(function (e,d) {
    console.log(e,d);
    CREDS.token = d.oauth_token;
    CREDS.token_secret = d.oauth_token_secret;
    
    // this logs the URL you must visit to approve the rest of the example...
    console.log("\n\nPls to visit the following URL and bring back a verification code:");
    console.log(f.flickr({}).oauth.authorize({oauth_token:d.oauth_token, perms:"write"})());
    
    // ...paste back the verification code you get from Flickr to continue
    var i = require('readline').createInterface(process.stdin, process.stdout, null);
    i.question("Verification please? ", function(verifier) {
        i.close();
        process.stdin.destroy();
        f.flickr(CREDS).oauth.access_token({oauth_verifier:verifier}).get(function (e,d) {
            console.log(e,d);
            CREDS.token = d.oauth_token;
            CREDS.token_secret = d.oauth_token_secret;
            var my_flickr = f.flickr(CREDS);            // now that we have full credentials, setup a reusable "logged-in" Flickr API client
            
            // upload the FILE above into your Flickr account
            var upload_form = {
                photo: {name:"Fermata upload example.", type:"image/jpeg", data:require('fs').readFileSync(FILE)},
                description: "This image was uploading using https://github.com/andyet/fermata — a simple yet powerful HTTP client for HTML5 and node.js!"
            };
            my_flickr.upload.post({'Content-Type':"multipart/form-data"}, upload_form, function (e,d) {
                //console.log(e,d);
            });
            
            // show your favorites information
            my_flickr.rest({method:"flickr.favorites.getList"}).get(function (e,d) {
                console.log(e,d);
            });
        });
    });
});
