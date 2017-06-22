"use strict;";

import {Client} from "./client";
import {Clients} from "./client";

import {AuthOption, SocketEvent} from "../lib/enums";
import {Instance} from "./instance";
import {InstanceManager} from "./instanceManager";
import {LocalContainerManager} from "./LocalContainerManager";
import {SshDockerContainers} from "./sshDockerContainers";
import {SudoDockerContainers} from "./sudoDockerContainers";

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
let serverConfig = {
  MATH_PROGRAM : undefined,
  CMD_LOG_FOLDER : undefined,
  MATH_PROGRAM_COMMAND : undefined,
  resumeString : undefined,
  port : undefined,
  CONTAINERS : undefined,
};
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

const clients: Clients = {};

let totalUsers: number = 0;

let instanceManager: InstanceManager = {
    getNewInstance(next: any){},
    removeInstance(instance: any){},
    updateLastActiveTime(){},
};

const logClient = function(clientID, str) {
  if (process.env.NODE_ENV !== "test") {
    logExceptOnTest(clientID + ": " + str);
  }
};

const userSpecificPath = function(client: Client): string {
  return "/" + client.id + "-files/";
};

const disconnectSocket = function(socket): void  {
      try{
        socket.disconnect();
      } catch (error) {
        logExceptOnTest("Failed to disconnect socket: " + error);
      }
      };

const disconnectSockets = function(sockets): void  {
  for (const socketKey in sockets) {
    if (sockets.hasOwnProperty(socketKey)) {
      const socket = sockets[socketKey];
      disconnectSocket(socket);
    }
  }
};

const deleteClientData = function(client: Client): void {
  logClient(client.id, "deleting folder " +
      staticFolder + userSpecificPath(client));
  try {
    logClient(client.id, "Sending disconnect. ");
    disconnectSockets(clients[client.id].socketArray);
  } catch (error) {
    logClient(client.id, "Socket seems already dead: " + error);
  }
  fs.rmdir(staticFolder + userSpecificPath(client), function(error) {
    if (error) {
      logClient(client.id, "Error deleting user folder: " + error);
    }
  });
  delete clients[client.id];
};

const setCookie = function(cookies, clientID: string): void {
  cookies.set(options.cookieName, clientID, {
    httpOnly: false,
  });
};

const emitDataViaSockets = function(sockets, type: SocketEvent, data: string): void {
  for (const socketKey in sockets) {
    if (sockets.hasOwnProperty(socketKey)) {
      const socket = sockets[socketKey];
      try {
        socket.emit(SocketEvent[type], data);
      } catch (error) {
        logExceptOnTest("Error while executing socket.emit of type " + SocketEvent[type]);
      }
    }
  }
};

const emitDataViaClientSockets = function(client: Client, type: SocketEvent, data) {
  const sockets = client.socketArray;
  emitDataViaSockets(sockets, type, data);
};

const getInstance = function(client: Client, next) {
  if (client.instance) {
    next(client.instance);
  } else {
    instanceManager.getNewInstance(function(err, instance: Instance) {
      if (err) {
        emitDataViaClientSockets(client, SocketEvent.result,
          "Sorry, there was an error. Please come back later.\n" +
            err + "\n\n");
        deleteClientData(client);
      } else {
        next(instance);
      }
    });
  }
};

export {emitDataViaClientSockets, serverConfig, clients, getInstance, instanceManager, sendDataToClient};

const optLogCmdToFile = function(clientId: string, msg: string) {
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

const killNotify = function(client: Client) {
  return function() {
    logClient(client.id, "getting killed.");
    deleteClientData(client);
    optLogCmdToFile(client.id, "Killed.\n");
  };
};

const spawnMathProgramInSecureContainer = function(client: Client, next) {
  getInstance(client, function(instance: Instance) {
    instance.killNotify = killNotify(client);
    client.instance = instance;
    const connection = new ssh2.Client();
    connection.on("error", function(err) {
      logClient(client.id, "Error when connecting. " + err +
        "; Retrying with new instance.");
      instanceManager.removeInstance(instance);
      delete clients[client.id].instance;
      spawnMathProgramInSecureContainer(client, next);
    });
    connection.on("ready", function() {
      connection.exec(serverConfig.MATH_PROGRAM_COMMAND,
        {pty: true},
        function(err, stream) {
          if (err) {
            throw err;
          }
          optLogCmdToFile(client.id, "Starting.\n");
          stream.on("close", function() {
            connection.end();
          });
          stream.on("end", function() {
            stream.close();
            logClient(client.id, "Stream ended, closing connection.");
            connection.end();
          });
          next(stream);
        });
    }).connect(sshCredentials(instance));
  });
};

const updateLastActiveTime = function(client: Client) {
  instanceManager.updateLastActiveTime(client.instance);
};

const addNewSocket = function(client: Client, socket) {
  logClient(client.id, "Adding new socket");
  const socketID: string = socket.id;
  client.socketArray[socketID] = socket;
};

const sendDataToClient = function(client: Client) {
  return function(dataObject) {
    const data = dataObject.toString();
    if (client.nSockets() === 0) {
      logClient(client.id, "Error, no socket for client.");
      return;
    }
    updateLastActiveTime(client);
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
        client,
        dataMarkedAsSpecial,
        data,
        userSpecificPath(client),
      );
      return;
    }
    emitDataViaClientSockets(client, SocketEvent.result, data);
  };
};

const attachListenersToOutput = function(client: Client) {
  if (client.mathProgramInstance) {
    client.mathProgramInstance
      .removeAllListeners("data")
      .on("data", sendDataToClient(client));
  }
};

const mathProgramStart = function(client: Client, next) {
  logClient(client.id, "Spawning new MathProgram process...");
  spawnMathProgramInSecureContainer(client, function(stream) {
    stream.setEncoding("utf8");
    client.mathProgramInstance = stream;
    attachListenersToOutput(client);
    setTimeout(function() {
      if (next) {
        next(client);
      }
    }, 2000); // Always need a little time before start is done.
  });
};

const killMathProgram = function(stream, clientID: string) {
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
    clients[clientID] = new Client(clientID);
    totalUsers += 1;
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

  const prefix: string = staticFolder + "-" + serverConfig.MATH_PROGRAM + "/";
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

const clientExistenceCheck = function(clientId: string): Client {
  logExceptOnTest("Checking existence of client with id " + clientId);
  if (!clients[clientId]) {
    clients[clientId] = new Client(clientId);
    totalUsers += 1;
  }
  return clients[clientId];
};

const clientSanityCheck = function(client: Client) {
  logClient(client.id, "Checking sanity");
  if (!client.saneState) {
    logClient(client.id, "Is not sane");
    return;
  }
  client.saneState = false;

  if (!client.mathProgramInstance ||
      client.mathProgramInstance._writableState.ended) {
    console.log("Starting new mathProgram instance.");
    mathProgramStart(client, function() {
      client.saneState = true;
    });
  } else {
    console.log("Has mathProgram instance.");
    if (client.reconnecting) {
      emitDataViaClientSockets(client,
         SocketEvent.result,
        "Session resumed.\n" + serverConfig.resumeString);
      client.reconnecting = false;
    }
    client.saneState = true;
  }
};

const writeMsgOnStream = function(client: Client, msg: string) {
  client.mathProgramInstance.stdin.write(msg, function(err) {
    if (err) {
      logClient(client.id, "write failed: " + err);
    }
    optLogCmdToFile(client.id, msg);
    clientSanityCheck(client);
  });
};

const checkAndWrite = function(client: Client, msg: string) {
  if (!client.mathProgramInstance ||
      client.mathProgramInstance._writableState.ended) {
    clientSanityCheck(client);
  } else {
    writeMsgOnStream(client, msg);
  }
};

const checkState = function(client: Client) {
  return new Promise(function(resolve, reject) {
    if (client.saneState) {
      resolve();
    } else {
      logClient(client.id, " not accepting events.");
      reject();
    }
  });
};

const socketInputAction = function(client: Client) {
  return function(msg: string) {
    logClient(client.id, "Receiving input");
    updateLastActiveTime(client);
    checkState(client).then(function() {
      checkAndWrite(client, msg);
    }, function(){
      clientSanityCheck(client);
    });
  };
};

const socketResetAction = function(client: Client) {
  return function() {
    optLogCmdToFile(client.id, "Resetting.\n");
    logClient(client.id, "Received reset.");
    checkState(client).then(function() {
      client.saneState = false;
      if (client.mathProgramInstance) {
        killMathProgram(client.mathProgramInstance, client.id);
      }
      mathProgramStart(client, function() {
        client.saneState = true;
      });
    }, function(){
      clientSanityCheck(client);
    });
  };
};

const listen = function() {
  const cookieParser = require("socket.io-cookie");
  io.use(cookieParser);
  io.on("connection", function(socket) {
    console.log("Incoming new connection!");
    const clientId: string = getClientIdFromSocket(socket);
    if (clientId === "deadCookie") {
      logExceptOnTest("Disconnecting for dead cookie.");
      disconnectSocket(socket);
      return;
    }
    if (clients[clientId]) {
      clients[clientId].reconnecting = true;
    }
    const client = clientExistenceCheck(clientId);
    clientSanityCheck(client);
    addNewSocket(client, socket);
    const fileUpload = require("./fileUpload")(
      logExceptOnTest,
      sshCredentials);
    fileUpload.attachUploadListenerToSocket(client, socket);
    socket.on("input", socketInputAction(client));
    socket.on("reset", socketResetAction(client));
  });

  const listener = http.listen(serverConfig.port);
  console.log("Server running on " + listener.address().port);
  return listener;
};

const authorizeIfNecessary = function(authOption: AuthOption) {
  if (authOption === AuthOption.basic) {
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
  const resources = options.perContainerResources;
  const guestInstance = options.startInstance;
  const hostConfig = options.hostConfig;
  instanceManager = serverConfig.CONTAINERS(resources, hostConfig, guestInstance);

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
