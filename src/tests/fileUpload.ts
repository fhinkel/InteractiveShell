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
  describe("completeFileUpload()", function() {
    it("can be called", function() {
      const completeFileUpload = fileUploadModule.__get__("completeFileUpload");

      const connection = {
        on() {
        },
        connect() {
        },
      };
      const ssh2 = function() {
        return connection;
      };

      const spy = sinon.spy(connection, "connect");

      const revert = fileUploadModule.__set__("ssh2", ssh2);

      const client = {};

      const sshCredentials = function() {
      };

      completeFileUpload(client, sshCredentials)();
      assert(spy.called, "connection.connect() was never called");

      revert();
    });
  });
});
