var assert = require('assert');

var getIpFromUrl = function(url) {
    matchObject = url.match(/\/IP-(\d+\.\d+\.\d+\.\d+)-/);
    if (!matchObject) {
        console.log("error, could not find IP from url");
        throw ("could not find IP from url");
    }
    return matchObject[1];
};

describe('matchobject', function() {

    before( function() {
        console.log("we do the before setup");
    });

    it('should find url', function(){
        var url = 'http://bal/blubb/IP-123.0.0.1-/whupp';
        var ip = getIpFromUrl(url);
        assert.equal(ip, "123.0.0.1", "find url");
    });

    it('should find throw because abc', function(){
        var url = 'http://bal/blubb/IP-abc-/whupp';
        assert.throws( function() {
            var ip = getIpFromUrl(url);
        });
    });

    it('should find throw because no dot', function(){
        var url = 'http://bal/blubb/IP-123-/whupp';
        assert.throws( function() {
            var ip = getIpFromUrl(url);
        });
    });

    after( function() {

    });
});