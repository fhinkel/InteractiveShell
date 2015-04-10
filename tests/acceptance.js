var assert = require("assert");
var http = require('http');
var mathServer = require('../lib/mathServer.js');

describe('Acceptance test', function (next) {
    describe('As basic behavior we', function (next) {
        it('should be able to create server and get title from html body', function (done) {
            var server = mathServer.MathServer({
                port: 8006,
                CONTAINERS: './sudo_docker_containers.js'
            });
            server.listen();
            http.get("http://127.0.0.1:8006", function (res) {
                res.on('data', function (body) {
                    var str = body.toString('utf-8');
                    var n = str.match(/<title>\s*([^\s]*)\s*<\/title>/);
                    assert.equal(n[1], 'Macaulay2');
                });
                res.on('end', function() {
                    server.close();
                    done();
                });
            });
        });
    });
});
