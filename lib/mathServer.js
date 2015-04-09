//
//   npm install
//   npm start
// Required on path: math program, such as Singular or Macaulay2
//
// In a browser, use:
//      http://localhost:8002/
//

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
        // Start of Server creation code
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
    if (options.CONTAINERS) {
        var credentialManager = require(options.CONTAINERS).manager();
    } else {
        console.log("error, no container management given.");
        throw ("No CONTAINERS!");
    }

    // preamble every log with the client ID
    var logClient = function (clientID, str) {
        console.log(clientID + ": " + str);
    };

    var deleteClient = function (clientID) {
        credentialManager.removeCredentials(clients[clientID].credentials);
        delete clients[clientID];
    };

    var timeBeforeInterval = function (timeInterval) {
        var now = Date.now();
        console.log("It is currently " + now + " milliseconds.");
        return now - timeInterval;
    };

    var removeOldClients = function (minimalLastActiveTimeForClient) {
        for (var clientID in clients) {
            if (clients.hasOwnProperty(clientID)) {
                if (clients[clientID].lastActiveTime < minimalLastActiveTimeForClient) {
                    deleteClient(clientID);
                }
            }
        }
    };

    var logCurrentlyActiveClients = function () {
        for (var clientID in clients) {
            if (clients.hasOwnProperty(clientID)) {
                console.log(clientID);
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

    setTimeout(pruneClients, options.PRUNE_CLIENT_INTERVAL);

    var Client = function () {
        this.recentlyRestarted = false;
        this.lastActiveTime = Date.now(); // milliseconds when client was last active
        this.credentials = 0;
    };

    var clientIDExists = function (clientID) {
        if (clients[clientID] == null) {
            return false;
        }
        logClient(clientID, "Client already exists");
        return true;
    };

    var getNewClientID = function () {
        do {
            var clientID = Math.random() * 1000000;
            clientID = Math.floor(clientID);
        } while (clientIDExists(clientID));
        clientID = "user" + clientID.toString(10);
        console.log("New Client ID " + clientID);
        return clientID;
    };

    var setCookie = function (cookies, clientID) {
        cookies.set(cookieName, clientID, {
            httpOnly: false
        });
    };

    var getCredentials = function (clientID, next) {
        if (clients[clientID].credentials) {
            next(clients[clientID].credentials);
        } else {
            credentialManager.getNewCredentials(next);
        }
    };

    var getSSHOptions = function (credentials) {
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
        //sshOptions.push('export WWWBROWSER="'+ __dirname + '/../open"; ' + "export PATH=" + __dirname + "/../:$PATH; " + options.MATH_PROGRAM_COMMAND);
        sshOptions.push("export WWWBROWSER=/usr/bin/open; export PATH=/usr/bin:$PATH; " + options.MATH_PROGRAM_COMMAND);
        return sshOptions;
    };

    var spawnMathProgramInSecureContainer = function (clientID, next) {
        getCredentials(clientID, function (credentials) {
            var spawn = require('child_process').spawn;
            clients[clientID].credentials = credentials;
            var process = spawn("ssh", getSSHOptions(credentials));
            next(process);
        });
    };

    var removeListenersFromPipe = function (clientID) {
        return function (returnCode, signal) {
            logClient(clientID, "M2 exited.");
            logClient(clientID, "returnCode: " + returnCode);
            logClient(clientID, "signal: " + signal);
            this.stdout.removeAllListeners('data');
            this.stderr.removeAllListeners('data');
        };
    };

    var setPipeEncoding = function (process, encoding) {
        process.stdout.setEncoding(encoding);
        process.stderr.setEncoding(encoding);
    };

    var mathProgramStart = function (clientID) {
        logClient(clientID, "Spawning new MathProgram process...");
        spawnMathProgramInSecureContainer(clientID, function (process) {
            process.on('exit', removeListenersFromPipe(clientID));
            setPipeEncoding(process, "utf8");
            clients[clientID].mathProgramInstance = process;
            attachListenersToOutput(clientID);
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

    var emitImageUrlToClient = function (clientId, imagePath) {
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
                    clients[clientId].socket.emit("image", "/images/" + fileName);
                });
            });
        });

        sftpConnector.connect(
            {
                host: clients[clientId].credentials.host,
                port: clients[clientId].credentials.port,
                username: clients[clientId].credentials.username,
                privateKey: require('fs').readFileSync(clients[clientId].credentials.sshKey)
            }
        );

    };

    var emitHelpUrlToClient = function(clientID, viewHelp){
       console.log("Look at " + viewHelp);
       var helpPath = viewHelp.match(/(\/Macaulay2Doc.*)$/);
       if(helpPath){
          helpPath = helpPath[0];
       } else {
          return;
       }
       helpPath = "http://www.math.uiuc.edu/Macaulay2/doc/Macaulay2-1.7/share/doc/Macaulay2" + helpPath;
       console.log(helpPath);
       clients[clientID].socket.emit("viewHelp", helpPath);
    };

    var isViewHelpEvent = function(eventData){
       return eventData.match(/^file:.*/);
    };

    var sendDataToClient = function (clientID) {
        return function (data) {
            var socket = clients[clientID].socket;
            updateLastActiveTime(clientID);
            var specialEvent = captureSpecialEvent(data);
            if (specialEvent) {
               if(isViewHelpEvent(specialEvent)){
                  emitHelpUrlToClient(clientID, specialEvent);
               } else {
                  emitImageUrlToClient(clientID, specialEvent);
               }
                return;
            }
            message = formatMessage(data);
            if (!socket) {
                logClient(clientID, "Error, no socket for client.");
                return;
            }

            socket.emit('result', message);
        };
    };

    var attachListenersToOutputPipes = function (clientID) {
        var mathProgramProcess = clients[clientID].mathProgramInstance;
        mathProgramProcess.stdout.removeAllListeners('data');
        mathProgramProcess.stderr.removeAllListeners('data');
        mathProgramProcess.stdout.on('data', sendDataToClient(clientID));
        mathProgramProcess.stderr.on('data', sendDataToClient(clientID));
    };

    var attachListenersToOutput = function (clientID) {
        var client = clients[clientID];
        if (!client) return;
        if (client.mathProgramInstance) {
            attachListenersToOutputPipes(clientID);
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
        clients[clientID].lastActiveTime = Date.now();
    };

    var killMathProgram = function (m2Process, clientID) {
        logClient(clientID, "killMathProgramClient: " + m2Process.pid);
        m2Process.kill();
        m2Process.stdin.end();
    };

    var resetRecentlyRestarted = function (client) {
        client.recentlyRestarted = true;
        setTimeout(function () {
            client.recentlyRestarted = false;
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
        fs.readdir(pathForTutorials, function (err, files) {
            var tutorials = files.map(function (filename) {
                return "tutorials/" + filename;
            });
            response.writeHead(200, {
                "Content-Type": "text/html"
            });

            tutorials = moveWelcomeTutorialToBeginning(tutorials, "tutorials/welcome2.html");
            response.end(JSON.stringify(tutorials));
        });
    };

    var checkCookie = function (request, response, next) {
        var cookies = new Cookies(request, response);
        var clientID = cookies.get(cookieName);
        if (!clientID) {
            console.log('New client without a cookie set came along');
            console.log('Set new cookie!');
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
        app.use(checkCookie);
        app.use(serveStatic(__dirname + '/../public-' + options.MATH_PROGRAM));
        app.use(serveStatic(__dirname + '/../public'));
        app.use('/var', serveStatic('/var'));
        app.use('/tmp', serveStatic('/tmp'));
        app.use(expressWinston.logger(loggerSettings));
        app.use('/admin', stats)
            .use('/getListOfTutorials', getListOfTutorials)
            .use(unhandled);
    };

    var attachUploadListenerToSocket = function (clientId, socket) {
        // Make an instance of SocketIOFileUpload and listen on this socket:
        var uploader = new SocketIOFileUpload();
        uploader.listen(socket);

        uploader.on("error", function (event) {
            console.log("Error in upload " + event);
        });

        uploader.on("start", function (event) {
            clients[clientId].fileUploadBuffer = "";
            console.log('File upload ' + event.file.name);
        });

        uploader.on("progress", function (event) {
            // TODO: Limit size.
            clients[clientId].fileUploadBuffer += event.buffer;
        });

        uploader.on("complete", completeFileUpload(clientId));
    };


    var completeFileUpload = function (clientId) {
        return function (event) {
            var sftpConnector = require('ssh2')();

            sftpConnector.on('end', function () {
            });

            sftpConnector.on('ready', function () {
                sftpConnector.sftp(function (err, sftp) {
                    var stream = sftp.createWriteStream(event.file.name);
                    stream.write(clients[clientId].fileUploadBuffer.toString());
                    stream.end(function () {
                        sftpConnector.end();
                    });
                    clients[clientId].fileUploadBuffer = "";
                });
            });

            sftpConnector.connect(
                {
                    host: clients[clientId].credentials.host,
                    port: clients[clientId].credentials.port,
                    username: clients[clientId].credentials.username,
                    privateKey: require('fs').readFileSync(clients[clientId].credentials.sshKey)
                }
            );

        };
    };

    var socketSanityCheck = function (clientId, socket) {
        if (!clients[clientId]) {
            clients[clientId] = new Client();
            clients[clientId].clientID = clientId;
        }
        clients[clientId].socket = socket;

        if (!clients[clientId].mathProgramInstance) {
            mathProgramStart(clientId);
        }
    };

    var listen = function () {
        var cookieParser = require('socket.io-cookie');
        io.use(cookieParser);
        io.on('connection', function (socket) {
            var cookies = socket.request.headers.cookie;
            var clientId = cookies[cookieName];
            socketSanityCheck(clientId, socket);
            attachUploadListenerToSocket(clientId, socket);
            socket.on('input', socketInputAction(clientId));
            socket.on('reset', socketResetAction(clientId));
            socket.on('interrupt', function () {
                console.log('Interrupt received.');
                // clients[clientId].mathProgramInstance.stdin.write("\x03");
            });
        });
        return http.listen(options.port);
    };

    var socketInputAction = function (clientId) {
        return function (msg) {
            updateLastActiveTime(clientId);

            clients[clientId].mathProgramInstance.stdin.write(msg, function (err) {
                if (err) {
                    logClient(clientId, "write failed: " + err);
                }
            });
        };
    };

    var socketResetAction = function (clientId) {
        return function () {
            console.log('Received reset.');
            var client = clients[clientId];
            if (client.recentlyRestarted) {
                console.log("Ignore repeated restart request");
                return;
            }
            if (client.mathProgramInstance) {
                killMathProgram(client.mathProgramInstance, clientId);
            }
            resetRecentlyRestarted(client);
            mathProgramStart(clientId);
        };
    };


    process.on('uncaughtException', function (err) {
        console.log('Caught exception in global process object: ' + err);
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
