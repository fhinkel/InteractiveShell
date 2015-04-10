var assert = require("assert");
var http = require('http');
var mathServer = require('../lib/mathServer.js');
var sinon = require('sinon');

describe('MathServer Module test', function () {
    describe('When we call getTutorialList', function (next) {
        it('should get the list', function (done) {
            var server = mathServer.MathServer();
            var response = {
                writeHead: function() {},
                end: function() {
                    assert(spy.withArgs(sinon.match(/tutorials\/welcome2.html/)).calledOnce);
                    done();
                }
            };
            var spy = sinon.spy(response, "end");
            var fs = require('fs');
            server.getListOfTutorials(fs)(null, response);
        });
        it('should get the list from mocked file system with shared tutorials', function (done) {
            var server = mathServer.MathServer();
            var response = {
                writeHead: function() {},
                end: function() {
                    var expected = JSON.stringify(["tutorials/mock.html",
                    "shared-tutorials/mock.html"
                    ]);
                    assert(spy.withArgs(expected).calledOnce);
                    readdirStub.restore();
                    existsStub.restore();
                    done();
                }
            };
            var fs = require('fs');
            var readdirStub = sinon.stub(fs, 'readdir');
            readdirStub.yields(null, ['mock.html', 'nothtml.foo']);
            var existsStub= sinon.stub(fs, 'exists');
            existsStub.yields(true);

            var spy = sinon.spy(response, "end");
            server.getListOfTutorials(fs)(null, response);

        });
        it('should get the list from mocked file system without shared tutorials', function (done) {
            var server = mathServer.MathServer();
            var response = {
                writeHead: function() {},
                end: function() {
                    var expected = JSON.stringify(["tutorials/mock.html"]);
                    assert(spy.withArgs(expected).calledOnce);
                    readdirStub.restore();
                    existsStub.restore();
                    done();
                }
            };
            var fs = require('fs');
            var readdirStub = sinon.stub(fs, 'readdir');
            readdirStub.yields(null, ['mock.html', 'nothtml.foo']);
            var existsStub= sinon.stub(fs, 'exists');
            existsStub.yields(false);

            var spy = sinon.spy(response, "end");
            server.getListOfTutorials(fs)(null, response);
        });
    });

    describe('When calling moveWelcomeTutorialToBeginning', function() {
        it('shoud move the tutorial to the beginning', function() {
            var server = mathServer.MathServer();
            var tutorials = ['a', 'b', 'c'];
            var sorted = server.sortTutorials(tutorials, 'b');
            assert.equal(JSON.stringify(sorted), JSON.stringify(['b', 'a', 'c']));
        });
        it('shoud move the tutorial to the beginning and keep the others', function() {
            var server = mathServer.MathServer();
            var tutorials = ['c', 'b', 'a'];
            var sorted = server.sortTutorials(tutorials, 'b');
            assert.equal(JSON.stringify(sorted), JSON.stringify(['b', 'c', 'a']));
        });
        it('shoud move do nothing it index not found', function() {
            var server = mathServer.MathServer();
            var tutorials = ['c', 'b', 'a'];
            var sorted = server.sortTutorials(tutorials, 'x');
            assert.equal(JSON.stringify(sorted), JSON.stringify(['c', 'b', 'a']));
        });
    });

    describe('Stringify', function() {
        it('should stringify an array', function() {
            var tutorials = ["a", "b"];
            var message = JSON.stringify(tutorials);
            console.log(message);
            assert.equal(message, "[\"a\",\"b\"]");
        })
    });
});
