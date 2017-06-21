var sinon = require('sinon');
var assert = require('chai').assert;
import * as reader from '../lib/tutorialReader';
import Tutorials = reader.Tutorials;

describe('GetListOfTutorials Module:', function() {
  var fs;
  var getList: reader.GetListFunction;

  before(function() {
    fs = require('fs');
    getList = reader.tutorialReader("public/public-Macaulay2/", fs);
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
      getList(null, response);
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

      getList(null, response);
    });

    it('should get the list without shared tutorials', function(done) {
      var spy;
      var response = {
        writeHead: function() {
        },
        end: function() {
          var expected : string = JSON.stringify(["tutorials/mock.html"]);
          assert.equal(spy.args, expected);
          assert(spy.calledOnce);
          done();
        }
      };
      spy = sinon.spy(response, "end");

      readDirStub.yields(null, ['mock.html', 'nothtml.foo']);
      existsStub.onFirstCall().yields(true);
      existsStub.onSecondCall().yields(false);

      getList(null, response);
    });
  });

  describe('When calling moveWelcomeTutorialToBeginning', function() {
    it('should move the tutorial to the beginning', function() {
      var tutorials : Tutorials = ['a', 'b', 'c'];
      var sorted : Tutorials = reader.sortTutorials(tutorials, 'b');
      assert.deepEqual(sorted, ['b', 'a', 'c']);
    });
    it('should move the tutorial to the beginning and keep the others',
      function() {
        var tutorials : Tutorials = ['c', 'b', 'a'];
        var sorted : Tutorials = reader.sortTutorials(tutorials, 'b');
        assert.deepEqual(sorted, ['b', 'c', 'a']);
      });
    it('should move do nothing it index not found', function() {
      var tutorials : Tutorials = ['c', 'b', 'a'];
      var sorted : Tutorials = reader.sortTutorials(tutorials, 'x');
      assert.deepEqual(sorted, ['c', 'b', 'a']);
    });
  });
});
