var ssh2 = require('ssh2');
var SocketIOFileUpload = require('socketio-file-upload');

module.exports = function(clients, logExceptOnTest, sshCredentials) {
  var completeFileUpload = function(clientId) {
    return function(event) {
      var credentials = sshCredentials(clients[clientId].instance);
      var connection = ssh2();

      connection.on('end', function() {
      });

      connection.on('ready', function() {
        connection.sftp(function(err, sftp) {
            if (err) {
                console.log("There was an error while connecting via sftp: " + err);
              }
            var stream = sftp.createWriteStream(event.file.name);
            stream.write(clients[clientId].fileUploadBuffer.toString());
            stream.end(function() {
                connection.end();
              });
            clients[clientId].fileUploadBuffer = "";
          });
      });

      connection.connect(credentials);
    };
  };

  return {
    attachUploadListenerToSocket: function(clientId, socket) {
      var uploader = new SocketIOFileUpload();
      uploader.listen(socket);

      uploader.on("error", function(event) {
        console.error("Error in upload " + event);
      });

      uploader.on("start", function(event) {
        clients[clientId].fileUploadBuffer = "";
        logExceptOnTest('File upload ' + event.file.name);
      });

      uploader.on("progress", function(event) {
                // TODO: Limit size.
        clients[clientId].fileUploadBuffer += event.buffer;
      });

      uploader.on("complete", completeFileUpload(clientId));
    }
  };
};
