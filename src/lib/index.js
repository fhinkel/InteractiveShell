var app = require('express')();
var http = require('http').Server(app);
var fs = require('fs');
var Cookies = require('cookies');
var io = require('socket.io')(http);
var SocketIOFileUpload = require('socketio-file-upload');
var ssh2 = require('ssh2');


var MathServer = function (overrideOptions) {
    var staticFolder = __dirname + '/../../public/public';

    var options = {
        port: 8002, // default port number to use
        CONTAINERS: './LocalContainerManager.js',
        MATH_PROGRAM: "Macaulay2",
        MATH_PROGRAM_COMMAND: 'M2'
    };

    var logExceptOnTest = function (string) {
        if (process.env.NODE_ENV !== 'test') {
            console.log(string);
        }
    };

    var overrideDefaultOptions = function (overrideOptions) {
        for (var opt in overrideOptions) {
            if (options.hasOwnProperty(opt)) {
                options[opt] = overrideOptions[opt];
                logExceptOnTest("server option: " + opt + " set to " + options[opt]);
            }
        }
    };

    overrideDefaultOptions(overrideOptions);

    var cookieName = "try" + options.MATH_PROGRAM;

    var totalUsers = 0; //only used for stats: total # users since server started

    // Global array of all Client objects.  Each has a math program process.
    var clients = {};
    if (!options.CONTAINERS) {
        console.error("error, no container management given.");
        throw ("No CONTAINERS!");
    }

    var instanceManager = require(options.CONTAINERS).manager();

    var logClient = function (clientID, str) {
        if (process.env.NODE_ENV !== 'test') {
            logExceptOnTest(clientID + ": " + str);
        }
    };

    var userSpecificPath = function (clientId) {
        return "/" + clientId + "-files/";
    };

    var deleteClient = function (clientID) {
        instanceManager.removeInstance(clients[clientID].instance);
        deleteClientData(clientID);
    };

    var deleteClientData = function (clientID) {
        logExceptOnTest("deleting folder " + staticFolder + userSpecificPath(clientID));
        try {
            clients[clientID].socket.emit('serverDisconnect');
            console.log("Sending disconnect. " + clientID);
            clients[clientID].socket.disconnect();
        } catch (error) {
            console.log("Socket seems already dead: " + error);
        }
        fs.rmdir(staticFolder + userSpecificPath(clientID), function (error) {
            if (error) {
                console.error('Error deleting user folder: ' + error);
            }
        });
        delete clients[clientID];
    };


    var removeOldClients = function (minimalLastActiveTimeForClient) {
        for (var clientID in clients) {
            if (clients.hasOwnProperty(clientID)) {
                if (clients[clientID].instance.lastActiveTime < minimalLastActiveTimeForClient) {
                    deleteClient(clientID);
                }
            }
        }
    };

    var logCurrentlyActiveClients = function () {
        for (var clientID in clients) {
            if (clients.hasOwnProperty(clientID)) {
                logExceptOnTest(clientID);
            }
        }
    };


    var Client = function () {
        this.saneState = true;
        //this.lastActiveTime = Date.now(); // milliseconds when client was last active
        this.instance = 0;
    };

    var clientIDExists = function (clientID) {
        if (clients[clientID] == null) {
            return false;
        }
        logClient(clientID, "Client already exists");
        return true;
    };

    var getNewClientID = function () {
        totalUsers += 1;
        do {
            var clientID = Math.random() * 1000000;
            clientID = Math.floor(clientID);
        } while (clientIDExists(clientID));
        clientID = "user" + clientID.toString(10);
        logExceptOnTest("New Client ID " + clientID);
        return clientID;
    };

    var setCookie = function (cookies, clientID) {
        cookies.set(cookieName, clientID, {
            httpOnly: false
        });
    };

    var getInstance = function (clientID, next) {
        if (clients[clientID].instance) {
            next(clients[clientID].instance);
        } else {
            instanceManager.getNewInstance(function (err, instance) {
                if (err) {
                    clients[clientID].socket.emit('result', "Sorry, there was an error. Please come back later.\n" + err + "\n\n");
                    deleteClientData(clientID);
                } else {
                    next(instance);
                }
            });
        }
    };

    var killNotify = function (clientID) {
        return function () {
            console.log("KILL: " + clientID);
            deleteClientData(clientID);
        };
    };

    var spawnMathProgramInSecureContainer = function (clientID, next) {
        getInstance(clientID, function (instance) {
            instance.killNotify = killNotify(clientID);
            clients[clientID].instance = instance;
            var connection = new ssh2.Client();
            connection.on('ready', function () {
                connection.exec(options.MATH_PROGRAM_COMMAND, {pty: true}, function (err, stream) {
                    if (err) throw err;
                    stream.on('close', function () {
                        connection.end();
                    });
                    stream.on('end', function () {
                        stream.close();
                        logExceptOnTest('I ended.');
                        //connection.end();
                    });
                    next(stream);
                });
            }).connect(sshCredentials(instance));
        });
    };

    var mathProgramStart = function (clientID, next) {
        logClient(clientID, "Spawning new MathProgram process...");
        spawnMathProgramInSecureContainer(clientID, function (stream) {
            stream.setEncoding("utf8");
            clients[clientID].mathProgramInstance = stream;
            attachListenersToOutput(clientID);
            setTimeout(function () {
                if (next) {
                    next(clientID);
                }
            }, 2000); // Always need a little time before start is done.
        });
    };

    var captureSpecialEvent = function (data) {
        var eventData = data.match(/>>SPECIAL_EVENT_START>>(.*)<<SPECIAL_EVENT_END/);
        if (eventData) {
            // logExceptOnTest("Have special event: " + eventData[1]);
            return eventData[1];
        }
    };


    var emitUrlForUserGeneratedFileToClient = function (clientId, path) {
        var partAfterLastSlash = /([^\/]*)$/;
        var fileName = path.match(partAfterLastSlash);
        if (fileName) {
            fileName = fileName[0];
        } else {
            return;
        }
        var sshConnection = ssh2();

        sshConnection.on('end', function () {
            logExceptOnTest("Image action ended.");
        });

        sshConnection.on('ready', function () {
            sshConnection.sftp(function (err, sftp) {
                var targetPath = staticFolder + '-' + options.MATH_PROGRAM + userSpecificPath(clientId);
                fs.mkdir(targetPath, function (err) {
                    if (err) {
                        logExceptOnTest("Folder exists, but we proceed anyway");
                    }
                    var completePath = targetPath + fileName;
                    sftp.fastGet(path, completePath, function (error) {
                        if (error) {
                            console.error("Error while downloading image. PATH: " + path + ", ERROR: " + error);
                        } else {
                            setTimeout(function () {
                                fs.unlink(completePath, function (err) {
                                    if (err) {
                                        console.error("Error unlinking user generated file " + completePath);
                                        console.error(err);
                                    }
                                })
                            }, 1000 * 60 * 10);
                            clients[clientId].socket.emit(
                                "image", userSpecificPath(clientId) + fileName
                            );
                        }
                    });
                });
            });
        });

        sshConnection.connect(sshCredentials(clients[clientId].instance));
    };

    var emitHelpUrlToClient = function (clientID, viewHelp) {
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

    var isViewHelpEvent = function (eventData) {
        return eventData.match(/^file:.*/);
    };

    var emitEventUrlToClient = function (clientID, eventType, data) {
        if (isViewHelpEvent(eventType)) {
            logCurrentlyActiveClients(data);
            emitHelpUrlToClient(clientID, eventType);
            return;
        } else {
            emitUrlForUserGeneratedFileToClient(clientID, eventType);
        }
        var outputData = data.replace(/>>SPECIAL_EVENT_START>>/, "opening ");
        outputData = outputData.replace(/<<SPECIAL_EVENT_END<</, "");
        clients[clientID].socket.emit('result', outputData);
    };

    var sendDataToClient = function (clientID) {
        return function (dataObject) {
            var data = dataObject.toString();
            var socket = clients[clientID].socket;
            if (!socket) {
                logClient(clientID, "Error, no socket for client.");
                return;
            }
            updateLastActiveTime(clientID);
            var specialEvent = captureSpecialEvent(data);
            if (specialEvent) {
                emitEventUrlToClient(clientID, specialEvent, data);
                return;
            }
            socket.emit('result', data);
        };
    };

    var attachListenersToOutput = function (clientID) {
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

    var stats = function (request, response) {
        // to do: authorization
        response.writeHead(200, {
            "Content-Type": "text/html"
        });
        var currentUsers = 0;
        for (var c in clients) {
            if (clients.hasOwnProperty(c))
                currentUsers = currentUsers + 1;
        }
        response.write(
            '<head><link rel="stylesheet" href="mathProgram.css" type="text/css" media="screen"></head>');
        response.write('<h1>' + options.MATH_PROGRAM + ' User Statistics</h1>');
        response.write('There are currently ' + currentUsers +
        ' users using ' + options.MATH_PROGRAM + '.<br>');
        response.write('In total, there were ' + totalUsers +
        ' users since the server started.<br>');
        response.write('Enjoy ' + options.MATH_PROGRAM + '!');
        response.end();
    };

    var updateLastActiveTime = function (clientID) {
        instanceManager.updateLastActiveTime(clients[clientID].instance);
    };

    var killMathProgram = function (stream, clientID) {
        logClient(clientID, "killMathProgramClient.");
        stream.close();
    };


    var checkCookie = function (request, response, next) {
        var cookies = new Cookies(request, response);
        var clientID = cookies.get(cookieName);
        if (!clientID) {
            console.log("New cookie.");
            logExceptOnTest('New client without a cookie set came along');
            logExceptOnTest('Set new cookie!');
            clientID = getNewClientID();
        }
        setCookie(cookies, clientID);

        if (!clients[clientID]) {
            clients[clientID] = new Client();
        }
        next();
    };

    var unhandled = function (request, response) {
        var url = require('url').parse(request.url).pathname;
        logExceptOnTest("Request for something we don't serve: " + request.url);
        response.writeHead(404, "Request for something we don't serve.");
        response.write("404");
        response.end();
    };

    var initializeServer = function () {
        var favicon = require('serve-favicon');
        var serveStatic = require('serve-static');
        var winston = require('winston'),
            expressWinston = require('express-winston');

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
        var tutorialReader = require('./tutorialReader.js')(prefix, fs);
        app.use(favicon(staticFolder + '-' + options.MATH_PROGRAM + '/favicon.ico'));
        app.use(SocketIOFileUpload.router);
        app.use(checkCookie);
        app.use(serveStatic(staticFolder + '-' + options.MATH_PROGRAM));
        app.use(serveStatic(staticFolder + '-common'));
        app.use(expressWinston.logger(loggerSettings));
        app.use('/admin', stats)
            .use('/getListOfTutorials', tutorialReader.getList)
            .use(unhandled);
    };

    var attachUploadListenerToSocket = function (clientId, socket) {
        var uploader = new SocketIOFileUpload();
        uploader.listen(socket);

        uploader.on("error", function (event) {
            console.error("Error in upload " + event);
        });

        uploader.on("start", function (event) {
            clients[clientId].fileUploadBuffer = "";
            logExceptOnTest('File upload ' + event.file.name);
        });

        uploader.on("progress", function (event) {
            // TODO: Limit size.
            clients[clientId].fileUploadBuffer += event.buffer;
        });

        uploader.on("complete", completeFileUpload(clientId));
    };

    var completeFileUpload = function (clientId) {
        return function (event) {
            var connection = ssh2();

            connection.on('end', function () {
            });

            connection.on('ready', function () {
                connection.sftp(function (err, sftp) {
                    var stream = sftp.createWriteStream(event.file.name);
                    stream.write(clients[clientId].fileUploadBuffer.toString());
                    stream.end(function () {
                        connection.end();
                    });
                    clients[clientId].fileUploadBuffer = "";
                });
            });

            connection.connect(sshCredentials(clients[clientId].instance));

        };
    };

    var sshCredentials = function (instance) {
        return {
            host: instance.host,
            port: instance.port,
            username: instance.username,
            privateKey: fs.readFileSync(instance.sshKey)
        }
    };

    var socketSanityCheck = function (clientId, socket) {
        console.log("CID is: " + clientId);
        if (!clients[clientId]) {
            console.log("No client, yet.");
            clients[clientId] = new Client();
            clients[clientId].clientID = clientId;
        } else if (!clients[clientId].saneState) {
            console.log("Have client " + clientId + ", but he is not sane.");
            return;
        }
        clients[clientId].saneState = false;
        clients[clientId].socket = socket;

        if (!clients[clientId].mathProgramInstance) {
            console.log("Starting new mathProgram instance.");
            mathProgramStart(clientId, function () {
                clients[clientId].saneState = true;
            });
        } else {
            console.log("Has mathProgram instance.");
            clients[clientId].saneState = true;
        }
    };

    var listen = function () {
        var cookieParser = require('socket.io-cookie');
        io.use(cookieParser);
        io.on('connection', function (socket) {
            console.log("Incoming new connection!");
            var cookies = socket.request.headers.cookie;
            var clientId = cookies[cookieName];
            socketSanityCheck(clientId, socket);
            attachUploadListenerToSocket(clientId, socket);
            socket.on('input', socketInputAction(clientId));
            socket.on('reset', socketResetAction(clientId));
        });
        return http.listen(options.port);
    };

    var writeMsgOnStream = function (clientId, msg) {
        clients[clientId].mathProgramInstance.stdin.write(msg, function (err) {
            if (err) {
                logClient(clientId, "write failed: " + err);
            }
        });
    };

    var checkAndWrite = function (clientId, msg) {
        if (!clients[clientId].mathProgramInstance || !clients[clientId].mathProgramInstance._writableState) {
            socketSanityCheck(clientId, clients[clientId].socket);
        } else {
            writeMsgOnStream(clientId, msg);
        }
    };

    var socketInputAction = function (clientId) {
        return function (msg) {
            console.log("Have clientId: " + clientId);
            updateLastActiveTime(clientId);
            checkStateAndExecuteAction(clientId, function () {
                checkAndWrite(clientId, msg);
            });
        };
    };

    var checkStateAndExecuteAction = function (clientId, next) {
        if (!clients[clientId] || !clients[clientId].saneState) {
            console.log(clientId + " not accepting events.");
        } else {
            next();
        }
    };

    var socketResetAction = function (clientId) {
        return function () {
            logExceptOnTest('Received reset.');
            checkStateAndExecuteAction(clientId, function () {
                var client = clients[clientId];
                client.saneState = false;
                if (client.mathProgramInstance) {
                    killMathProgram(client.mathProgramInstance, clientId);
                }
                mathProgramStart(clientId, function () {
                    client.saneState = true;
                });
            });
        };
    };

    process.on('uncaughtException', function (err) {
        console.trace(err);
        console.error('Caught exception in global process object: ' + err);
    });

    initializeServer();

    // These are the methods available from the outside:
    return {
        listen: listen,
        close: function () {
            http.close();
        }
    };
};

exports.MathServer = MathServer;
