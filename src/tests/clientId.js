var sinon = require('sinon');
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
    it('should get a new id', function() {
      sinon.stub(Math, 'random').returns(345 / 1000000);
      assert.equal(clientId.getNewId(), "user345");
      Math.random.restore();
    });
    it('should not reuse existing ids', function() {
      sinon.stub(Math, 'random')
          .onFirstCall().returns(16 / 1000000)
          .onSecondCall().returns(345 / 1000000);
      assert.equal(clientId.getNewId(), "user345");
      Math.random.restore();
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
