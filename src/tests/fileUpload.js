var rewire = require('rewire');
var sinon = require('sinon');
var assert = require('chai').assert;

var fileUploadModule = rewire('../lib/fileUpload');

describe('FileUpload module:', function() {
  var fileUpload;
  before(function() {
    fileUpload = fileUploadModule({});
  });

  describe('attachUploadListenerToSocket()', function() {
    it('can be called', function() {
      var socket = {
        on: function() {
        }
      };
      fileUpload.attachUploadListenerToSocket(undefined, socket);
    });
  });
  describe('completeFileUpload()', function() {
    it('can be called', function() {
      var completeFileUpload = fileUploadModule.__get__("completeFileUpload");

      var connection = {
        on: function() {
        },
        connect: function() {
        }
      };
      var ssh2 = function() {
        return connection;
      };

      var spy = sinon.spy(connection, "connect");

      var revert = fileUploadModule.__set__("ssh2", ssh2);

      var client = {};

      var sshCredentials = function() {
      };

      completeFileUpload(client, sshCredentials)();
      assert(spy.called, "connection.connect() has never been called");

      revert();
    });
  });
});
