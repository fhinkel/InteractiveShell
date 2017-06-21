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
    adminModule = rewire('../lib/admin.ts');
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
          var arg = '<head>\n    <link rel="stylesheet" ' +
              'href="mathProgram.css" type="text/css"\n        ' +
              'media="screen">\n</head>\n<h1>\n    MyProgram User ' +
              'Statistics\n</h1>\nThere are currently 2 users using ' +
              'MyProgram.\n<br>\nIn total, there were 17 new users ' +
              'since\n the server started.\n<br>\nEnjoy MyProgram!';

          assert.equal(spy.firstCall.args[0], arg);

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
