var ssh2 = require('ssh2');
var fs = require('fs');

var getFilename = function(path) {
  var partAfterLastSlash = /([^\/]*)$/;
  var filename = path.match(partAfterLastSlash);
  if (filename) {
    return filename[0];
  }
  return null;
};

var unlink = function(completePath) {
  return function() {
    fs.unlink(completePath, function(err) {
      if (err) {
        console.error("Error unlinking user generated file " +
            completePath);
        console.error(err);
      }
    });
  };
};

var emitUrlForUserGeneratedFileToClient = function(client,
                                                   path,
                                                   pathPrefix,
                                                   pathPostfix,
                                                   sshCredentials,
                                                   logFunction,
                                                   emitDataViaSockets) {
  var fileName = getFilename(path);
  if (!fileName) {
    return;
  }
  var sshConnection = ssh2();
  sshConnection.on('end', function() {
    logFunction("Image action ended.");
  });

  var handleUserGeneratedFile = function(err, sftp) {
    if (err) {
      throw new Error('ssh2.sftp() failed: ' + err);
    }
    var targetPath = pathPrefix + pathPostfix;
    // console.log('Path: ' + targetPath);
    fs.mkdir(targetPath, function(err) {
      if (err) {
        logFunction("Folder exists, but we proceed anyway");
      }
      console.log('Image we want is ' + path);
      var completePath = targetPath + fileName;
      sftp.fastGet(path, completePath, function(error) {
        if (error) {
          console.error("Error while downloading image. PATH: " +
              path + ", ERROR: " + error);
        } else {
          setTimeout(unlink(completePath), 1000 * 60 * 10);
          // console.log("Emitting path.");
          emitDataViaSockets(client.socketArray,
              "image", pathPostfix + fileName
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

  sshConnection.connect(sshCredentials(client.instance));
};

var emitHelpUrlToClient = function(client,
                                    viewHelp,
                                    logFunction,
                                    emitDataViaSockets) {
  logFunction("Look at " + viewHelp);
  var helpPath = viewHelp.match(/(\/Macaulay2Doc.*)$/);
  if (helpPath) {
    helpPath = helpPath[0];
  } else {
    return;
  }
  helpPath = "http://www.math.uiuc.edu/Macaulay2/doc/Macaulay2-1.7/" +
      "share/doc/Macaulay2" + helpPath;
  logFunction(helpPath);
  emitDataViaSockets(client.socketArray, "viewHelp", helpPath);
};

var isViewHelpEvent = function(eventData) {
  return eventData.match(/^file:.*/) !== null;
};

module.exports = function(pathPrefix,
                          sshCredentials,
                          logFunction,
                          emitDataViaSockets
                          ) {
  return {
    emitEventUrlToClient: function(client, url, pathPostfix) {
      if (isViewHelpEvent(url)) {
        emitHelpUrlToClient(client, url, logFunction, emitDataViaSockets);
        return;
      }
      emitUrlForUserGeneratedFileToClient(
          client,
          url,
          pathPrefix,
          pathPostfix,
          sshCredentials,
          logFunction,
          emitDataViaSockets);
    },
    isSpecial: function(data) {
      var eventData = data.match(
          />>SPECIAL_EVENT_START>>(.*)<<SPECIAL_EVENT_END/);
      if (eventData) {
        return eventData[1];
      }
      return false;
    }
  };
};
