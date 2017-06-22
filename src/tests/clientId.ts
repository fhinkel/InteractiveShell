import assert = require("assert");
import clientIdHelper from "../lib/clientId";

// Suppressing the server output
process.env.NODE_ENV = "test";

describe("ClientId Module:", function() {
  let clientId;
  let clients;

  before(function() {
  });

  beforeEach(function() {
    clients = {
      totalUsers: 17,
      user16: {},
      user12: {},
    };
    clientId = clientIdHelper(clients, function() {
    });
  });

  describe("clientId.getNewId()", function() {
    it("should get a new id matching /user/", function() {
      assert(clientId.getNewId().match(/user\d+$/));
    });
  });
});
