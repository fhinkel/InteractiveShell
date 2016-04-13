var ssh2 = require('ssh2');
var fs = require('fs');

module.exports = function(clients,
                           options,
                           staticFolder,
                           userSpecificPath,
                           sshCredentials,
                           logExceptOnTest) {
  var emitUrlForUserGeneratedFileToClient = function(clientId, path) {
    var partAfterLastSlash = /([^\/]*)$/;
    var fileName = path.match(partAfterLastSlash);
    if (fileName) {
      fileName = fileName[0];
    } else {
      return;
    }
    var sshConnection = ssh2();
    sshConnection.on('end', function() {
      logExceptOnTest("Image action ended.");
    });

    var unlink = function(completePath) {
      return function() {
        fs.unlink(completePath, function(err) {
                    // console.log("Unlinking.");
            if (err) {
                console.error("Error unlinking user generated file " + completePath);
                console.error(err);
              }
          });
      };
    };

    var handleUserGeneratedFile = function(err, sftp) {
      var targetPath = staticFolder + '-' + options.MATH_PROGRAM + userSpecificPath(clientId);
            // console.log('Path: ' + targetPath);
      fs.mkdir(targetPath, function(err) {
        if (err) {
            logExceptOnTest("Folder exists, but we proceed anyway");
          }
        console.log('Image we want is ' + path);
        var completePath = targetPath + fileName;
        sftp.fastGet(path, completePath, function(error) {
            if (error) {
                console.error("Error while downloading image. PATH: " + path + ", ERROR: " + error);
              } else {
                setTimeout(unlink(completePath), 1000 * 60 * 10);
                        // console.log("Emitting path.");
                clients[clientId].socket.emit(
                            "image", userSpecificPath(clientId) + fileName
                        );
              }
          });
      });
    };

    sshConnection.on('ready', function() {
            // console.log("I am ready.");
      sshConnection.sftp(handleUserGeneratedFile);
    });
        // console.log(sshCredentials(clients[clientId].instance));

    sshConnection.connect(sshCredentials(clients[clientId].instance));
  };

  var emitHelpUrlToClient = function(clientID, viewHelp) {
    logExceptOnTest("Look at " + viewHelp);
    var helpPath = viewHelp.match(/(\/Macaulay2Doc.*)$/);
    if (helpPath) {
      helpPath = helpPath[0];
    } else {
      return;
    }
    helpPath = "http://www.math.uiuc.edu/Macaulay2/doc/Macaulay2-1.7/share/doc/Macaulay2" + helpPath;
    logExceptOnTest(helpPath);
    clients[clientID].socket.emit("viewHelp", helpPath);
  };

  var isViewHelpEvent = function(eventData) {
    return eventData.match(/^file:.*/);
  };

  return {
    emitEventUrlToClient: function(clientID, eventType, data) {
      if (isViewHelpEvent(eventType)) {
        emitHelpUrlToClient(clientID, eventType);
        return;
      } else {
        emitUrlForUserGeneratedFileToClient(clientID, eventType);
      }
      var outputData = data.replace(/>>SPECIAL_EVENT_START>>/, "opening ");
      outputData = outputData.replace(/<<SPECIAL_EVENT_END<</, "");
            // clients[clientID].socket.emit('result', outputData);
    },
    isSpecial: function(data) {
      var eventData = data.match(/>>SPECIAL_EVENT_START>>(.*)<<SPECIAL_EVENT_END/);
      if (eventData) {
                // logExceptOnTest("Have special event: " + eventData[1]);
        return eventData[1];
      }
    }
  };
};
