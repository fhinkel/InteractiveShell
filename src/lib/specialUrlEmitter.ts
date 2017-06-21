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
          emitDataViaSockets(client.socketArray,
              "image", pathPostfix + fileName
          );
        }
      });
    });
  };

  sshConnection.on('ready', function() {
    sshConnection.sftp(handleUserGeneratedFile);
  });

  sshConnection.connect(sshCredentials(client.instance));
};

var emitLeftOverData = function(client, emitDataViaSockets,
  data, stripFunction) {
  var leftOverData = stripFunction(data);
  if (leftOverData !== "") {
    emitDataViaSockets(client.socketArray, "result", leftOverData);
  }
};

module.exports = function(pathPrefix,
                          sshCredentials,
                          logFunction,
                          emitDataViaSockets,
                          options
                          ) {
  return {
    emitEventUrlToClient: function(client, url, data,
    pathPostfix) {
      emitLeftOverData(client, emitDataViaSockets, data,
      options.help.stripSpecialLines);
      if (options.help.isViewHelpEvent(url)) {
        options.help.emitHelpUrlToClient(client, url, logFunction,
        emitDataViaSockets);
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
          />>SPECIAL_EVENT_START>>(.*)<<SPECIAL_EVENT_END<</);
      if (eventData) {
        return eventData[1];
      }
      return false;
    }
  };
};
