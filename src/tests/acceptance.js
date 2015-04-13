var assert = require('chai').assert;
var http = require('http');
var mathServer = require('../lib/mathServer.js');
var request = require('supertest');
var jsdom = require("jsdom");
var fs = require('fs');

process.env.NODE_ENV = 'test';

describe('Acceptance test', function () {
    var port = 8006;
    var server;
    var jquery;

    before(function (done) {
        server = mathServer.MathServer({
            port: port,
            CONTAINERS: './dummy_containers.js'
        });
        server.listen();
        request = request('http://localhost:' + port);
        jquery = fs.readFileSync(__dirname + "/../../public/jquery-ui-1.10.2.custom/js/jquery-1.9.1.js", "utf-8");
        done();
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
            request.get('/').expect(200).end(function (error, result) {
                jsdom.env(
                    result.text,
                    {src: [jquery]},
                    function (errors, window) {
                        var title = window.$("title").text();
                        assert.match(title, /\s*Macaulay2\s*/);
                        done();
                    }
                );
            });
        });
        it('should get statistics', function (done) {
            request.get('/admin').expect(200).end(function (error, result) {
                jsdom.env(
                    result.text,
                    {src: [jquery]},
                    function (errors, window) {
                        var header = window.$("h1").text();
                        assert.equal(header, "Macaulay2 User Statistics");
                        done();
                    }
                );
            });
        });
        it('should get the list of tutorials', function (done) {
            request.get('/getListOfTutorials').expect(200).end(function (error, result) {
                var tutorialList = JSON.parse(result.text);
                var expected = "tutorials/welcome2.html";
                assert.include(tutorialList, expected);
                done();
            });
        });
    });
});
