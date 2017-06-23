import rewire = require("rewire");
import sinon = require("sinon");
import chai = require("chai");
const assert = chai.assert;

const fileUploadModule = rewire("../lib/fileUpload.ts");

describe("FileUpload module:", function() {
  let fileUpload;
  before(function() {
    fileUpload = fileUploadModule({});
  });

  describe("attachUploadListenerToSocket()", function() {
    it("can be called", function() {
      const socket = {
        on() {
        },
      };
      fileUpload.attachUploadListenerToSocket(undefined, socket);
    });
  });
});
