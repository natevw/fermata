// for http://docs.chargify.com/api-resources

module.exports = function chargifyPlugin(transport, site_name, api_key) {
    this.base = "https://" + api_key + ":x@" + site_name + ".chargify.com";
    transport = transport.using('statusCheck').using('autoConvert', "application/json");
    return function (req, callback) {
        req.path[req.path.length - 1] += ".json";
        transport(req, callback);
    };
};
