// March 2014, Franziska Hinkelmann, Mike Stillman, and Lars Kastner
//
// This file defines a Node.js server for serving 'try Math Program'.
//   run 
//       node SingularLocalServer.js
//   or
//       node SingularServer.js
// in a terminal in this directory. Alternatively you can use the Makefile 
// provided alongside this repository.
//
// Local version:
//
// In a browser, use: 
//      http://localhost:8002/
// Install via:
//   npm install
// Required on path: math program, such as Singular or Macaulay2
//
//
// A message on / : possibly creates a cookie, and serves back index.html and
// related js/css/png files
// Image is being called by the open script to tell the server where to find a
// jpg that the user created
//

var app = require('express')();
var http = require('http').Server(app);
var fs = require('fs'),
    Cookies = require('cookies');
var io = require('socket.io')(http);

var MathServer = function (overrideOptions) {
    var options = {
        port: 8002, // default port number to use
        PRUNE_CLIENT_INTERVAL: 1000 * 60 * 10, // 10 minutes
        MAX_AGE: 1000 * 60 * 60 * 24 * 7, // 1 week
        SECURE_CONTAINERS: false,
        SECURE_CONTAINERS_USER_NAME: "",
        SSH_KEY_PATH: "/home/admin/.ssh/singular_key",
        MATH_PROGRAM: "Macaulay2",
        MATH_PROGRAM_COMMAND: 'M2'
    };

    var cookieName = "try" + options.MATH_PROGRAM;

    var totalUsers = 0; //only used for stats: total # users since server started

    // An array of Client objects.  Each has a math program process, and a response
    // object It is possible that this.mathProgramInstance is not defined, and/or that
    // this.eventStreams is not defined.
    var clients = {};

    var ipCollection = require('./lxc_manager.js').lxc_manager();

    // preamble every log with the client ID
    var logClient = function (clientID, str) {
        console.log(clientID + ": " + str);
    };

    var deleteClient = function (clientID) {
        ipCollection.removeIp(clients[clientID].ip);
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
                console.log("lastActiveTime for user : " + clientID + " " +
                clients[clientID].lastActiveTime);
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

    // deciding that a user is obsolete: 
    // set clients[clientID].timestamp (set by M2 output or the client's input)
    // in set time intervals, iterate over clients and if timestamp is too old
    // or using too high resources, delete the client
    var pruneClients = function () {
        // run this when using schroot.
        // this loops through all clients, and checks their timestamp, also, it
        // checks their resource usage with a perl script. Remove old or bad
        // clients
        console.log("Pruning clients...");
        var minimalLastActiveTimeForClient = timeBeforeInterval(options.MAX_AGE);
        removeOldClients(minimalLastActiveTimeForClient);
        console.log("Done pruning clients...  Continuing clients:");
        logCurrentlyActiveClients();
    };

    // runs a command, and calls the callbackFnc with the output from stdout
    var runShellCommand = function (cmd, callback) {
        console.log("Run shell command: " + cmd);
        require('child_process').exec(cmd, function (error, stdout) {
            callback(stdout);
        });
    };

    var Client = function (socket) {
        this.socket = socket;
        // generated randomly in startUser(), used for cookie and as user name
        // on the system
        this.recentlyRestarted = false;
        // we use this to keep from handling a bullet stream of restarts
        this.lastActiveTime = Date.now(); // milliseconds when client was last active
        this.ip = 0;
    };


    // returns true if clients[clientID] exists
    // clientID is of the form user12345
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

    var startUser = function (cookies, request, callbackFcn) {
        totalUsers = totalUsers + 1;
        var clientID = getNewClientID();
        setCookie(cookies, clientID);
        clients[clientID] = new Client();
        clients[clientID].clientID = clientID;

        logClient(clientID,
            "New user: " + " UserAgent=" + request.headers['user-agent'] + ".");
        logClient(clientID, "schroot: " + options.SECURE_CONTAINERS);
        callbackFcn(clientID);
    };

    var getIp = function (clientID, next) {
        var ip = clients[clientID].ip;
        logClient(clientID, "Want to get ip. " + ip);
        if (ip == 0) {
            ipCollection.getNewIp(next)
        } else {
            next(ip);
        }
    };

    var escapeSpacesForSpawnCommand = function (cmd) {
        return cmd.replace(/ /g, "\ ");
    };

    var spawnMathProgramInSecureContainer = function (clientID, next) {
        getIp(clientID, function (ip) {
            logClient(clientID, "In spawn, have ip: " + ip);
            var spawn = require('child_process').spawn;
            clients[clientID].ip = ip;
            var sshCommand = "ssh -oStrictHostKeyChecking=no -i " + options.SSH_KEY_PATH + " " + options.SECURE_CONTAINERS_USER_NAME + "@" + ip;
            var args = ["-c", escapeSpacesForSpawnCommand(sshCommand)];
            logClient(clientID, args.join(" "));
            var process = spawn('script', args);

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
        var spawn = require('child_process').spawn;
        logClient(clientID, "Spawning new MathProgram process...");
        if (options.SECURE_CONTAINERS) {
            spawnMathProgramInSecureContainer(clientID, function (process) {
                process.on('exit', removeListenersFromPipe(clientID));
                setPipeEncoding(process, "utf8");
                clients[clientID].mathProgramInstance = process;
                attachListenersToOutput(clientID);
            });
        } else {
            var process = spawn(options.MATH_PROGRAM_COMMAND);
            process.on('exit', removeListenersFromPipe(clientID));
            setPipeEncoding(process, "utf8");
            clients[clientID].mathProgramInstance = process;
            attachListenersToOutput(clientID);
        }
    };

    var formatServerSentEventMessage = function (data) {
        return data.replace(/\n$/, "");

    };

    var sendDataToClient = function (clientID) {
        return function (data) {
            var socket = clients[clientID].socket;
            updateLastActiveTime(clientID);
            message = formatServerSentEventMessage(data);
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

    var runFunctionIfClientExists = function (next) {
        return function (request, response) {
            var cookies = new Cookies(request, response);
            var clientID = cookies.get(cookieName);
            console.log("Client has cookie value: " + clientID);
            if (!clients[clientID]) {
                startUser(cookies, request, next(request, response));
            } else {
                next(request, response)(clientID);
            }
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


    var updateLastActiveTime = function (clientID) {
        clients[clientID].lastActiveTime = Date.now();
    };




    var killMathProgram = function (m2Process, clientID) {
        logClient(clientID, "killMathProgramClient: " + m2Process.pid);
        m2Process.kill();
        m2Process.stdin.end();
        if (options.SECURE_CONTAINERS) {
            runShellCommand("killall -u " + clients[clientID].systemUserName, function (ret) {
                console.log(
                    "We removed processes associates to " + clientID + " with result: " + ret);
            });
        }
    };

    var resetRecentlyRestarted = function (client) {
        client.recentlyRestarted = true;
        setTimeout(function () {
            client.recentlyRestarted = false;
        }, 1000);
    };


    /* To find the actual M2 we have to dig a little deeper:
     The m2.pid is the PID of the cgexec command.
     Using pgrep we gets the child process(es).
     In this case there is only one, namely the schroot.
     The child of the schroot then is M2 which we want to interrupt.
     DEPRECATED!
     */
    var sendInterruptToM2Process = function (schrootPid) {
        runShellCommand('n=`pgrep -P ' + schrootPid + '`; n=`pgrep -P $n`; pgrep -P $n', function (m2Pid) {
            logClient(clientID, "PID of M2 inside schroot: " + m2Pid);
            var cmd = 'kill -s INT ' + m2Pid;
            runShellCommand(cmd, function (res) {
            });
        });
    };

    // returning clientID for a given M2 pid
    // This currently does not work when working inside a schroot, because pid
    // is not the schroot's pid
    var findClientID = function (pid) {
        //console.log("Searching for clientID whose M2 has PID " + pid);
        for (var prop in clients) {
            if (clients.hasOwnProperty(prop) && clients[prop] && clients[prop].mathProgramInstance) {
                if (pid == clients[prop].mathProgramInstance.pid) {
                    //console.log("We found the client! It is " + prop);
                    if (clients[prop].eventStreams.length != 0) {
                        //console.log("findClientID picked user with clientID " + prop);
                        return prop;
                    } else {
                        throw ("Client " + clientID +
                        " does not have an eventStream.");
                    }
                }
            }
        }
        throw ("Did not find a client for PID " + pid);
    };

    var regexMatchingForClientID = function (url) {
        // The URL's in question look like:
        //  (schroot version): /user45345/var/a.jpg
        //  (non-schroot): /dfdff/dsdsffff/fdfdsd/M2-12345-1/a.jpg
        //     where 12345 is the pid of the M2 process.
        var clientID;
        var matchObject;
        if (options.SECURE_CONTAINERS) {
            // This needs to be changed. What we might get here is only
            // the username. We need to match the clientID from this.
            matchObject = url.match(/^\/(user\d+)\//);
        } else {
            matchObject = url.match(/\/M2-(\d+)-/);
        }
        if (!matchObject) {
            console.log("error, could not find clientID from url");
            throw ("could not find clientID from url");
        }
        if (options.SECURE_CONTAINERS) {
            clientID = matchObject[1];
        } else {
            clientID = findClientID(matchObject[1]);
        }
        return clientID;
    };

    var getValidClientIDFromUrl = function (url) {
        var clientID = regexMatchingForClientID(url);
        // Sanity check:
        var client = clients[clientID];
        if (!client) {
            throw ("No client for ID: " + clientID);
        }
        return clientID;
    };

    var parseUrlForPath = function (clientID, url) {
        var path = url.replace(/^\/(user)?\d+\//, "");
        if (!path) {
            throw ("Could not extract path from " + url);
        }
        if (options.SECURE_CONTAINERS) {
            path = "/usr/local/var/lib/schroot/mount/" + clients[clientID].schrootName + path
        }
        return path;
    };


    var getFilenameWithoutPath = function (remotePath) {
        return remotePath;
    };

    var getIpFromUrl = function (url) {
        matchObject = url.match(/\/IP-(\d+\.\d+\.\d+\.\d+)-/);
        if (!matchObject) {
            console.log("error, could not find IP from url");
            throw ("could not find IP from url");
        }
        return matchObject[1];
    };

    var getClientIdFromIp = function (ip) {

    };

    // todo: should we check for secure_containers? A /image request should only be sent
    // if open script in secure container has been set up to do so, is it a security
    // problem if one can send /image to local servers?
    var forwardRequestForSpecialEventToClient = function (eventType) {
        return function (request, response) {
            var url = require('url').parse(request.url).pathname;
            response.writeHead(200);
            response.end();
            try {
                var ip = getIpFromUrl(url);
                var clientId = getClientIdFromIp(ip);
                logClient(clientID, "Request for " + eventType + " received: " + url);
                var remotePath = parseUrlForPath(clientID, url); // a string
                var localFilename = getFilenameWithoutPath(remotePath);
                var sftp = require('./sftp.js').sftp(options.SECURE_CONTAINERS_USER_NAME);
                sftp.connect(ip);
                sftp.download(remotePath, localFilename, function (error) {
                    if (error) {
                        logClient(clientID, "Downloading file from container to server failed.");
                        return;
                    }
                    message = 'event: ' + eventType + '\r\ndata: ' + localFilename + "\r\n\r\n";
                    sendMessageToClient(clientID, message);
                });
            } catch (err) {
                logClient(clientID, "Received invalid request: " + err);
            }
        };
    };


    var unhandled = function (request, response) {
        var url = require('url').parse(request.url).pathname;
        console.log("Request for something we don't serve: " + request.url);
        response.writeHead(404, "Request for something we don't serve.");
        response.write("404");
        response.end();
    };


    var saveUploadedFile = function (temporaryFilename, filename, clientID, response) {
        return function () {
            console.log("end received from formidable form");

            var ip = clients[clientID].ip;
            var sftpModule = require('./sftp.js');
            var sftp = sftpModule.sftp(options.SECURE_CONTAINERS_USER_NAME);
            sftp.connect(ip);
            sftp.upload(temporaryFilename, filename, function (error) {
                if (error) {
                    logClient(clientID, 'received error in upload: ' + error);
                    sendUploadError(clientID)(response);
                } else {
                    response.writeHead(200, {
                        "Content-Type": "text/html"
                    });
                    response.end('upload complete!');
                }
            });
        };
    };

    var sendUploadError = function (clientID) {
        return function (response) {
            response.writeHead(500, {
                "Content-Type": "text/html"
            });
            response.end('upload not complete!');
        };
    };

    var uploadFile = function (request, response) {
        return function (clientID) {
            logClient(clientID, "received: /uploadTutorial");
            var formidable = require('formidable');
            var form = new formidable.IncomingForm;
            var temporaryFilename;

            form.on('file', function (name, file) {
                temporaryFilename = file.path;
                form.on('end', saveUploadedFile(temporaryFilename, file.name, clientID, response));
            });
            form.on('error', function (error) {
                logClient(clientID, 'received error in upload: ' + error);
                sendUploadError(clientID)(response);
            });
            form.parse(request);
        };
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
        fs.readdir("public/tutorials/", function (err, files) {
            var tutorials = files.map(function (filename) {
                return "tutorials/" + filename;
            });
            console.log("Files: " + tutorials);
            response.writeHead(200, {
                "Content-Type": "text/html"
            });

            tutorials = moveWelcomeTutorialToBeginning(tutorials, "tutorials/welcome2.html");
            response.end(JSON.stringify(tutorials));
        });
    };


    var initializeServer = function () {
        // when run in production, work with secure containers.
        if (options.SECURE_CONTAINERS) {
            console.log('Running with secure containers.');
            setInterval(pruneClients, options.PRUNE_CLIENT_INTERVAL);
        }

        // Send a comment to the clients every 20 seconds so they don't 
        // close the connection and then reconnect

        console.log("Starting " + options.MATH_PROGRAM + " server.");

        console.log('connect.static public-' + options.MATH_PROGRAM + '/ and public/ as fallback.');

        var winston = require('winston'),
            expressWinston = require('express-winston');
        app.use(expressWinston.logger({
            transports: [
                new winston.transports.Console({
                    level: 'error',
                    json: true,
                    colorize: true
                })
            ]
        }));

        var favicon = require('serve-favicon');
        app.use(favicon(__dirname + '/../public-' + options.MATH_PROGRAM + '/favicon.ico'));

        var serveStatic = require('serve-static');
        app.use(serveStatic('public-' + options.MATH_PROGRAM));
        app.use(serveStatic('public'));

        app.use('/admin', stats)
            .use('/upload', runFunctionIfClientExists(uploadFile))
            .use('/viewHelp', forwardRequestForSpecialEventToClient("viewHelp"))
            .use('/image', forwardRequestForSpecialEventToClient("image"))
            .use('/getListOfTutorials', getListOfTutorials)
            .use(unhandled);
    };

    var listen = function () {

        io.on('connection', function (socket) {
            var cookies = socket.request.headers.cookie;
            var clientId = cookies["try" + options.MATH_PROGRAM];
            console.log('a new user connected with ' + clientId);
            if (!socket.clientID) {
                if (!clientId || !clients[clientId]) {
                    clientId = getNewClientID();
                    clients[clientId] = new Client(socket);
                    //socket.response.headers.cookies["try" + options.MATH_PROGRAM] = clientId;
                    clients[clientId].clientID = clientId;
                } else {
                    clients[clientId].socket = socket;
                }
                socket.clientID = clientId;
            }

            if (!clients[clientId].mathProgramInstance) {
                mathProgramStart(clientId);
            }

            socket.on('input', function (msg) {
                console.log('message: ' + msg);
                updateLastActiveTime(clientId);

                clients[socket.clientID].mathProgramInstance.stdin.write(msg, function (err) {
                    if (err) {
                        logClient(socket.clientID, "write failed: " + err);
                    }
                });
            });

            socket.on('reset', function(){
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
            });

            socket.on('interrupt', function(){
               console.log('Interrupt received.');
               // FIXME
               return;
            });
        });
        return http.listen(options.port);
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

    process.on('uncaughtException', function (err) {
        console.log('Caught exception in global process object: ' + err);
    });


    overrideDefaultOptions(overrideOptions);
    initializeServer();


    // These are the methods available from the outside:
    return {
        listen: listen,
        close: function () {
            http.close();
        }
    };
}; // end of def of MathServer

exports.MathServer = MathServer;
