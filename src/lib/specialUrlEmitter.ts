let ssh2 = require("ssh2"); // tslint:disable-line
import fs = require("fs");
import {Client} from "./client";
import {SocketEvent} from "./enums";

const getFilename = function(path: string): string {
  const partAfterLastSlash = /([^\/]*)$/; // eslint-disable-line  no-useless-escape
  const filename = path.match(partAfterLastSlash);
  if (filename) {
    return filename[0];
  }
  return null;
};

const unlink = function(completePath: string) {
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

let emitUrlForUserGeneratedFileToClient = function(client : Client, // tslint:disable-line
                                                   path: string,
                                                   pathPrefix: string,
                                                   pathPostfix: string,
                                                   sshCredentials,
                                                   logFunction,
                                                   emitDataViaSockets) {
  const fileName: string = getFilename(path);
  if (!fileName) {
    return;
  }
  const sshConnection = ssh2();
  sshConnection.on("end", function() {
    logFunction("Image action ended.");
  });

  const handleUserGeneratedFile = function(generateError, sftp) {
    if (generateError) {
      throw new Error("ssh2.sftp() failed: " + generateError);
    }
    const targetPath: string = pathPrefix + pathPostfix;
    fs.mkdir(targetPath, function(fsError) {
      if (fsError) {
        logFunction("Folder exists, but we proceed anyway");
      }
      console.log("Image we want is " + path);
      const completePath = targetPath + fileName;
      sftp.fastGet(path, completePath, function(sftpError) {
        if (sftpError) {
          console.error("Error while downloading image. PATH: " +
              path + ", ERROR: " + sftpError);
        } else {
          setTimeout(unlink(completePath), 1000 * 60 * 10);
          emitDataViaSockets(client.socketArray,
            SocketEvent.image, pathPostfix + fileName,
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

const emitLeftOverData = function(client: Client, emitDataViaSockets,
                                  data: string, stripFunction): void {
  const leftOverData = stripFunction(data);
  if (leftOverData !== "") {
    emitDataViaSockets(client.socketArray, SocketEvent.result, leftOverData);
  }
};

module.exports = function(pathPrefix: string,
                          sshCredentials,
                          logFunction,
                          emitDataViaSockets,
                          options,
) {
  return {
    emitEventUrlToClient(client: Client, url: string, data: string,
                         pathPostfix: string) {
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
    isSpecial(data: string) {
      const eventData = data.match(
        />>SPECIAL_EVENT_START>>(.*)<<SPECIAL_EVENT_END<</);
      if (eventData) {
        return eventData[1];
      }
      return false;
    },
  };
};
