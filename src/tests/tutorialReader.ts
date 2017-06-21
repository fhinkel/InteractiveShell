import sinon = require("sinon");
import chai = require("chai");
const assert = chai.assert;
import * as reader from "../lib/tutorialReader";
import Tutorials = reader.Tutorials;

describe("GetListOfTutorials Module:", function() {
  let fs;
  let getList: reader.GetListFunction;

  before(function() {
    fs = require("fs");
    getList = reader.tutorialReader("public/public-Macaulay2/", fs);
  });

  describe("When we call getTutorialList on the real file system", function() {
    it("should get the list with welcome tutorials", function(done) {
      let spy;
      const response = {
        writeHead() {
        },
        end() {
          assert(spy.calledOnce);
          assert.include(spy.getCall(0).args[0], "welcome2.html");
          done();
        },
      };
      spy = sinon.spy(response, "end");
      getList(null, response);
    });
  });

  describe("GetTutorialList with a stubbed file system", function() {
    let readDirStub;
    let existsStub;

    beforeEach(function() {
      readDirStub = sinon.stub(fs, "readdir");
      existsStub = sinon.stub(fs, "exists");
    });

    afterEach(function() {
      readDirStub.restore();
      existsStub.restore();
    });

    it("should get the list with shared tutorials", function(done) {
      let spy;
      const response = {
        writeHead() {
        },
        end() {
          const expected = JSON.stringify([
            "tutorials/mock.html",
            "shared-tutorials/mock.html",
          ]);
          assert.equal(spy.args, expected);
          assert(spy.calledOnce);
          done();
        },
      };
      spy = sinon.spy(response, "end");

      readDirStub.yields(null, ["mock.html", "nothtml.foo"]);
      existsStub.yields(true);

      getList(null, response);
    });

    it("should get the list without shared tutorials", function(done) {
      let spy;
      const response = {
        writeHead() {
        },
        end() {
          const expected: string = JSON.stringify(["tutorials/mock.html"]);
          assert.equal(spy.args, expected);
          assert(spy.calledOnce);
          done();
        },
      };
      spy = sinon.spy(response, "end");

      readDirStub.yields(null, ["mock.html", "nothtml.foo"]);
      existsStub.onFirstCall().yields(true);
      existsStub.onSecondCall().yields(false);

      getList(null, response);
    });
  });

  describe("When calling moveWelcomeTutorialToBeginning", function() {
    it("should move the tutorial to the beginning", function() {
      const tutorials: Tutorials = ["a", "b", "c"];
      const sorted: Tutorials = reader.sortTutorials(tutorials, "b");
      assert.deepEqual(sorted, ["b", "a", "c"]);
    });
    it("should move the tutorial to the beginning and keep the others",
      function() {
        const tutorials: Tutorials = ["c", "b", "a"];
        const sorted: Tutorials = reader.sortTutorials(tutorials, "b");
        assert.deepEqual(sorted, ["b", "c", "a"]);
      });
    it("should move do nothing it index not found", function() {
      const tutorials: Tutorials = ["c", "b", "a"];
      const sorted: Tutorials = reader.sortTutorials(tutorials, "x");
      assert.deepEqual(sorted, ["c", "b", "a"]);
    });
  });
});
