var sinon = require('sinon');
var assert = require('chai').assert;
var rewire = require('rewire');

describe('Admin Module:', function() {
  var admin;
  var clients;
  var options;
  var adminModule;

  before(function() {
    options = {
      MATH_PROGRAM: "MyProgram"
    };
    adminModule = rewire('../lib/admin.js');
  });

  beforeEach(function() {
    clients = {
      totalUsers: 17,
      user16: {},
      user12: {}
    };
    admin = adminModule(clients, options);
  });

  describe('Admin.stats()', function() {
    it('should get the stats', function(done) {
      var spy;
      var response = {
        writeHead: function(statusCode, headers) {
          assert.equal(statusCode, 200);
          assert.deepEqual(headers, {"Content-Type": "text/html"});
        },
        write: function() {
        },
        end: function() {
          assert.equal(spy.callCount, 5);

          var firstArgument = "<head><link rel=\"stylesheet\" " +
              "href=\"mathProgram.css\" " +
              "type=\"text/css\" " +
              "media=\"screen\"></head>";
          assert.equal(spy.firstCall.args[0], firstArgument);

          var secondArgument = "<h1>MyProgram User Statistics</h1>";
          assert.equal(spy.secondCall.args[0], secondArgument);

          var thirdArgument = "There are currently 2 users " +
              "using MyProgram.<br>";
          assert.equal(spy.thirdCall.args[0], thirdArgument);

          var fourthArgument = "In total, there were 17 new " +
              "users since the server started.<br>";
          assert.equal(spy.getCall(3).args[0], fourthArgument);

          done();
        }
      };
      spy = sinon.spy(response, "write");
      admin.stats(null, response);
    });
  });
  describe('Number of current users', function() {
    it('should be correct', function() {
      var currentUsers = adminModule.__get__("currentUsers");
      assert.equal(currentUsers(clients), 2);
    });
  });
  describe('Number of total users', function() {
    it('should be correct', function() {
      var totalUsers = adminModule.__get__("totalUsers");
      assert.equal(totalUsers(clients), 17);
    });
  });
  describe('Adding new users', function() {
    it('should change the stats', function() {
      var newUserId = 'user100';
      clients[newUserId] = {};
      var currentUsers = adminModule.__get__("currentUsers");
      assert.equal(currentUsers(clients), 3);
    });
  });
  describe('Deleting users', function() {
    it('should change the stats', function() {
      delete clients.user12;
      var currentUsers = adminModule.__get__("currentUsers");
      assert.equal(currentUsers(clients), 1);
    });
  });
  describe('Deleting users', function() {
    it('should not change total users', function() {
      delete clients.user12;
      var totalUsers = adminModule.__get__("totalUsers");
      assert.equal(totalUsers(clients), 17);
    });
  });
});
