/* global OPTIONS */
'use strict;';

var express = require('express');
var app = express();
var http = require('http').createServer(app);
var fs = require('fs');
var Cookies = require('cookies');
var io = require('socket.io')(http);
var ssh2 = require('ssh2');
var SocketIOFileUpload = require('socketio-file-upload');

var path = require('path');
var getClientIdFromSocket;
var options;
var staticFolder = path.join(__dirname, '../../public/public');

var logExceptOnTest = function(string) {
  if (process.env.NODE_ENV !== 'test') {
    console.log(string);
  }
};

var sshCredentials = function(instance) {
  return {
    host: instance.host,
    port: instance.port,
    username: instance.username,
    privateKey: fs.readFileSync(instance.sshKey)
  };
};

//  object of all client objects.  Each has a math program process.
var clients = {
  totalUsers: 0
};

var instanceManager;

var logClient = function(clientID, str) {
  if (process.env.NODE_ENV !== 'test') {
    logExceptOnTest(clientID + ": " + str);
  }
};

var userSpecificPath = function(clientId) {
  return "/" + clientId + "-files/";
};

var disconnectSocket = function(socket) {
  socket.disconnect();
};

var deleteClientData = function(clientID) {
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
      console.error('Error deleting user folder: ' + error);
    }
  });
  delete clients[clientID];
};

var Client = function() {
  this.saneState = true;
  this.reconnecting = false;
  this.instance = 0;
};

var setCookie = function(cookies, clientID) {
  cookies.set(OPTIONS.cookieName, clientID, {
    httpOnly: false
  });
};

var getInstance = function(clientID, next) {
  if (clients[clientID].instance) {
    next(clients[clientID].instance);
  } else {
    instanceManager.getNewInstance(function(err, instance) {
      if (err) {
        clients[clientID].socket.emit('result',
            "Sorry, there was an error. Please come back later.\n" +
            err + "\n\n");
        deleteClientData(clientID);
      } else {
        next(instance);
      }
    });
  }
};

var optLogCmdToFile = function(clientId, msg) {
  if (options.CMD_LOG_FOLDER) {
    fs.appendFile(options.CMD_LOG_FOLDER + "/" + clientId + ".log",
        msg,
        function(err) {
          if (err) {
            logClient(clientId, "logging msg failed: " + err);
          }
        });
  }
};

var killNotify = function(clientID) {
  return function() {
    console.log("KILL: " + clientID);
    deleteClientData(clientID);
    optLogCmdToFile(clientID, "Killed.\n");
  };
};

var spawnMathProgramInSecureContainer = function(clientID, next) {
  getInstance(clientID, function(instance) {
    instance.killNotify = killNotify(clientID);
    clients[clientID].instance = instance;
    var connection = new ssh2.Client();
    connection.on('ready', function() {
      connection.exec(options.MATH_PROGRAM_COMMAND,
          {pty: true},
          function(err, stream) {
            if (err) {
              throw err;
            }
            optLogCmdToFile(clientID, "Starting.\n");
            stream.on('close', function() {
              connection.end();
            });
            stream.on('end', function() {
              stream.close();
              logExceptOnTest('I ended.');
              connection.end();
            });
            next(stream);
          });
    }).connect(sshCredentials(instance));
  });
};

var updateLastActiveTime = function(clientID) {
  instanceManager.updateLastActiveTime(clients[clientID].instance);
};

var sendDataToClient = function(clientID) {
  return function(dataObject) {
    var data = dataObject.toString();
    var socket = clients[clientID].socket;
    if (!socket) {
      logClient(clientID, "Error, no socket for client.");
      return;
    }
    updateLastActiveTime(clientID);
    var pathPrefix = staticFolder + '-' + options.MATH_PROGRAM;
    var specialUrlEmitter = require('./specialUrlEmitter')(
        pathPrefix,
        sshCredentials,
        logExceptOnTest
    );
    var dataMarkedAsSpecial = specialUrlEmitter.isSpecial(data);
    if (dataMarkedAsSpecial) {
      specialUrlEmitter.emitEventUrlToClient(
          clients[clientID],
          dataMarkedAsSpecial,
          userSpecificPath(clientID));
      return;
    }
    socket.emit('result', data);
  };
};

var attachListenersToOutput = function(clientID) {
  var client = clients[clientID];
  if (!client) {
    return;
  }
  if (client.mathProgramInstance) {
    clients[clientID].mathProgramInstance
        .removeAllListeners('data')
        .on('data', sendDataToClient(clientID));
  }
};

var mathProgramStart = function(clientID, next) {
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

var killMathProgram = function(stream, clientID) {
  logClient(clientID, "killMathProgramClient.");
  stream.close();
};

var checkCookie = function(request, response, next) {
  var cookies = new Cookies(request, response);
  var clientID = cookies.get(OPTIONS.cookieName);
  if (!clientID) {
    logExceptOnTest('New client without a cookie set came along');
    logExceptOnTest('Set new cookie!');
    clientID = require('./clientId')(clients, logExceptOnTest).getNewId();
  }
  setCookie(cookies, clientID);

  if (!clients[clientID]) {
    clients[clientID] = new Client();
    clients.totalUsers += 1;
  }
  next();
};

var unhandled = function(request, response) {
  logExceptOnTest("Request for something we don't serve: " + request.url);
  response.writeHead(404, "Request for something we don't serve.");
  response.write("404");
  response.end();
};

var initializeServer = function() {
  var favicon = require('serve-favicon');
  var serveStatic = require('serve-static');
  var winston = require('winston');
  var expressWinston = require('express-winston');

  var loggerSettings = {
    transports: [
      new winston.transports.Console({
        level: 'error',
        json: true,
        colorize: true
      })
    ]
  };
  var prefix = staticFolder + "-" + options.MATH_PROGRAM + "/";
  var tutorialReader = require('./tutorialReader')(prefix, fs);
  var admin = require('./admin')(clients, options);
  app.use(favicon(staticFolder + '-' +
      options.MATH_PROGRAM + '/favicon.ico'));
  app.use(SocketIOFileUpload.router);
  app.use(checkCookie);
  app.use(serveStatic(staticFolder + '-' + options.MATH_PROGRAM));
  app.use(serveStatic(staticFolder + '-common'));
  app.use(expressWinston.logger(loggerSettings));
  app.use('/admin', admin.stats);
  app.use('/getListOfTutorials', tutorialReader.getList);
  app.use(unhandled);
};

var socketSanityCheck = function(clientId, socket) {
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

  if (!clients[clientId].mathProgramInstance ||
      clients[clientId].mathProgramInstance._writableState.ended) {
    console.log("Starting new mathProgram instance.");
    mathProgramStart(clientId, function() {
      clients[clientId].saneState = true;
    });
  } else {
    console.log("Has mathProgram instance.");
    if (clients[clientId].reconnecting) {
      clients[clientId].socket.emit('result',
          "Session resumed.\n" + options.resumeString);
      clients[clientId].reconnecting = false;
    }
    clients[clientId].saneState = true;
  }
};

var writeMsgOnStream = function(clientId, msg) {
  clients[clientId].mathProgramInstance.stdin.write(msg, function(err) {
    if (err) {
      logClient(clientId, "write failed: " + err);
    }
    optLogCmdToFile(clientId, msg);
    socketSanityCheck(clientId, clients[clientId].socket);
  });
};

var checkAndWrite = function(clientId, msg) {
  if (!clients[clientId].mathProgramInstance ||
      clients[clientId].mathProgramInstance._writableState.ended) {
    socketSanityCheck(clientId, clients[clientId].socket);
  } else {
    writeMsgOnStream(clientId, msg);
  }
};

var checkStateAndExecuteAction = function(clientId, next) {
  if (!clients[clientId] || !clients[clientId].saneState) {
    console.log(clientId + " not accepting events.");
  } else {
    next();
  }
};

var socketInputAction = function(clientId) {
  return function(msg) {
    console.log("Have clientId: " + clientId);
    updateLastActiveTime(clientId);
    checkStateAndExecuteAction(clientId, function() {
      checkAndWrite(clientId, msg);
    });
  };
};

var socketResetAction = function(clientId) {
  return function() {
    optLogCmdToFile(clientId, "Resetting.\n");
    logExceptOnTest('Received reset.');
    checkStateAndExecuteAction(clientId, function() {
      var client = clients[clientId];
      client.saneState = false;
      if (client.mathProgramInstance) {
        killMathProgram(client.mathProgramInstance, clientId);
      }
      mathProgramStart(clientId, function() {
        client.saneState = true;
      });
    });
  };
};

var listen = function() {
  var cookieParser = require('socket.io-cookie');
  io.use(cookieParser);
  io.on('connection', function(socket) {
    console.log("Incoming new connection!");
    var clientId = getClientIdFromSocket(socket);
    if (clientId === "deadCookie") {
      console.log("Disconnecting for dead cookie.");
      disconnectSocket(socket);
      return;
    }
    if (clients[clientId]) {
      clients[clientId].reconnecting = true;
    }
    socketSanityCheck(clientId, socket);
    var fileUpload = require('./fileUpload.js')(
        logExceptOnTest,
        sshCredentials);
    fileUpload.attachUploadListenerToSocket(clients[clientId], socket);
    socket.on('input', socketInputAction(clientId));
    socket.on('reset', socketResetAction(clientId));
  });

  var listener = http.listen(options.port);
  console.log("Server running on " + listener.address().port);
  return listener;
};

var authorizeIfNecessary = function(authOption) {
  if (authOption === "basic") {
    var auth = require('http-auth');
    var basic = auth.basic({
      realm: "Please enter your username and password.",
      file: path.join(__dirname, "/../../public/users.htpasswd")
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
    var cookies = socket.request.headers.cookie;
    return cookies[OPTIONS.cookieName];
  };
};

var MathServer = function() {
  options = OPTIONS.serverConfig;

  if (!options.CONTAINERS) {
    console.error("error, no container management given.");
    throw new Error("No CONTAINERS!");
  }

  getClientIdFromSocket = authorizeIfNecessary(OPTIONS.authentification);

  instanceManager = require(options.CONTAINERS).manager();

  initializeServer();

  // These are the methods available from the outside:
  return {
    listen: listen,
    close: function() {
      http.close();
    }
  };
};

exports.mathServer = MathServer;
