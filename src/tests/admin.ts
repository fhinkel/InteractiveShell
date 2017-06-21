import sinon = require("sinon");
import chai = require("chai");
const assert = chai.assert;
import rewire = require("rewire");

describe("Admin Module:", function() {
  let admin;
  let clients;
  let adminModule;

  before(function() {
    adminModule = rewire("../lib/admin.ts");
  });

  beforeEach(function() {
    clients = {
      user16: {},
      user12: {},
    };
    admin = adminModule(clients, 17, "MyProgram");
  });

  describe("Admin.stats()", function() {
    it("should get the stats", function(done) {
      let spy;
      const response = {
        writeHead(statusCode, headers) {
          assert.equal(statusCode, 200);
          assert.deepEqual(headers, {"Content-Type": "text/html"});
        },
        write() {
        },
        end() {
          const arg = '<head>\n    <link rel="stylesheet" ' +
              'href="mathProgram.css" type="text/css"\n        ' +
              'media="screen">\n</head>\n<h1>\n    MyProgram User ' +
              "Statistics\n</h1>\nThere are currently 2 users using " +
              "MyProgram.\n<br>\nIn total, there were 17 new users " +
              "since\n the server started.\n<br>\nEnjoy MyProgram!";

          assert.equal(spy.firstCall.args[0], arg);

          done();
        },
      };
      spy = sinon.spy(response, "write");
      admin.stats(null, response);
    });
  });
  describe("Number of current users", function() {
    it("should be correct", function() {
      const currentUsers = adminModule.__get__("currentUsers");
      assert.equal(currentUsers(clients), 2);
    });
  });
  describe("Number of total users", function() {
    it("should be correct", function() {
      const totalUsers = adminModule.__get__("totalUsers");
      assert.equal(totalUsers, 17);
    });
  });
  describe("Adding new users", function() {
    it("should change the stats", function() {
      const newUserId = "user100";
      clients[newUserId] = {};
      const currentUsers = adminModule.__get__("currentUsers");
      assert.equal(currentUsers(clients), 3);
    });
  });
  describe("Deleting users", function() {
    it("should change the stats", function() {
      delete clients.user12;
      const currentUsers = adminModule.__get__("currentUsers");
      assert.equal(currentUsers(clients), 1);
    });
  });
  describe("Deleting users", function() {
    it("should not change total users", function() {
      delete clients.user12;
      const totalUsers = adminModule.__get__("totalUsers");
      assert.equal(totalUsers, 17);
    });
  });
});
