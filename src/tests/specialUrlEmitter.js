var rewire = require('rewire');
var sinon = require('sinon');
var assert = require('chai').assert;

var specialUrlEmitterModule = rewire('../lib/specialUrlEmitter');

describe('SpecialUrlEmitter module:', function() {
  var specialUrlEmitter;
  var clients = {};
  before(function() {
    clients.user12 = {};
    var options = {};
    var staticFolder;
    var userSpecificPath;
    var sshCredentials = function() {};
    var logExceptOnTest;
    specialUrlEmitter = specialUrlEmitterModule(
        clients,
        options,
        staticFolder,
        userSpecificPath,
        sshCredentials,
        logExceptOnTest);
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

      specialUrlEmitter.emitEventUrlToClient("user12", "eventType", "data");

      revert();
    });
    it('can be called with user generated file', function() {
      var spy = sinon.spy();
      var revert = specialUrlEmitterModule.__set__("emitUrlForUserGeneratedFileToClient", spy);

      specialUrlEmitter.emitEventUrlToClient("user12", "eventType", "data");
      assert(spy.called, "emitUrlForUserGeneratedFileToClient was never called");

      revert();
    });
    it('emits correct URL for viewHelp', function() {
    });
  });
  describe('isSpecial()', function() {
    it('matches special data', function() {
      var data = ">>SPECIAL_EVENT_START>>special<<SPECIAL_EVENT_END";
      assert.equal(specialUrlEmitter.isSpecial(data), "special");
    });
    it('is false', function() {
      var data = ">>SPECIAL_EVENT_START>>";
      assert.isFalse(specialUrlEmitter.isSpecial(data),
          data + " should not be special.");
    });
  });
});
