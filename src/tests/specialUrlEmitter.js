require("../startupConfigs/default.js").getConfig({}, function(options) {
  var rewire = require('rewire');
  var sinon = require('sinon');
  var assert = require('chai').assert;

  var specialUrlEmitterModule = rewire('../lib/specialUrlEmitter');

  describe('SpecialUrlEmitter module:', function() {
    var specialUrlEmitter;
    before(function() {
      var pathPrefix;
      var sshCredentials = function() {
      };
      var logFunction = function() {
      };
      specialUrlEmitter = specialUrlEmitterModule(
        pathPrefix,
        sshCredentials,
        logFunction, 
        function() {},
        options);
    });

    describe('emitEventUrlToClient()', function() {
      it('can be called', function() {
        var connection = {
          on: function() {
          },
          connect: function() {
          }
        };
        var ssh2 = function() {
          return connection;
        };

        var revert = specialUrlEmitterModule.__set__("ssh2", ssh2);

        specialUrlEmitter.emitEventUrlToClient("user12", "eventType", "", "");

        revert();
      });

      it('should call emit for file', function() {
        var spy = sinon.spy();
        var revert = specialUrlEmitterModule
          .__set__("emitUrlForUserGeneratedFileToClient", spy);

        specialUrlEmitter.emitEventUrlToClient("user12", "eventType", "");
        assert(spy.called, "emitUrlForUserGeneratedFile was never called");

        revert();
      });

      it('can be called with viewHelp', function() {
        var connection = {
          on: function() {
          },
          connect: function() {
          }
        };
        var ssh2 = function() {
          return connection;
        };

        var revert = specialUrlEmitterModule.__set__("ssh2", ssh2);

        var revertIsViewHelpEvent = specialUrlEmitterModule
          .__set__("isViewHelpEvent", function() {
            return true;
          });

        specialUrlEmitter.emitEventUrlToClient("user12", "eventType", "");

        revert();
        revertIsViewHelpEvent();
      });

      it('emits correct URL for viewHelp', function() {
        var spy = sinon.spy();
        var revert = specialUrlEmitterModule
          .__set__("emitHelpUrlToClient", spy);

        var revertIsViewHelpEvent = specialUrlEmitterModule
          .__set__("isViewHelpEvent", function() {
            return true;
          });

        specialUrlEmitter.emitEventUrlToClient("user12", "eventType", "");
        assert(spy.called, "emitHelpUrlToClient was never called");

        revert();
        revertIsViewHelpEvent();
      });
    });
    describe('isSpecial()', function() {
      it('should match special data', function() {
        var data = ">>SPECIAL_EVENT_START>>special<<SPECIAL_EVENT_END<<";
        assert.equal(specialUrlEmitter.isSpecial(data), "special");
      });
      it('should return false', function() {
        var data = ">>SPECIAL_EVENT_START>>";
        assert.isFalse(specialUrlEmitter.isSpecial(data),
          data + " should not be special.");
      });
    });
    describe('isViewHelpEvent', function() {
      var isViewHelpEvent;
      before(function() {
        isViewHelpEvent = options.help.isViewHelpEvent;
      });
      it('should match on file:', function() {
        var data = "file:";
        assert.isTrue(isViewHelpEvent(data));
      });
      it('should match on file:something', function() {
        var data = "file:something";
        assert.isTrue(isViewHelpEvent(data));
      });
      it('should not match', function() {
        var data = "somethingfile:";
        assert.isFalse(isViewHelpEvent(data));
      });
      it('should not on empty string', function() {
        var data = "";
        assert.isFalse(isViewHelpEvent(data));
      });
    });
  });
});
