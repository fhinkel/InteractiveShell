var assert = require("assert");
var http = require('http');
var mathServer = require('../lib/mathServer.js');
var sinon = require('sinon');

describe.only('MathServer Module test', function () {
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
            server.getListOfTutorials(null, response);
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
