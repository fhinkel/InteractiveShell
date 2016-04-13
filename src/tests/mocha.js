var assert = require("chai").assert;
var http = require('http');

describe('Array', function() {
  describe('The indexOf function', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1, 2, 3].indexOf(5));
      assert.equal(-1, [1, 2, 3].indexOf(0));
    });
    it('should be true', function() {
      assert(true);
    });
    it('should be accessible by index', function() {
      var a = {};
      a[5] = "number 5";
      assert.equal(a[1], null);
      assert.equal(a[5], "number 5");
    });
    it('should have length', function() {
      var a = [];
      assert.equal(a.length, 0);
      assert.equal([].length, 0);
      assert.equal(['one'].length, 1);
      a.push('1');
      assert.equal(a.length, 1);
    });
  });
  it('should print', function() {
    var a = [1, 2, 3];
  });
});

describe('assert.notEqual', function() {
  it('should make 1 not equal to null', function() {
    assert.notEqual(1, null);
  });
});


describe('regexsearch', function() {
  it('should find text between title tags', function(next) {
    var s = 'bla <title> blubb </title> blobber';
    var match = s.match(/<title>\s*([^\s]*)\s*<\/title>/);
    assert.equal(match[1], 'blubb');
    s = 'bla <title> blubb\n </title> blobber';
    match = s.match(/<title>\s*([^\s]*)\s*<\/title>/);
    assert.equal(match[1], 'blubb');
    next();
  });
  it('should find beginning of string', function(next) {
    var s = "hello world";
    assert(s.match(/^hello/));
    assert(!s.match(/^Hello/));
    next();
  });
  it('should find the path', function(next) {
    var url = "/M2-2812-0/blablubb";
    var imagePath = url.match(/^\/(user)?\d+\/(.*)/);
    url = "/2812/abunchofstuff/M2-2812-0/blablubb";
    imagePath = url.match(/^\/(user)?\d+\/(.*)/);
    assert.equal(imagePath[2], "abunchofstuff/M2-2812-0/blablubb");

    url = "file:///M2/share/doc/Macaulay2/Macaulay2Doc/html/_ring.html";
    imagePath = url.match(/^file:\/\/\/(.*)/);
    assert.equal(imagePath[1], "M2/share/doc/Macaulay2/Macaulay2Doc/html/_ring.html");
    assert.equal(url.match(/^file:\/\/(.*)/)[1], "/M2/share/doc/Macaulay2/Macaulay2Doc/html/_ring.html");
    next();
  });
});

describe.skip('Http server that echos hello world', function() {
  var server;
  before(function(done) {
    server = http.createServer(function(req, res) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Hello World\n');
    }).listen(1337, '127.0.0.1');
    server.on("listening", function() {
      done();
    });
  });

  after(function(done) {
    server.close();
    done();
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
        assert.equal(body, "Hello World\n");
        done();
      });
    });
  });
});

describe('coercion', function() {
  it("Should use empty String as false-y", function(done) {
    var empty = "";
    assert(empty == false);

    if (empty) {
      assert(false, 'Expected empty string to evaluate to false in condition');
    }

    if (!empty) {
      assert(true);
    } else {
      assert(false);
    }

    var notEmpty = "hello";

    if (notEmpty) {
      assert(true);
    }
    else {
      assert(false);
    }
    done();
  });

});




