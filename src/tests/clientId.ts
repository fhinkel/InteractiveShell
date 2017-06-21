var assert = require('chai').assert;
var rewire = require('rewire');

describe('ClientId Module:', function() {
  var clientId;
  var clients;
  var clientIdModule;
  var exists;
  var logFunction;

  before(function() {
    clientIdModule = rewire('../lib/clientId.ts');
    exists = clientIdModule.__get__("exists");
    logFunction = function() {};
  });

  beforeEach(function() {
    clients = {
      totalUsers: 17,
      user16: {},
      user12: {}
    };
    clientId = clientIdModule(clients, function() {
    });
  });

  describe('clientId.getNewId()', function() {
    it('should get a new id matching /user/', function() {
      assert.match(clientId.getNewId(), /user\d+$/);
    });
  });
  describe('exists()', function() {
    it('should return true', function() {
      assert.isTrue(exists("user16", clients, logFunction));
    });
    it('should return false', function() {
      assert.isFalse(exists("user345", clients, logFunction));
    });
  });
});
