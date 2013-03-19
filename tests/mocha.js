var assert = require("assert");
var http = require('http');
var m2server = require('../m2server');

describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
    it('should be true', function() {
        assert(true);
    }); 
  })
})

describe('assert.not.equal', function() {
    it('should make 1 not equal to null', function() {
        assert.notEqual(1, null);
    })
})


describe('m2server', function(){
    it('should be available as a variable', function(){
        var server = new M2Server();
        assert.notEqual(server, null);
    })
})

describe('testserver', function() {
    var server;
    before(function(done) {
        var http = require('http');
        server = http.createServer(function (req, res) {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end('Hello World\n');
        }).listen(1337, '127.0.0.1');
        console.log('Server running at http://127.0.0.1:1337/');
        
        server.on("listening", function() {
            console.log("started");
            done();
        });
    });
    it("Should fetch /", function(done) {
        http.get("http://localhost:1337/", function(res) {
            assert.equal(res.statusCode, 200);
            done();
        });
    });
    it("Should fetch Hello World", function(done) {
        http.get("http://localhost:1337/", function(res) {
            res.on('data', function(body) {
                console.log(body);
                assert.equal(body, "Hello World\n");
                done();
            });
        });
    });
        
    after(function(done){
      server.close();
      console.log("stopped");
      done();
    });
});



