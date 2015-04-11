var sinon = require('sinon');
var t = require('../lib/getListOfTutorials.js');
var assert = require('chai').assert;

describe.only('GetListOfTutorials Module test', function () {
    describe('When we call getTutorialList', function (done) {
        before(function() {

        });
        after(function() {


        });
        var fs = require('fs');
        it('should get the list', function (done) {
            var tutorials = t.Tutorials("public-Macaulay2/", fs);
            var response = {
                writeHead: function() {},
                end: function() {
                    assert(spy.calledOnce);
                    assert.include(spy.getCall(0).args[0], "welcome2.html");
                    done();
                }
            };
            var spy = sinon.spy(response, "end");
            tutorials.getList(null, response);
        });
        it('should get the list from mocked file system with shared tutorials', function (done) {
            var tutorials = t.Tutorials("public-Macaulay2/", fs);
            var response = {
                writeHead: function() {},
                end: function() {
                    var expected = JSON.stringify(["tutorials/mock.html",
                    "shared-tutorials/mock.html"
                    ]);
                    assert.equal(spy.args, expected);
                    assert(spy.calledOnce);
                    readdirStub.restore();
                    existsStub.restore();
                    done();
                }
            };
            var readdirStub = sinon.stub(fs, 'readdir');
            readdirStub.yields(null, ['mock.html', 'nothtml.foo']);
            var existsStub= sinon.stub(fs, 'exists');
            existsStub.yields(true);

            var spy = sinon.spy(response, "end");
            tutorials.getList(null, response);

        });
        it('should get the list from mocked file system without shared tutorials', function (done) {
            var tutorials = t.Tutorials("public-Macaulay2/", fs);
            var response = {
                writeHead: function() {},
                end: function() {
                    var expected = JSON.stringify(["tutorials/mock.html"]);
                    assert.equal(spy.args, expected);
                    assert(spy.calledOnce);
                    readdirStub.restore();
                    existsStub.restore();
                    done();
                }
            };
            var readdirStub = sinon.stub(fs, 'readdir');
            readdirStub.yields(null, ['mock.html', 'nothtml.foo']);
            var existsStub= sinon.stub(fs, 'exists');
            existsStub.onFirstCall().yields(true);
            existsStub.onSecondCall().yields(false);

            var spy = sinon.spy(response, "end");
            tutorials.getList(null, response);
        });
    });

    describe('When calling moveWelcomeTutorialToBeginning', function() {
        var fs = {};
        it('should move the tutorial to the beginning', function() {
            var tutorials = ['a', 'b', 'c'];
            var sorted = t.Tutorials("public-Macaulay2/", fs).sortTutorials(tutorials, 'b');
            assert.deepEqual(sorted, ['b', 'a', 'c']);
        });
        it('should move the tutorial to the beginning and keep the others', function() {
            var tutorials = ['c', 'b', 'a'];
            var sorted = t.Tutorials("public-Macaulay2/", fs).sortTutorials(tutorials, 'b');
            assert.deepEqual(sorted, ['b', 'c', 'a']);
        });
        it('should move do nothing it index not found', function() {
            var tutorials = ['c', 'b', 'a'];
            var sorted = t.Tutorials("public-Macaulay2/", fs).sortTutorials(tutorials, 'x');
            assert.deepEqual(sorted, ['c', 'b', 'a']);
        });
    });

    describe('Stringify', function() {
        it('should stringify an array to a string', function() {
            var tutorials = ["a", "b"];
            var message = JSON.stringify(tutorials);
            assert.equal(message, "[\"a\",\"b\"]");
        });
        it('should compare arrays', function() {
            var tutorials = ["a", "b"];
            assert.deepEqual(tutorials, ["a","b"]);
            assert.notDeepEqual(tutorials, ["b","a"]);
        });
    });
});
