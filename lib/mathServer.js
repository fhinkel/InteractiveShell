var app = require('express')();
var http = require('http').Server(app);
var fs = require('fs');
var Cookies = require('cookies');
var io = require('socket.io')(http);
var SocketIOFileUpload = require('socketio-file-upload');

var MathServer = function (overrideOptions) {
    var options = {
        port: 8002, // default port number to use
        PRUNE_CLIENT_INTERVAL: 1000 * 60 * 10, // 10 minutes
        MAX_AGE: 1000 * 60 * 60 * 24 * 7, // 1 week
        CONTAINERS: './dummy_containers.js',
        MATH_PROGRAM: "Macaulay2",
        MATH_PROGRAM_COMMAND: 'M2'
    };

    var overrideDefaultOptions = function (overrideOptions) {
        for (var opt in overrideOptions) {
            if (options.hasOwnProperty(opt)) {
                options[opt] = overrideOptions[opt];
                console.log("server option: " + opt + " set to " + options[opt]);
            }
        }
    };

    overrideDefaultOptions(overrideOptions);

    var cookieName = "try" + options.MATH_PROGRAM;

    var totalUsers = 0; //only used for stats: total # users since server started

    // Global array of all Client objects.  Each has a math program process.
    var clients = {};
    if (!options.CONTAINERS) {
        console.log("error, no container management given.");
        throw ("No CONTAINERS!");
    }

    var credentialManager = require(options.CONTAINERS).manager();

    var logClient = function (socket, str) {
        console.log(str);
    };

    var deleteClient = function (socket) {
        credentialManager.removeCredentials(clients[socket].credentials);
        delete clients[socket];
    };

    var timeBeforeInterval = function (timeInterval) {
        var now = Date.now();
        console.log("It is currently " + now + " milliseconds.");
        return now - timeInterval;
    };

    var removeOldClients = function (minimalLastActiveTimeForClient) {
        for (var socket in clients) {
            if (clients.hasOwnProperty(socket)) {
                if (clients[socket].lastActiveTime < minimalLastActiveTimeForClient) {
                    deleteClient(socket);
                }
            }
        }
    };

    var logCurrentlyActiveClients = function () {
        for (var socket in clients) {
            if (clients.hasOwnProperty(socket)) {
                console.log(socket);
            }
        }
    };

    var pruneClients = function () {
        console.log("Pruning clients...");
        var minimalLastActiveTimeForClient = timeBeforeInterval(options.MAX_AGE);
        removeOldClients(minimalLastActiveTimeForClient);
        console.log("Done pruning clients...  Continuing clients:");
        logCurrentlyActiveClients();
    };


    var Client = function () {
        this.recentlyRestarted = false;
        this.lastActiveTime = Date.now(); // milliseconds when client was last active
        this.credentials = 0;
    };

    var getCredentials = function (socket, next) {
        if (clients[socket].credentials) {
            next(clients[socket].credentials);
        } else {
            credentialManager.getNewCredentials(next);
        }
    };

    /*var getSSHOptions = function (credentials) {
     // ssh -t fs "stty isig intr ^N -echoctl ; trap '/bin/true' SIGINT; sleep 1000; echo f" > foo
     var sshOptions = ["-q", "-o", "StrictHostKeyChecking=no"];
     if (credentials.sshKey) {
     sshOptions.push("-i");
     sshOptions.push(credentials.sshKey);
     }
     if (credentials.port){
     sshOptions.push("-p");
     sshOptions.push(credentials.port);
     }
     if (credentials.username) {
     sshOptions.push(credentials.username + "@" + credentials.host);
     } else {
     sshOptions.push(credentials.host);
     }
     //sshOptions.push("stty isig intr ^N; trap '/bin/true' SIGINT; " + options.MATH_PROGRAM_COMMAND);
     return sshOptions;
     };*/

    var spawnMathProgramInSecureContainer = function (socket, next) {
        getCredentials(socket, function (credentials) {
            clients[socket].credentials = credentials;
            var Client = require('ssh2').Client;

            var connection = new Client();
            connection.on('ready', function () {
                connection.exec(options.MATH_PROGRAM_COMMAND, {pty: true}, function (err, stream) {
                    if (err) throw err;
                    stream.on('close', function () {
                        console.log("Stream got closed.");
                        connection.end();
                    });
                    next(stream);
                });
            }).connect({
                host: credentials.host,
                port: credentials.port,
                username: credentials.username,
                privateKey: require('fs').readFileSync(credentials.sshKey)
            });

        });
    };

    var mathProgramStart = function (socket) {
        logClient(socket, "Spawning new MathProgram process...");
        spawnMathProgramInSecureContainer(socket, function (stream) {
            clients[socket].mathProgramInstance = stream;
            clients[socket].mathProgramInstance
                .on('data', sendDataToClient(socket));
        });
    };

    var formatMessage = function (data) {
        return data.replace(/\n$/, "");
    };

    var captureSpecialEvent = function (data) {
        var eventData = data.match(/>>SPECIAL_EVENT_START>>(.*)<<SPECIAL_EVENT_END/);
        if (eventData) {
            console.log("Have special event: " + eventData[1]);
            return eventData[1];
        }
    };

    var emitImageUrlToClient = function (socket, imagePath) {
        var fileName = imagePath.match(/([^\/]*)$/);
        if (fileName) {
            fileName = fileName[0];
        } else {
            return;
        }
        var sftpConnector = require('ssh2')();

        sftpConnector.on('end', function () {
        });

        sftpConnector.on('ready', function () {
            sftpConnector.sftp(function (err, sftp) {
                sftp.fastGet(imagePath, "./public/images/" + fileName, function (error) {
                    if (error) {
                        console.log("Error while downloading image. " + error);
                    }
                    socket.emit("image", "/images/" + fileName);
                });
            });
        });

        sftpConnector.connect(
            {
                host: clients[socket].credentials.host,
                port: clients[socket].credentials.port,
                username: clients[socket].credentials.username,
                privateKey: require('fs').readFileSync(clients[socket].credentials.sshKey)
            }
        );

    };

    var emitHelpUrlToClient = function (socket, viewHelp) {
        console.log("Look at " + viewHelp);
        var helpPath = viewHelp.match(/(\/Macaulay2Doc.*)$/);
        if (helpPath) {
            helpPath = helpPath[0];
        } else {
            return;
        }
        helpPath = "http://www.math.uiuc.edu/Macaulay2/doc/Macaulay2-1.7/share/doc/Macaulay2" + helpPath;
        console.log(helpPath);
        socket.emit("viewHelp", helpPath);
    };

    var isViewHelpEvent = function (eventData) {
        return eventData.match(/^file:.*/);
    };

    var sendDataToClient = function (socket) {
        return function (dataObject) {
            var data = dataObject.toString();
            updateLastActiveTime(socket);
            var specialEvent = captureSpecialEvent(data);
            if (specialEvent) {
                if (isViewHelpEvent(specialEvent)) {
                    emitHelpUrlToClient(socket, specialEvent);
                } else {
                    emitImageUrlToClient(socket, specialEvent);
                }
                return;
            }
            message = formatMessage(data);
            if (!socket) {
                logClient(socket, "Error, no socket for client.");
                return;
            }

            socket.emit('result', message);
        };
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

    var updateLastActiveTime = function (socket) {
        clients[socket].lastActiveTime = Date.now();
    };

    var killMathProgram = function (stream, socket) {
        logClient(socket, "killMathProgramClient.");
        stream.removeAllListeners('data');
        stream.close();
    };

    var resetRecentlyRestarted = function (socket) {
        socket.recentlyRestarted = true;
        setTimeout(function () {
            socket.recentlyRestarted = false;
        }, 1000);
    };

    var moveWelcomeTutorialToBeginning = function (tutorials, firstTutorial) {
        var index = tutorials.indexOf(firstTutorial);
        if (index > -1) {
            tutorials.splice(index, 1);
            tutorials.unshift(firstTutorial);
        }
        return tutorials;
    };

    var getListOfTutorials = function (request, response) {
        var pathForTutorials = "public-" + options.MATH_PROGRAM + '/tutorials/';
        var pathForUserTutorials = "public-" + options.MATH_PROGRAM + '/shared-tutorials/';
        fs.readdir(pathForTutorials, function (err, files) {
            var tutorials = files.map(function (filename) {
                return "tutorials/" + filename;
            });
            fs.exists(pathForUserTutorials, function(exists) {
                if (exists) {
                    fs.readdir(pathForUserTutorials, function (err, files) {
                        var tutorials2 = files.map(function (filename) {
                            return "shared-tutorials/" + filename;
                        });
                        tutorials = tutorials.concat(tutorials2);
                        tutorials = tutorials.filter(function (filename) {
                            return filename.match(/\.html$/);
                        });
                        response.writeHead(200, {
                            "Content-Type": "text/html"
                        });

                        tutorials = moveWelcomeTutorialToBeginning(tutorials, "tutorials/welcome2.html");
                        response.end(JSON.stringify(tutorials));
                    });
                } else {
                    tutorials = tutorials.filter(function (filename) {
                        return filename.match(/\.html$/);
                    });
                    response.writeHead(200, {
                        "Content-Type": "text/html"
                    });

                    tutorials = moveWelcomeTutorialToBeginning(tutorials, "tutorials/welcome2.html");
                    response.end(JSON.stringify(tutorials));
                }
            });
        });
    };

    var unhandled = function (request, response) {
        var url = require('url').parse(request.url).pathname;
        console.log("Request for something we don't serve: " + request.url);
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
        app.use(favicon(__dirname + '/../public-' + options.MATH_PROGRAM + '/favicon.ico'));
        app.use(SocketIOFileUpload.router);
        app.use(serveStatic(__dirname + '/../public-' + options.MATH_PROGRAM));
        app.use(serveStatic(__dirname + '/../public'));
        app.use(expressWinston.logger(loggerSettings));
        app.use('/admin', stats)
            .use('/getListOfTutorials', getListOfTutorials)
            .use(unhandled);
    };

    var attachUploadListenerToSocket = function (socket) {
        var uploader = new SocketIOFileUpload();
        uploader.listen(socket);

        uploader.on("error", function (event) {
            console.log("Error in upload " + event);
        });

        uploader.on("start", function (event) {
            clients[socket].fileUploadBuffer = "";
            console.log('File upload ' + event.file.name);
        });

        uploader.on("progress", function (event) {
            // TODO: Limit size.
            clients[socket].fileUploadBuffer += event.buffer;
        });

        uploader.on("complete", completeFileUpload(socket));
    };

    var completeFileUpload = function (socket) {
        return function (event) {
            var connection = require('ssh2')();

            connection.on('end', function () {
            });

            connection.on('ready', function () {
                connection.sftp(function (err, sftp) {
                    var stream = sftp.createWriteStream(event.file.name);
                    stream.write(clients[socket].fileUploadBuffer.toString());
                    stream.end(function () {
                        connection.end();
                    });
                    clients[socket].fileUploadBuffer = "";
                });
            });

            connection.connect(
                {
                    host: clients[socket].credentials.host,
                    port: clients[socket].credentials.port,
                    username: clients[socket].credentials.username,
                    privateKey: require('fs').readFileSync(clients[socket].credentials.sshKey)
                }
            );

        };
    };

    var listen = function () {
        io.on('connection', function (socket) {
            console.log("Got a new connection.");
            if(!clients[socket]) {
                console.log("Got new client.");
                clients[socket] = new Client();
                attachUploadListenerToSocket(socket);
                socket.on('input', socketInputAction(socket));
                socket.on('reset', socketResetAction(socket));
                socket.on('interrupt', function () {
                    console.log('Interrupt received. ');
                    var stream = clients[socket].mathProgramInstance;
                    console.log('Response: ' + stream.write('\x03'));
                });
            } else {
                console.log("Returning client.");
            }
            console.log("Has input action: " + JSON.stringify(socket.$events));
        });
        return http.listen(options.port);
    };

    var socketInputAction = function (socket) {
        console.log("Setting input action");
        return function (msg) {
            console.log("Received message: " + msg);
            updateLastActiveTime(socket);

            clients[socket].mathProgramInstance.write(msg, function (err) {
                if (err) {
                    logClient(socket, "write failed: " + err);
                }
            });
        };
    };

    var socketResetAction = function (socket) {
        return function () {
            console.log('Received reset.');
            var client = clients[socket];
            if (client.recentlyRestarted) {
                console.log("Ignore repeated restart request");
                return;
            }
            if (client.mathProgramInstance) {
                killMathProgram(client.mathProgramInstance, socket);
            }
            resetRecentlyRestarted(client);
            mathProgramStart(socket);
        };
    };


    process.on('uncaughtException', function (err) {
        console.log('Caught exception in global process object: ' + err);
    });

    setTimeout(pruneClients, options.PRUNE_CLIENT_INTERVAL);
    initializeServer();

    // These are the methods available from the outside:
    return {
        listen: listen,
        getListOfTutorials: getListOfTutorials,
        close: function () {
            http.close();
        }
    };
};

exports.MathServer = MathServer;
