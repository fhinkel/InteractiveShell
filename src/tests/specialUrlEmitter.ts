
import rewire = require("rewire");
import sinon = require("sinon");
import chai = require("chai");
const assert = chai.assert;

require("../startupConfigs/default.ts").getConfig({}, function(options) {
  const specialUrlEmitterModule = rewire("../lib/specialUrlEmitter.ts");

  describe("SpecialUrlEmitter module:", function() {
    let specialUrlEmitter;
    before(function() {
      let pathPrefix;
      const sshCredentials = function() {
      };
      const logFunction = function() {
      };
      specialUrlEmitter = specialUrlEmitterModule(
        pathPrefix,
        sshCredentials,
        logFunction,
        function() {},
        options);
    });

    describe("emitEventUrlToClient()", function() {
      it("can be called", function() {
        const connection = {
          on() {
          },
          connect() {
          },
        };
        const ssh2 = function() {
          return connection;
        };

        const revert = specialUrlEmitterModule.__set__("ssh2", ssh2);

        specialUrlEmitter.emitEventUrlToClient("user12", "eventType", "", "");

        revert();
      });

      it("should call emit for file", function() {
        const spy = sinon.spy();
        const revert = specialUrlEmitterModule
          .__set__("emitUrlForUserGeneratedFileToClient", spy);

        specialUrlEmitter.emitEventUrlToClient("user12", "eventType", "");
        assert(spy.called, "emitUrlForUserGeneratedFile was never called");

        revert();
      });

      it("can be called with viewHelp", function() {
        const connection = {
          on() {
          },
          connect() {
          },
        };
        const ssh2 = function() {
          return connection;
        };

        const revert = specialUrlEmitterModule.__set__("ssh2", ssh2);

        const originalIsViewHelpEvent = options.help.isViewHelpEvent;
        options.help.isViewHelpEvent = function() {
          return true;
        };
        specialUrlEmitter.emitEventUrlToClient(
          "user12", "eventType", "");

        revert();
        options.help.isViewHelpEvent = originalIsViewHelpEvent;
      });

      it("emits correct URL for viewHelp", function() {
        const spy = sinon.spy();
        const originalEmitHelpUrlToClient = options.help.emitHelpUrlToClient;
        options.help.emitHelpUrlToClient = spy;
        const originalIsViewHelpEvent = options.help.isViewHelpEvent;
        options.help.isViewHelpEvent = function() {
          return true;
        };

        specialUrlEmitter.emitEventUrlToClient("user12", "eventType", "");
        assert(spy.called, "emitHelpUrlToClient was never called");
        options.help.emitHelpUrlToClient = originalEmitHelpUrlToClient;
        options.help.isViewHelpEvent = originalIsViewHelpEvent;
      });
    });
    describe("isSpecial()", function() {
      it("should match special data", function() {
        const data = ">>SPECIAL_EVENT_START>>special<<SPECIAL_EVENT_END<<";
        assert.equal(specialUrlEmitter.isSpecial(data), "special");
      });
      it("should return false", function() {
        const data = ">>SPECIAL_EVENT_START>>";
        assert.isFalse(specialUrlEmitter.isSpecial(data),
          data + " should not be special.");
      });
    });
    describe("isViewHelpEvent", function() {
      let isViewHelpEvent;
      before(function() {
        isViewHelpEvent = options.help.isViewHelpEvent;
      });
      it("should match on file:", function() {
        const data = "file:";
        assert.isTrue(isViewHelpEvent(data));
      });
      it("should match on file:something", function() {
        const data = "file:something";
        assert.isTrue(isViewHelpEvent(data));
      });
      it("should not match", function() {
        const data = "somethingfile:";
        assert.isFalse(isViewHelpEvent(data));
      });
      it("should not match on empty string", function() {
        const data = "";
        assert.isFalse(isViewHelpEvent(data));
      });
    });
  });
});
