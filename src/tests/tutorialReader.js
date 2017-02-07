var sinon = require('sinon');
var assert = require('chai').assert;

describe('GetListOfTutorials Module:', function() {
  var fs;
  var directoryReader;

  before(function() {
    fs = require('fs');
    directoryReader = require('../lib/tutorialReader.js')(
        "public/public-Macaulay2/", fs);
  });

  describe('When we call getTutorialList on the real file system', function() {
    it('should get the list with welcome tutorials', function(done) {
      var spy;
      var response = {
        writeHead: function() {
        },
        end: function() {
          assert(spy.calledOnce);
          assert.include(spy.getCall(0).args[0], "welcome2.html");
          done();
        }
      };
      spy = sinon.spy(response, "end");
      directoryReader.getList(null, response);
    });
  });

  describe('GetTutorialList with a stubbed file system', function() {
    var readDirStub;
    var existsStub;

    beforeEach(function() {
      readDirStub = sinon.stub(fs, 'readdir');
      existsStub = sinon.stub(fs, 'exists');
    });

    afterEach(function() {
      readDirStub.restore();
      existsStub.restore();
    });

    it('should get the list with shared tutorials', function(done) {
      var spy;
      var response = {
        writeHead: function() {
        },
        end: function() {
          var expected = JSON.stringify([
            "tutorials/mock.html",
            "shared-tutorials/mock.html"
          ]);
          assert.equal(spy.args, expected);
          assert(spy.calledOnce);
          done();
        }
      };
      spy = sinon.spy(response, "end");

      readDirStub.yields(null, ['mock.html', 'nothtml.foo']);
      existsStub.yields(true);

      directoryReader.getList(null, response);
    });

    it('should get the list without shared tutorials', function(done) {
      var spy;
      var response = {
        writeHead: function() {
        },
        end: function() {
          var expected = JSON.stringify(["tutorials/mock.html"]);
          assert.equal(spy.args, expected);
          assert(spy.calledOnce);
          done();
        }
      };
      spy = sinon.spy(response, "end");

      readDirStub.yields(null, ['mock.html', 'nothtml.foo']);
      existsStub.onFirstCall().yields(true);
      existsStub.onSecondCall().yields(false);

      directoryReader.getList(null, response);
    });
  });

  describe('When calling moveWelcomeTutorialToBeginning', function() {
    it('should move the tutorial to the beginning', function() {
      var tutorials = ['a', 'b', 'c'];
      var sorted = directoryReader.sortTutorials(tutorials, 'b');
      assert.deepEqual(sorted, ['b', 'a', 'c']);
    });
    it('should move the tutorial to the beginning and keep the others',
        function() {
          var tutorials = ['c', 'b', 'a'];
          var sorted = directoryReader.sortTutorials(tutorials, 'b');
          assert.deepEqual(sorted, ['b', 'c', 'a']);
        });
    it('should move do nothing it index not found', function() {
      var tutorials = ['c', 'b', 'a'];
      var sorted = directoryReader.sortTutorials(tutorials, 'x');
      assert.deepEqual(sorted, ['c', 'b', 'a']);
    });
  });
});
