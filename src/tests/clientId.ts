let assert = require("chai").assert;
let rewire = require("rewire");

describe("ClientId Module:", function() {
  let clientId;
  let clients;
  let clientIdModule;
  let exists;
  let logFunction;

  before(function() {
    clientIdModule = rewire("../lib/clientId.ts");
    exists = clientIdModule.__get__("exists");
    logFunction = function() {};
  });

  beforeEach(function() {
    clients = {
      totalUsers: 17,
      user16: {},
      user12: {},
    };
    clientId = clientIdModule(clients, function() {
    });
  });

  describe("clientId.getNewId()", function() {
    it("should get a new id matching /user/", function() {
      assert.match(clientId.getNewId(), /user\d+$/);
    });
  });
  describe("exists()", function() {
    it("should return true", function() {
      assert.isTrue(exists("user16", clients, logFunction));
    });
    it("should return false", function() {
      assert.isFalse(exists("user345", clients, logFunction));
    });
  });
});
