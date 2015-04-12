var assert = require('chai').assert;
var http = require('http');
var mathServer = require('../lib/mathServer.js');
var request = require('supertest');

process.env.NODE_ENV = 'test';

describe('Acceptance test', function () {
    var port = 8006;
    var server;

    before(function () {
        process.on('stdout', function(data) {
            console.log('**' + data);
        });
        process.on('stderr', function(data) {
            console.log('**' + data);
        });
        server = mathServer.MathServer({
            port: port,
            CONTAINERS: './dummy_containers.js'
        });
        server.listen();
    });

    after(function (done) {
        server.close();
        done();
    });

    describe('As basic behavior we', function () {
        it('should be able to create server and get title from html body', function (done) {
            http.get("http://127.0.0.1:" + port, function (res) {
                res.on('data', function (body) {
                    var str = body.toString('utf-8');
                    var n = str.match(/<title>\s*([^\s]*)\s*<\/title>/);
                    assert.equal(n[1], 'Macaulay2');
                    done();
                });
            });
        });
        it('should show title', function (done) {
            request = request('http://localhost:' + port);

            request.get('/').expect(200).end(function(error, result) {
                assert.match(result.text, /<title>\s*Macaulay2\s*<\/title>/);
                done();
            });

        });
    });
});
