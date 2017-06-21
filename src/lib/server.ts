"use strict;";

import {Instance} from "./instance";
import * as reader from "./tutorialReader";

import express = require("express");
const app = express();
const http = require("http").createServer(app);
import fs = require("fs");
import Cookies = require("cookies");
const io = require("socket.io")(http);
import ssh2 = require("ssh2");
import SocketIOFileUpload = require("socketio-file-upload");

import path = require("path");
let getClientIdFromSocket;
let serverConfig;
let options;
const staticFolder = path.join(__dirname, "../../../public/public");

const logExceptOnTest = function(msg: string): void {
  if (process.env.NODE_ENV !== "test") {
    console.log(msg);
  }
};

const sshCredentials = function(instance: Instance) {
  return {
    host: instance.host,
    port: instance.port,
    username: instance.username,
    privateKey: fs.readFileSync(instance.sshKey),
  };
};

//  object of all client objects.  Each has a math program process.
const clients = {
  totalUsers: 0,
};

let instanceManager;

const logClient = function(clientID, str) {
  if (process.env.NODE_ENV !== "test") {
    logExceptOnTest(clientID + ": " + str);
  }
};

const userSpecificPath = function(clientId) {
  return "/" + clientId + "-files/";
};

const disconnectSocket = function(socket) {
  socket.disconnect();
};

const deleteClientData = function(clientID) {
  logExceptOnTest("deleting folder " +
      staticFolder + userSpecificPath(clientID));
  try {
    console.log("Sending disconnect. " + clientID);
    disconnectSocket(clients[clientID].socket);
  } catch (error) {
    console.log("Socket seems already dead: " + error);
  }
  fs.rmdir(staticFolder + userSpecificPath(clientID), function(error) {
    if (error) {
      console.error("Error deleting user folder: " + error);
    }
  });
  delete clients[clientID];
};

class Client {
    saneState: boolean;
    reconnecting: boolean;
    instance: Instance;
    socketArray: any;
    constructor() {
        this.saneState = true;
        this.reconnecting = false;
    }
}

const setCookie = function(cookies, clientID) {
  cookies.set(options.cookieName, clientID, {
    httpOnly: false,
  });
};

const emitDataViaSockets = function(sockets, type, data) {
  for (const socketKey in sockets) {
    if (sockets.hasOwnProperty(socketKey)) {
      const socket = sockets[socketKey];
      try {
        socket.emit(type, data);
      } catch (error) {}
    }
  }
};

const emitDataViaClientSockets = function(clientID, type, data) {
  const sockets = clients[clientID].socketArray;
  emitDataViaSockets(sockets, type, data);
};

const getInstance = function(clientID, next) {
  if (clients[clientID].instance) {
    next(clients[clientID].instance);
  } else {
    instanceManager.getNewInstance(function(err, instance: Instance) {
      if (err) {
        emitDataViaClientSockets(clientID, "result",
          "Sorry, there was an error. Please come back later.\n" +
            err + "\n\n");
        deleteClientData(clientID);
      } else {
        next(instance);
      }
    });
  }
};

const optLogCmdToFile = function(clientId, msg) {
  if (serverConfig.CMD_LOG_FOLDER) {
    fs.appendFile(serverConfig.CMD_LOG_FOLDER + "/" + clientId + ".log",
      msg,
      function(err) {
        if (err) {
          logClient(clientId, "logging msg failed: " + err);
        }
      });
  }
};

const killNotify = function(clientID) {
  return function() {
    console.log("KILL: " + clientID);
    deleteClientData(clientID);
    optLogCmdToFile(clientID, "Killed.\n");
  };
};

const spawnMathProgramInSecureContainer = function(clientID, next) {
  getInstance(clientID, function(instance: Instance) {
    instance.killNotify = killNotify(clientID);
    clients[clientID].instance = instance;
    const connection = new ssh2.Client();
    connection.on("error", function(err) {
      logClient(clientID, "Error when connecting. " + err +
        "; Retrying with new instance.");
      instanceManager.removeInstance(instance);
      delete clients[clientID].instance;
      spawnMathProgramInSecureContainer(clientID, next);
    });
    connection.on("ready", function() {
      connection.exec(serverConfig.MATH_PROGRAM_COMMAND,
        {pty: true},
        function(err, stream) {
          if (err) {
            throw err;
          }
          optLogCmdToFile(clientID, "Starting.\n");
          stream.on("close", function() {
            connection.end();
          });
          stream.on("end", function() {
            stream.close();
            logClient(clientID, "Stream ended, closing connection.");
            connection.end();
          });
          next(stream);
        });
    }).connect(sshCredentials(instance));
  });
};

const updateLastActiveTime = function(clientID) {
  instanceManager.updateLastActiveTime(clients[clientID].instance);
};

const updateSocket = function(clientID, socket) {
  console.log(socket.id);
  const ID = socket.id;
  clients[clientID].socketArray[ID] = socket;
};

const sendDataToClient = function(clientID) {
  return function(dataObject) {
    const data = dataObject.toString();
    const socket = clients[clientID].socket;
    if (!socket) {
      logClient(clientID, "Error, no socket for client.");
      return;
    }
    updateLastActiveTime(clientID);
    const pathPrefix = staticFolder + "-" + serverConfig.MATH_PROGRAM;
    const specialUrlEmitter = require("./specialUrlEmitter")(
      pathPrefix,
      sshCredentials,
      logExceptOnTest,
      emitDataViaSockets,
      options,
    );
    const dataMarkedAsSpecial = specialUrlEmitter.isSpecial(data);
    if (dataMarkedAsSpecial) {
      specialUrlEmitter.emitEventUrlToClient(
        clients[clientID],
        dataMarkedAsSpecial,
        data,
        userSpecificPath(clientID),
      );
      return;
    }
    emitDataViaClientSockets(clientID, "result", data);
  };
};

const attachListenersToOutput = function(clientID) {
  const client = clients[clientID];
  if (!client) {
    return;
  }
  if (client.mathProgramInstance) {
    clients[clientID].mathProgramInstance
      .removeAllListeners("data")
      .on("data", sendDataToClient(clientID));
  }
};

const mathProgramStart = function(clientID, next) {
  logClient(clientID, "Spawning new MathProgram process...");
  spawnMathProgramInSecureContainer(clientID, function(stream) {
    stream.setEncoding("utf8");
    clients[clientID].mathProgramInstance = stream;
    attachListenersToOutput(clientID);
    setTimeout(function() {
      if (next) {
        next(clientID);
      }
    }, 2000); // Always need a little time before start is done.
  });
};

const killMathProgram = function(stream, clientID) {
  logClient(clientID, "killMathProgramClient.");
  stream.close();
};

const checkCookie = function(request, response, next) {
  const cookies = new Cookies(request, response);
  let clientID = cookies.get(options.cookieName);
  if (!clientID) {
    logExceptOnTest("New client without a cookie set came along");
    logExceptOnTest("Set new cookie!");
    clientID = require("./clientId")(clients, logExceptOnTest).getNewId();
  }
  setCookie(cookies, clientID);

  if (!clients[clientID]) {
    clients[clientID] = new Client();
    clients.totalUsers += 1;
  }
  next();
};

const unhandled = function(request, response) {
  logExceptOnTest("Request for something we don't serve: " + request.url);
  response.writeHead(404, "Request for something we don't serve.");
  response.write("404");
  response.end();
};

const initializeServer = function() {
  const favicon = require("serve-favicon");
  const serveStatic = require("serve-static");
  const winston = require("winston");
  const expressWinston = require("express-winston");

  const loggerSettings = {
    transports: [
      new winston.transports.Console({
        level: "error",
        json: true,
        colorize: true,
      }),
    ],
  };

  const prefix = staticFolder + "-" + serverConfig.MATH_PROGRAM + "/";
  const getList: reader.GetListFunction = reader.tutorialReader(prefix, fs);
  const admin = require("./admin")(clients, serverConfig.MATH_PROGRAM);
  app.use(favicon(staticFolder + "-" +
      serverConfig.MATH_PROGRAM + "/favicon.ico"));
  app.use(SocketIOFileUpload.router);
  app.use(checkCookie);
  app.use(serveStatic(staticFolder + "-" + serverConfig.MATH_PROGRAM));
  app.use(serveStatic(staticFolder + "-common"));
  app.use(expressWinston.logger(loggerSettings));
  app.use("/admin", admin.stats);
  app.use("/getListOfTutorials", getList);
  app.use(unhandled);
};

const socketSanityCheck = function(clientId, socket) {
  console.log("CID is: " + clientId);
  if (!clients[clientId]) {
    console.log("No client, yet.");
    clients[clientId] = new Client();
    clients.totalUsers += 1;
    clients[clientId].clientID = clientId;
  } else if (!clients[clientId].saneState) {
    console.log("Have client " + clientId + ", but they are not sane.");
    return;
  }
  clients[clientId].saneState = false;
  clients[clientId].socket = socket;
  updateSocket(clientId, socket);

  if (!clients[clientId].mathProgramInstance ||
      clients[clientId].mathProgramInstance._writableState.ended) {
    console.log("Starting new mathProgram instance.");
    mathProgramStart(clientId, function() {
      clients[clientId].saneState = true;
    });
  } else {
    console.log("Has mathProgram instance.");
    if (clients[clientId].reconnecting) {
      emitDataViaClientSockets(clientId,
        "result",
        "Session resumed.\n" + serverConfig.resumeString);
      clients[clientId].reconnecting = false;
    }
    clients[clientId].saneState = true;
  }
};

const writeMsgOnStream = function(clientId, msg) {
  clients[clientId].mathProgramInstance.stdin.write(msg, function(err) {
    if (err) {
      logClient(clientId, "write failed: " + err);
    }
    optLogCmdToFile(clientId, msg);
    socketSanityCheck(clientId, clients[clientId].socket);
  });
};

const checkAndWrite = function(clientId, msg) {
  if (!clients[clientId].mathProgramInstance ||
      clients[clientId].mathProgramInstance._writableState.ended) {
    socketSanityCheck(clientId, clients[clientId].socket);
  } else {
    writeMsgOnStream(clientId, msg);
  }
};

const checkState = function(clientId) {
  return new Promise(function(resolve, reject) {
    if (clients[clientId] && clients[clientId].saneState) {
      resolve();
    } else {
      console.log(clientId + " not accepting events.");
      reject();
    }
  });
};

const socketInputAction = function(clientId) {
  return function(msg) {
    console.log("Have clientId: " + clientId);
    updateLastActiveTime(clientId);
    checkState(clientId).then(function() {
      checkAndWrite(clientId, msg);
    }, function(){
      socketSanityCheck(clientId, clients[clientId].socket);
    });
  };
};

const socketResetAction = function(clientId) {
  return function() {
    optLogCmdToFile(clientId, "Resetting.\n");
    logExceptOnTest("Received reset.");
    checkState(clientId).then(function() {
      const client = clients[clientId];
      client.saneState = false;
      if (client.mathProgramInstance) {
        killMathProgram(client.mathProgramInstance, clientId);
      }
      mathProgramStart(clientId, function() {
        client.saneState = true;
      });
    }, function(){
      socketSanityCheck(clientId, clients[clientId].socket);
    });
  };
};

const listen = function() {
  const cookieParser = require("socket.io-cookie");
  io.use(cookieParser);
  io.on("connection", function(socket) {
    console.log("Incoming new connection!");
    const clientId = getClientIdFromSocket(socket);
    if (clientId === "deadCookie") {
      console.log("Disconnecting for dead cookie.");
      disconnectSocket(socket);
      return;
    }
    if (clients[clientId]) {
      clients[clientId].reconnecting = true;
    }
    socketSanityCheck(clientId, socket);
    const fileUpload = require("./fileUpload")(
      logExceptOnTest,
      sshCredentials);
    fileUpload.attachUploadListenerToSocket(clients[clientId], socket);
    socket.on("input", socketInputAction(clientId));
    socket.on("reset", socketResetAction(clientId));
  });

  const listener = http.listen(serverConfig.port);
  console.log("Server running on " + listener.address().port);
  return listener;
};

const authorizeIfNecessary = function(authOption) {
  if (authOption === "basic") {
    const auth = require("http-auth");
    const basic = auth.basic({
      realm: "Please enter your username and password.",
      file: path.join(__dirname, "/../../../public/users.htpasswd"),
    });
    app.use(auth.connect(basic));
    return function(socket) {
      try {
        return socket.request.headers.authorization.substring(6);
      } catch (error) {
        return "deadCookie";
      }
    };
  }
  return function(socket) {
    const cookies = socket.request.headers.cookie;
    return cookies[options.cookieName];
  };
};

const MathServer = function(o) {
  options = o;
  serverConfig = options.serverConfig;

  if (!serverConfig.CONTAINERS) {
    console.error("error, no container management given.");
    throw new Error("No CONTAINERS!");
  }

  getClientIdFromSocket = authorizeIfNecessary(options.authentication);

  instanceManager = require(serverConfig.CONTAINERS).manager(options);

  initializeServer();

  // These are the methods available from the outside:
  return {
    listen,
    close() {
      http.close();
    },
  };
};

exports.mathServer = MathServer;
