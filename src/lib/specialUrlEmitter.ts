let ssh2 = require("ssh2"); // tslint:disable-line
import fs = require("fs");

const getFilename = function(path) {
  const partAfterLastSlash = /([^\/]*)$/; // eslint-disable-line  no-useless-escape
  const filename = path.match(partAfterLastSlash);
  if (filename) {
    return filename[0];
  }
  return null;
};

const unlink = function(completePath) {
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

let emitUrlForUserGeneratedFileToClient = function(client, // tslint:disable-line
                                                   path,
                                                   pathPrefix,
                                                   pathPostfix,
                                                   sshCredentials,
                                                   logFunction,
                                                   emitDataViaSockets) {
  const fileName = getFilename(path);
  if (!fileName) {
    return;
  }
  const sshConnection = ssh2();
  sshConnection.on("end", function() {
    logFunction("Image action ended.");
  });

  const handleUserGeneratedFile = function(err, sftp) {
    if (err) {
      throw new Error("ssh2.sftp() failed: " + err);
    }
    const targetPath = pathPrefix + pathPostfix;
    fs.mkdir(targetPath, function(err) {
      if (err) {
        logFunction("Folder exists, but we proceed anyway");
      }
      console.log("Image we want is " + path);
      const completePath = targetPath + fileName;
      sftp.fastGet(path, completePath, function(error) {
        if (error) {
          console.error("Error while downloading image. PATH: " +
              path + ", ERROR: " + error);
        } else {
          setTimeout(unlink(completePath), 1000 * 60 * 10);
          emitDataViaSockets(client.socketArray,
            "image", pathPostfix + fileName,
          );
        }
      });
    });
  };

  sshConnection.on("ready", function() {
    sshConnection.sftp(handleUserGeneratedFile);
  });

  sshConnection.connect(sshCredentials(client.instance));
};

const emitLeftOverData = function(client, emitDataViaSockets,
                                  data, stripFunction) {
  const leftOverData = stripFunction(data);
  if (leftOverData !== "") {
    emitDataViaSockets(client.socketArray, "result", leftOverData);
  }
};

module.exports = function(pathPrefix,
                          sshCredentials,
                          logFunction,
                          emitDataViaSockets,
                          options,
) {
  return {
    emitEventUrlToClient(client, url, data,
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
    isSpecial(data) {
      const eventData = data.match(
        />>SPECIAL_EVENT_START>>(.*)<<SPECIAL_EVENT_END<</);
      if (eventData) {
        return eventData[1];
      }
      return false;
    },
  };
};
