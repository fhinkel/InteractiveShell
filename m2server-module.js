// March 2013, Franziska Hinkelmann, Mike Stillman, and Lars Kastner
//
// This file defines a Node.js server for serving 'tryM2'.
//   run 
//       node m2server.js 
//   or
//       node m2server-schroot.js
// in a terminal in this directory. Alternatively you can use the Makefile 
// provided alongside this repository.
//
//
// Local version:
//
// In a browser, use: 
//      http://localhost:8002/
// Requirements:
//   Node.js libraries: cookies, connect, fs, http.  
// Install via:
//   npm install cookies, or sudo npm install -g cookies
// Required on path: M2
// We are using our own open script to make Graphs.m2 work (generate jpegs for
// users), please include the current directory in your path: 
// export PATH=.:$PATH
//
//
// Schroot version:
//
// Intended to run on (s)chrooted environment, where every user starts M2 in a
// separate schroot. For setup instructions please see configuring_ubuntu.tex.
//
//
// A message on / : possibly creates a cookie, and serves back index.html and
// related js/css/png files
// A POST message on /chat: input should be Macaulay2 commands to perform.  A
// message on /chat: start an event emitter, which will return the output of
// the M2 process.
// Image is being called by the open script to tell the server where to find a
// jpg that the user created
//
// Using Node connect, but not express

var http = require('http'),
    fs = require('fs'),
    connect = require('connect'),
    Cookies = require('cookies');

var M2Server = function(overrideOptions) {
    var options = {
        port: 8002, // default port number to use
        userMemoryLimit: 500000000, // Corresponds to 500M memory
        userCpuLimit: 256, // Corresponds to 256 shares of the CPU.
        // As stated wrongly on the internet this does NOT
        // correspond to 25% CPU.  The total number of shares is
        // determined as the sum of all these limits, i.e. if
        // there is only one user, he gets 100% CPU.
        PRUNECLIENTINTERVAL: 1000 * 60 * 10, // 10 minutes
        MAXAGE: 1000 * 60 * 60 * 24 * 7, // 1 week
        SCHROOT: false // if true: start with 'sudo make start' on server.
    },

        totalUsers = 0, //only used for stats: total # users since server started
	userNumber = 0, //number in the system

        // An array of Client objects.  Each has an M2 process, and a response
        // object It is possible that this.m2 is not defined, and/or that
        // this.eventStream is not defined.
        clients = {};

    // preamble every log with the client ID
    var logClient = function(clientID, str) {
        console.log(clientID + ": " + str);
    };

    // delete a user both from the system and the clients[]
    var deleteClient = function(clientID) {
        runShellCommand('perl-scripts/remove_user.pl ' + clients[clientID].systemUserName + ' ' 
        + clients[clientID].schrootName + ' ' + clients[clientID].schrootType, function(ret) {
            console.log("We removed client " + clientID + " with result: " +
                ret);
        });
        delete clients[clientID];
    };

    // deciding that a user is obsolete: 
    // set clients[clientID].timestamp (set by M2 output or the client's input)
    // in set time intervals, iterate over clients and if timestamp is too old
    // or using too high resources, delete the client
    var pruneClients = function() {
        // run this when using schroot.
        // this loops through all clients, and checks their timestamp, also, it
        // checks their resource usage with a perl script. Remove old or bad
        // clients
        console.log("Pruning clients...");
        var clientID = null;
        var now = Date.now();
        console.log("It is currently " + now + " milliseconds.");
        var minAge = now - options.MAXAGE;
        for (clientID in clients) {
            if (clients.hasOwnProperty(clientID)) {
                console.log("*** lastActivetime for user : " + clientID + " " +
                    clients[clientID].lastActiveTime)
                if (clients[clientID].lastActiveTime < minAge) {
                    deleteClient(clientID);
                }
            }
        }
        console.log("Done pruning clients...  Continuing clients:");
        for (clientID in clients) {
            if (clients.hasOwnProperty(clientID)) {
                console.log(clientID);
            }
        }
    };

    var runShellCommand = function(cmd, callbackFcn) {
        // runs a command, and calls the callbackFnc with the output from stdout

        require('child_process').exec(cmd, function(error, stdout, stderr) {
            //console.log("runShellCommand result:" + stdout);
            callbackFcn(stdout);
        });
    };

    var Client = function() {
        this.m2 = null;
        this.eventStream = [];
        this.clientID = null;
        this.schrootType = null;
        this.schrootName = null;
        this.systemUserName = null;
        // generated randomly in startUser(), used for cookie and as user name
        // on the system
        this.recentlyRestarted = false;
        // we use this to keep from handling a bullet stream of restarts
        this.lastActiveTime = Date.now(); // milliseconds when client was last active
        console.log("function Client()");
    };
    
    
    // returns true if cliens[clientID] exists
    // clientID is of the form user12345
    var clientIDExists = function(clientID) {
        if(clients[clientID] == null ){
            return false;
        }
        logClient(clientID, "Client already exists");
        return true;
    };
    
    
    var startUser = function(cookies, request, callbackFcn) {
        totalUsers = totalUsers + 1;
        var clientID;
	var otherRandomNumber;
        while(clientID == null || clientIDExists(clientID) ) {
            clientID = Math.random() * 1000000;
            clientID = Math.floor(clientID);
	    otherRandomNumber = userNumber;
	    userNumber++;
            clientID = "user" + clientID.toString(10);
        }
        cookies.set("tryM2", clientID, {
            httpOnly: false
        });
        clients[clientID] = new Client();
        clients[clientID].clientID = clientID;

        // Setting the schroot and system related variables.
	clients[clientID].schrootType = 'system' + otherRandomNumber;// + 'st';
        clients[clientID].schrootName = 'system' + otherRandomNumber;// + 'sn';
        clients[clientID].systemUserName = 'system' + otherRandomNumber;// + 'sun';
        clients[clientID].prepend = "";
        // For now we choose all these to be equal.
        // getClientIDFromURL does not work if we choose these to be different
        // from each other.
        // There are several locations where we will have to adapt the path.
        
        logClient(clientID, "New user: " + " UserAgent=" + request.headers[
            'user-agent'] + ".");
        if (options.SCHROOT) {
            runShellCommand('perl-scripts/create_user.pl ' + clients[clientID].systemUserName 
                + ' ' + clients[clientID].schrootType + ' ' +
                options.userMemoryLimit + ' ' + options.userCpuLimit, function(
                ret) {
                //console.log( "***" + ret );
                logClient(clientID, "Spawning new schroot process named " +
                    clientID + ".");
                /*
                  The following command creates a schroot environment for the user.
                  -c specifies the schroot type. This tells schroot to use the config file
                     created by create_user.pl. The -c below at entering schroot is not the same.
                  -n Sets the name of the schroot. This name will be used for the -c option
                     below upon entering the schroot.
                  -b is the begin flag.
                */
                require('child_process').exec('sudo -u ' + clients[clientID].systemUserName +
                    ' schroot -c ' + clients[clientID].schrootType + ' -n ' + clients[clientID].schrootName + ' -b', function() { 
                    callbackFcn(clientID);
                });
            });
        } else {
            callbackFcn(clientID);
        }
        return clientID;
    };

    var m2Start = function(clientID) {
        var spawn = require('child_process').spawn;
        if (options.SCHROOT) {
            /*
               Starting M2 in a secure way requires several steps:
               1. cgexec adds our process to two cgroups that create_user.pl created.
                  cpu:clientID restricts the CPU shares of the user
                  memory:clientID restricts the memory accessible by the user
               2. schroot enters a secure chroot environment. No files from the actual
                  system are available on the inside.
                  -u specifies the username inside the schroot
                  -c specifies the name of the schroot we want to enter
                  -d specifies the directory inside the schroot we want to enter
                  -r specifies the command to be run upon entering.
            */
            var m2 = spawn('sudo', ['cgexec', '-g', 'cpu,memory:' + clients[clientID].systemUserName,
                    'sudo', '-u', clients[clientID].systemUserName, 'nice', 'schroot', '-c', clients[clientID].schrootName,
                                    '-u', clients[clientID].systemUserName, '-d', '/home/m2user/', '-r', 'M2'
            ]);
        } else {
            m2 = spawn('M2');
            logClient(clientID, "Spawning new M2 process...");
        }

        m2.on('exit', function(returnCode, signal) {
            // the schroot might still be valid or unmounted
            logClient(clientID, "M2 exited.");
            logClient(clientID, "returnCode: " + returnCode);
            logClient(clientID, "signal: " + signal);
            m2.stdout.removeAllListeners('data');
            m2.stderr.removeAllListeners('data');
        });

        m2.stdout.setEncoding("utf8");
        m2.stderr.setEncoding("utf8");
        return m2;
    };

    var m2ConnectStream = function(clientID) {
        var client = clients[clientID];
        if (!client) return;

        var ondata = function(data) {
            client.lastActiveTime = Date.now();
            var data1 = data.replace(/\n$/, "");
            //logClient(clientID, "data: " + data1.replace(/\n+/g, "\n" + clientID + ": data: "));
            message = 'data: ' + data.replace(/\n/g, '\ndata: ') + "\r\n\r\n";
            if (!client.eventStream || client.eventStream.length == 0) { // fatal error, should not happen
                logClient(clientID, "Error: No event stream in m2ConnectStream");
                return;
                //throw "Error: No client.eventStream in Start M2";
            }
            
            for (var stream in client.eventStream) {
                //logClient(clientID, "write: " + message);
                client.eventStream[stream].write(message);
            }
        };
        if (client.m2) {
            client.m2.stdout.removeAllListeners('data');
            client.m2.stderr.removeAllListeners('data');
            client.m2.stdout.on('data', ondata);
            client.m2.stderr.on('data', ondata);
        }
    };

    var assureClient = function(request, response, callbackFcn) {
        var cookies = new Cookies(request, response);
        var clientID = cookies.get("tryM2");
        //console.log("Client has cookie value: " + clientID);

        // Start new user for users coming with invalid, i.e., old, cookie
        if (!clients[clientID]) {
            clientID = startUser(cookies, request, callbackFcn);
        } else {
            callbackFcn(clientID);
        }
    };

    var stats = function(request, response, next) {
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
            '<head><link rel="stylesheet" href="m2.css" type="text/css" media="screen"></head>');
        response.write('<h1>Macaulay2 User Statistics</h1>');
        response.write("There are currently " + currentUsers +
            " users using M2.<br>");
        response.write("In total, there were " + totalUsers +
            " users since the server started.<br>");
        response.write("Enjoy M2!");
        response.end();
    };

    var keepEventStreamsAlive = function() {
        for (var prop in clients) {
            if (clients.hasOwnProperty(prop) && clients[prop] && clients[prop].eventStream) {
                for(var stream in clients[prop].eventStream ) {
                    clients[prop].eventStream[stream].write(":ping\n");
                }
            }
        }
    };

    // Client starts eventStream to obtain M2 output and start M2
    var startSource = function(request, response) {
        assureClient(request, response, function(clientID) {
            response.writeHead(200, {
                'Content-Type': "text/event-stream"
            });
            logClient(clientID, "pushing a response");
            clients[clientID].eventStream.push(response);

            if (!clients[clientID].m2) {
                clients[clientID].m2 = m2Start(clientID);
            }
            m2ConnectStream(clientID);
            
            // If the client closes the connection, remove client from the list of active clients
            request.connection.on("end", function() {
                logClient(clientID, "event stream closed");
                if (clients[clientID]) {
                    //clients[clientID].eventStream = [];
                }
                response.end();
            });
        });
    };

    var m2InputAction = function(request, response) {
        assureClient(request, response, function(clientID) {
            if (!checkForEventStream(clientID, response)) {
                return;
            };
            request.setEncoding("utf8");
            var body = "";
            // When we get a chunk of data, add it to the body
            request.on("data", function(chunk) {
                body += chunk;
            });

            // Send input to M2 when we have received the complete body
            request.on("end", function() {
                m2ProcessInput(clientID, body, response);
            });
        });
    };

    var m2ProcessInput = function(clientID, body, response) {
        try {
            logClient(clientID, "M2 input: " + body);
            if (!clients[clientID] || !clients[clientID].m2 || !clients[
                clientID].m2.stdin.writable) {
                // this user has been pruned out!  Simply return.
                response.writeHead(200);
                response.end();
                return;
            }
            clients[clientID].lastActiveTime = Date.now();
            clients[clientID].m2.stdin.write(body, function(err) {
                if (err) {
                    logClient("write failed: " + err);
                }
            });
        } catch (err) {
            logClient(clientID, err);
            // At this point, there was some problem writing to the m2 process
            // we just return.
        }
        response.writeHead(200);
        response.end();
    };

    // kill signal is sent to schroot, which results in killing M2
    var restartAction = function(request, response) {
        assureClient(request, response, function(clientID) {
            logClient(clientID, "received: /restart");
            if (!checkForEventStream(clientID, response)) {
                return;
            }
            var client = clients[clientID];
            if (client.recentlyRestarted) {
                logClient(clientID, "Ignore repeated restart request");
                response.writeHead(200);
                response.end();
                return;
            }
            client.recentlyRestarted = true;
            setTimeout(function() {
                client.recentlyRestarted = false;
            }, 1000);
            if (client.m2) {
                client.m2.kill();
                runShellCommand("killall -u " + clients[clientID].systemUserName, function(ret) {
                    console.log("We removed processes associates to " +
                        clientID + " with result: " + ret);
                });
                logClient(clientID,
                    "In restartAction, killed child process with PID " + client
                    .m2.pid);
            }
            client.m2 = m2Start(clientID);
            m2ConnectStream(clientID);
            response.writeHead(200);
            response.end();
        });
    };

    // SCHROOT: when using child.kill('SIGINT'), the signal is sent to schroot,
    // where it is useless, instead, find actual PID of M2. 
    var interruptAction = function(request, response) {
        assureClient(request, response, function(clientID) {
            logClient(clientID, "received: /interrupt");
            if (!checkForEventStream(clientID, response)) {
                return;
            };
            if (clients[clientID] && clients[clientID].recentlyRestarted) {
                logClient(clientID, "Ignore interrupt directly after restart");
                response.writeHead(200);
                response.end();
                return;
            }
            if (clients[clientID] && clients[clientID].m2) {
                var m2 = clients[clientID].m2;
                if (options.SCHROOT) {
                    /* To find the actual M2 we have to dig a little deeper:
                     The m2.pid is the PID of the cgexec command.
                     Using pgrep we gets the child process(es).
                     In this case there is only one, namely the schroot.
                     The child of the schroot then is M2 which we want to interrupt.
                  */
                    runShellCommand('n=`pgrep -P ' + m2.pid +
                        '`; n=`pgrep -P $n`; pgrep -P $n', function(m2Pid) {
                        //runShellCommand('pgrep -P `pgrep -P ' + m2.pid +'`', function(m2Pid) {
                        logClient(clientID, "PID of M2 inside schroot: " +
                            m2Pid);
                        var cmd = 'kill -s INT ' + m2Pid;
                        runShellCommand(cmd, function(res) {});
                    });
                } else {
                    m2.kill('SIGINT');
                }
            }
            response.writeHead(200);
            response.end();
        });
    };

    // returning clientID for a given M2 pid
    // This currently does not work when working inside a schroot, because pid
    // is not the schroot's pid
    var findClientID = function(pid) {
        //console.log("Searching for clientID whose M2 has PID " + pid);
        for (var prop in clients) {
            if (clients.hasOwnProperty(prop) && clients[prop] && clients[prop].m2) {
                if (pid == clients[prop].m2.pid) {
                    //console.log("We found the client! It is " + prop);
                    if (clients[prop].eventStream.length != 0) {
                        //console.log("findClientID picked user with clientID " + prop);
                        return prop;
                    } else {
                        throw ("Client " + clientID +
                            " does not have an eventstream.");
                    }
                }
            }
        }
        throw ("Did not find a client for PID " + pid);
    };

    var getClientIDFromUrl = function(url) {
        // The URL's in question look like:
        //  (schroot version): /user45345/var/a.jpg
        //  (non-schroot): /dfdff/dsdsffff/fdfdsd/M2-12345-1/a.jpg
        //     where 12345 is the pid of the M2 process.
        var clientID;
        var matchobject;
        if (options.SCHROOT) {
            // This needs to be changed. What we might get here is only
            // the username. We need to match the clientID from this.
            matchobject = url.match(/^\/(user\d+)\//);
        } else {
            matchobject = url.match(/\/M2-(\d+)-/);
        }
        if (!matchobject) {
            console.log("error, could not find clientID from url");
            throw ("could not find clientID from url");
        }
        if (options.SCHROOT) {
            clientID = matchobject[1];
        } else {
            clientID = findClientID(matchobject[1]);
        }
        return clientID;
    };

    // return path to image
    var parseUrlForPath = function(url) {
        var imagePath = url.match(/^\/(user)?\d+\/(.*)/);
        //console.log(imagePath);

        if (!imagePath) {
            throw ("Did not get imagePath in image url");
        }
        //console.log("imagePath = " + imagePath[2]);
        return imagePath[2];
    };


    // we get a /image from our open script
    // imageAction finds the matching client by parsing the url, then sends the
    // address of the image to the client's eventStream
    var imageAction = function(request, response, next) {
        var url = require('url').parse(request.url).pathname;
        response.writeHead(200);
        response.end();

        try {
            var clientID = getClientIDFromUrl(url);
            logClient(clientID, "image " + url + " received");

            client = clients[clientID];
            if (!client) {
                logClient(clientID, "image request for invalid clientID");
                return;
            }

            var path = parseUrlForPath(url); // a string
            if (options.SCHROOT) {
                path = "/usr/local/var/lib/schroot/mount/" + clients[clientID].schrootName + path
            }

            message = 'event: image\r\ndata: ' + path + "\r\n\r\n";
            if (!client.eventStream || client.eventStream.length == 0) { // fatal error, should not happen
                logClient(clientID, "Error: No event stream");
            } else {
                //logClient(clientID, "Sent image message: " + message);
                for (var stream in client.eventStream ) {
                    client.eventStream[stream].write(message);
                }
            }
        } catch (err) {
            logClient(clientID,"Received invalid /image request: " + err);
        }
    };

    var viewHelpAction = function(request, response, next) {
        var url = require('url').parse(request.url).pathname;
        response.writeHead(200);
        response.end();
        console.log("We received a viewHelp request.");
        try {
            var clientID = getClientIDFromUrl(url);
            logClient(clientID, "viewHelp " + url + " received");

            client = clients[clientID];
            if (!client) {
                logClient(clientID, "viewHelp request for invalid clientID");
                return;
            }

            var path = parseUrlForPath(url); // a string
                        
            if (options.SCHROOT) {
                // path is of the form file:///M2/share/....html
                // This will fail if we split the clientID.
                path = path.match(/^file:\/\/(.*)/)[1];
            }

            message = 'event: viewHelp\r\ndata: ' + path + "\r\n\r\n";
            if (!client.eventStream || client.eventStream.length == 0 ) { // fatal error, should not happen
                logClient(clientID, "Error: No event stream");
            } else {
                //logClient(clientID, "Sent image message: " + message);
                for (var stream in client.eventStream) {
                    client.eventStream[stream].write(message);
                }
            }
        } catch (err) {
            logClient(clientID,"Received invalid /viewHelp request: " + err);
        }
    }
    var checkForEventStream = function(clientID, response) {
        if (!clients[clientID].eventStream || clients[clientID].eventStream.length == 0 ) {
            logClient(clientID, "Send notEventSourceError back to user.");
            response.writeHead(200, {
                'notEventSourceError': 'No socket for client...'
            });
            response.end();
            return false;
        }
        return true;
    };

    var unhandled = function(request, response, next) {
        var url = require('url').parse(request.url).pathname;
        console.log("Request for something we don't serve: " + request.url);
        response.writeHead(404, "Request for something we don't serve.");
    	response.write("404");
    	response.end();
    };

    var uploadM2Package = function(request, response, next) {
        assureClient(request, response, function(clientID) {
            logClient(clientID, "received: /upload");
            var formidable = require('formidable');
            var form = new formidable.IncomingForm;
            var schrootPath;
            if (options.SCHROOT) {
                schrootPath = "/usr/local/var/lib/schroot/mount/" + clients[clientID].schrootName +
                    "/home/m2user/";
                form.uploadDir = schrootPath;
            }
            form.on('file', function(name, file) {
                if (options.SCHROOT) {
                    var newpath = schrootPath;
                } else {
                    newpath = "/tmp/";
                }
                fs.rename(file.path, newpath + file.name, function(error) {
                    if (error) {
                        logClient(clientID, "Error in renaming file: " + error);
                        response.writeHead(500, {
                            "Content-Type": "text/html"
                        });
                        response.end('rename failed: ' + error);
                        return;
                    }
                    if (options.SCHROOT){
                        runShellCommand("chown " + clients[clientID].systemUserName + ":" + clients[clientID].systemUserName + " " + newpath + file.name, function(e) {console.log("Chown: " + e);});
                    }
                });
            });
            form.on('end', function() {
                response.writeHead(200, {
                    "Content-Type": "text/html"
                });
                response.end('upload complete!');
            });
            form.on('error', function(error) {
                logClient(clientID, 'received error in upload: ' + error);
                response.writeHead(200, {
                    "Content-Type": "text/html"
                });
                response.end('Some error has occurred: ' + error);
            });

            form.parse(request);
        });
    };

    var saveAction = function(request, response) {
        assureClient(request, response, function(clientID) {
            request.setEncoding("utf8");
            logClient(clientID, "received: /save");
            // Set the directory where we will write the resulting 2 files
            var path = "/tmp/";
            if (options.SCHROOT) {
                path = "/usr/local/var/lib/schroot/mount/" 
                    + clients[clientID].schrootName + "/home/m2user/";
            };
            var body = "";

            // When we get a chunk of data, add it to the body
            request.on("data", function(chunk) {
                body += chunk;
            });

            // grab input and output windows, place them in files where we can serve them
            request.on("end", function() {
                console.log("/save, received: " + body);
                var json = JSON.parse(body);
                console.log(json.input);

                fs.writeFile(path + "Macaulay2-input", json.input);
                fs.writeFile(path + "Macaulay2-output", json.output);
                response.writeHead(200, {
                    "Content-Type": "text/html"
                });
                var msg = {input: path + "Macaulay2-input", output: path + "Macaulay2-output"};
                response.write(JSON.stringify(msg));
                response.end();
            });
        });
    };

    var app = connect()
        .use(connect.logger('dev'))
        .use(connect.favicon())
        .use(connect.static('public'))
        .use('/upload', uploadM2Package)
        .use('/var/folders', connect.static('/var/folders'))
        .use('/usr/local/var/lib/schroot/mount', connect.static('/usr/local/var/lib/schroot/mount'))
        .use('/M2', connect.static('/M2'))
        // M2 creates temporary files (like created by Graphs.m2) here on MacOS
        .use('/tmp', connect.static('/tmp'))
        // and here on Ubuntu
        .use('/admin', stats)
        .use('/viewHelp', viewHelpAction)
        .use('/image', imageAction)
        .use('/startSourceEvent', startSource)
        .use('/chat', m2InputAction)
        .use('/interrupt', interruptAction)
        .use('/restart', restartAction)
        .use('/save', saveAction)
        .use(unhandled);
    //.use(connect.errorHandler());

    var initializeServer = function() {
        // when run in production, work with schroots, see startM2Process()
        if (options.SCHROOT) {
            console.log('Running with schroots.');
            setInterval(pruneClients, options.PRUNECLIENTINTERVAL);
        }

        // Send a comment to the clients every 20 seconds so they don't 
        // close the connection and then reconnect
        setInterval(keepEventStreamsAlive, 20000);

        console.log("Starting M2 server.");
        server = http.createServer(app);
    };

    var listen = function() {
        if (server === undefined) {
            initializeServer();
        }
        console.log("M2 server listening on port " + options.port + "...");
        return server.listen(options.port);
    };
    var server;

    // Start of M2Server creation code
    for (opt in overrideOptions) {
        if (options.hasOwnProperty(opt)) {
            options[opt] = overrideOptions[opt];
            console.log("m2server option: " + opt + " set to " + options[opt]);
        }
    }
    initializeServer();

    // These are the methods available from the outside:
    return {
        server: server,
        listen: listen,
        close: function() {
            server.close();
        }
    };
}; // end of def of M2Server

//var m2server = M2Server();
//m2server.listen(8002);
exports.M2Server = M2Server;

// Local Variables:
// indent-tabs-mode: nil
// tab-width: 4
// End:
