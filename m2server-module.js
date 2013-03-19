// September 2012, Franziska Hinkelmann, Mike Stillman, and Lars Kastner
//
// This is server-side JavaScript, intended to be run with Node.js.
// This file defines a Node.js server for serving 'tryM2'.
//   run 
//      node m2server.js --schroot
// in a terminal in this directory.
// Then in a browser, use: 
//      http://localhost:8002/
// Required Node.js libraries: cookies.  Install via:
//   npm install cookies, or sudo npm install -g cookies
// Required on path: M2
// We are using our own open script to make Graphs.m2 work (generate jpegs for users), please include the current directory in your path: 
// export PATH=.:$PATH

// intended to run on (s)chrooted environment, where every user starts M2 in a separate schroot. 
//
// A message on / : possibly creates a cookie, and serves back index.html
//   and related js/css/png files
// A POST message on /chat: input should be Macaulay2 commands to perform.
// A message on /chat: start an event emitter, which will return the output of
// the M2 process.
// /image is being called by the open script to tell the server where to find a jpg that the user created
//
// Using Node connect, but not express

var http = require('http')
    , fs = require('fs')
    , connect = require('connect')
    , Cookies = require('cookies');

var M2Server = {
    port: 8002, // default port number to use
    userMemoryLimit: 500000000, // Corresponds to 500M memory
    userCpuLimit: 256, // Corresponds to 256 shares of the CPU.
                       // As stated wrongly on the internet this does NOT correspond to 25% CPU.
                       // The total number of shares is determined as the sum of all these limits,
                       // i.e. if there is only one user, he gets 100% CPU.
    PRUNECLIENTINTERVAL: 1000*60*10, // 10 minutes
    MAXAGE: 1000*60*60*24*7, // 1 week
    SCHROOT: false, // if true: start with --schroot on server

    totalUsers: 0, //only used for stats: total # users since server started

    // An array of Client objects.  Each has an M2 process, and a response object
    // It is possible that this.m2 is not defined, and/or that this.eventStream is not
    // defined.
    clients: {}
};

// preamble every log with the client ID
M2Server.logClient = function(clientID, str) {
  console.log(clientID + ": " + str);
};
    
// delete a user both from the system and the clients[]
M2Server.deleteClient = function(clientID) {
    runShellCommand( 'perl-scripts/remove_user.pl ' + clientID, function(ret) {
        console.log("We removed client " + clientID + " with result: " + ret );
    } );
    delete clients[clientID];
};

// deciding that a user is obsolete: 
// set clients[clientID].timestamp (set by M2 output or the client's input)
// in set time intervals, iterate over clients and if timestamp is too old or using too high resources, delete the client
M2Server.pruneClients = function() {
    // run this when using schroot.
    // this loops through all clients, and checks their timestamp, also, it checks their resource usage with a perl script. Remove old or bad clients
    console.log("Pruning clients...");
    var clientID = null;
    var now = Date.now();
    console.log("It is currently " + now + " milliseconds.");
    var minAge = now - MAXAGE;
    for (clientID in clients) {
        if (clients.hasOwnProperty(clientID)) {
            console.log("*** lastActivetime for user : " + clientID + " " + clients[clientID].lastActiveTime )
            if (clients[clientID].lastActiveTime < minAge) {
               deleteClient(clientID); 
            } else {
                 runShellCommand('perl-scripts/status_user.pl ' + clientID, function(ret) {
                     //console.log ("Return value from status_user.pl: .." + ret +"..");
                     if (ret != '0') {
                         console.log( "removing user because of status_user.pl");
                         deleteClient(clientID); 
                     }
                 }) 
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

M2Server.runShellCommand = function(cmd, callbackFcn) {
    // runs a command, and calls the callbackFnc with the output from stdout
    
    require('child_process').exec( cmd, function(error, stdout, stderr) {
        //console.log("runShellCommand result:" + stdout);
        callbackFcn(stdout);
    }); 
};

M2Server.Client = function(m2process, resp) {
    this.m2 = m2process;
    this.eventStream = resp;
    this.clientID = null; // generated randomly in startUser(), used for cookie and as user name on the system
    this.recentlyRestarted = false; // we use this to keep from handling a bullet stream of restarts
    this.lastActiveTime = Date.now(); // milliseconds when client was last active
    console.log ("function Client()");
};

M2Server.startUser = function(cookies, request, callbackFcn) {
    totalUsers = totalUsers + 1;
    var clientID = Math.random()*1000000;
    clientID = Math.floor(clientID);
    // TODO check that this ID is not already in use
    clientID = "user" + clientID.toString(10);
    cookies.set( "tryM2", clientID, { httpOnly: false } );
    clients[clientID] = new Client(); 
    clients[clientID].clientID = clientID;
    logClient(clientID, "New user: " + " UserAgent=" + request.headers['user-agent'] + ".");
    if (SCHROOT) {
        runShellCommand('perl-scripts/create_user.pl ' + clientID + ' ' + userMemoryLimit + ' ' + userCpuLimit, function(ret) {
            //console.log( "***" + ret );
            logClient(clientID, "Spawning new schroot process named " + clientID + ".");
            // If we create a user and an own config file for this user the command needs to look like
            // require('child_process').exec('sudo -u ' + newUser + ' schroot -c name_at_top_of_config -n '+ clientID + ' -b', function() {
            require('child_process').exec('sudo -u ' + clientID + ' schroot -c ' + clientID + ' -n '+ clientID + ' -b', function() {
                var filename = "/var/lib/schroot/mount/" + clientID + "/rootstuff/sName.txt";
                // create a file inside schroot directory to allow schroot to know its own name needed for open-schroot when sending /image
                fs.writeFile(filename, clientID, function(err) {
                    if(err) {
                        logClient(clientID, "failing to write the file " + filename);
                        logClient(clientID, err);
                    } else {
                        logClient(clientID, "wrote schroot's name into " + filename);
                        fs.exists(filename, function(error) {
                            logClient(clientID, "exists?: " + error);
                            });
                        fs.chmod(filename, 0444, function(error) {
                            logClient(clientID, "chmod: " + error);
                        });
                        callbackFcn(clientID);
                    }
                });
            });
        });
    } else {
        callbackFcn(clientID);
    }
    return clientID;
};

M2Server.m2Start = function(clientID) {
    var spawn = require('child_process').spawn;
    if (SCHROOT) {
    	var m2 = spawn( 'sudo',
      [ 'cgexec', '-g', 'cpu,memory:'+clientID, 'sudo', '-u', clientID, 'schroot', '-c', clientID, '-u', clientID, '-d', '/home/m2user/', '-r', '/M2/bin/M2']);
        
           // ['-c', clientID, '-u', 'm2user', '-d', '/home/m2user/', '-r', '/bin/bash', '/M2/limitedM2.sh']);
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

M2Server.m2ConnectStream = function(clientID) {
     var client = clients[clientID];
     if (!client) return;
     
 
     var ondata = function(data) {
         client.lastActiveTime = Date.now(); 
         var data1 = data.replace(/\n$/, "");
         logClient(clientID, "data: " + data1.replace(/\n+/g, "\n" + clientID + ": data: "));
         message = 'data: ' + data.replace(/\n/g, '\ndata: ') + "\r\n\r\n";
         if (!client.eventStream) { // fatal error, should not happen
             logClient(clientID, "Error: No event stream in m2ConnectStream");
             return;
             //throw "Error: No client.eventStream in Start M2";
         }
         client.eventStream.write(message);           
     };
     if (client.m2) {
         client.m2.stdout.removeAllListeners('data');
         client.m2.stderr.removeAllListeners('data');
         client.m2.stdout.on('data', ondata);
         client.m2.stderr.on('data', ondata);
     }
};

M2Server.assureClient = function(request, response, callbackFcn) {
    var cookies = new Cookies(request, response);
    var clientID = cookies.get("tryM2");
    //console.log("Client has cookie value: " + clientID);

    // Start new user for users coming with invalid, i.e., old, cookie
    if (!clients[clientID]) {
        clientID = startUser(cookies, request,  callbackFcn);
    } else {
	    callbackFcn(clientID);
    }
};

M2Server.stats = function(request, response, next) {
    // to do: authorization
     response.writeHead(200, {"Content-Type": "text/html"});
     var currentUsers = 0;
     for( var c in clients) {
         if(clients.hasOwnProperty(c))
            currentUsers = currentUsers + 1;
     }
     response.write('<head><link rel="stylesheet" href="m2.css" type="text/css" media="screen"></head>' );
     response.write('<h1>Macaulay2 User Statistics</h1>');
     response.write("There are currently " + currentUsers + " users using M2.<br>" );
     response.write("In total, there were " + totalUsers + " users since the server started.<br>");
     response.write("Enjoy M2!");
     response.end();    
};

M2Server.keepEventStreamsAlive = function() {
    for (var prop in clients) {
        if (clients.hasOwnProperty(prop) 
            && clients[prop]
            && clients[prop].eventStream) {
            clients[prop].eventStream.write(":ping\n");
        }
    }
};

// Client starts eventStream to obtain M2 output and start M2
M2Server.startSource = function( request, response) {
    assureClient(request, response, function (clientID) {
    	response.writeHead(200, {'Content-Type': "text/event-stream" });
    	if (!clients[clientID].eventStream) {
            clients[clientID].eventStream = response;
            if (!clients[clientID].m2) {
                clients[clientID].m2 = m2Start(clientID);
            }
            m2ConnectStream(clientID);
    	}
    	// If the client closes the connection, remove client from the list of active clients
    	request.connection.on("end", function() {
                logClient(clientID, "event stream closed");
                if (clients[clientID]) {
                    clients[clientID].eventStream = null;
                }
                response.end();
    	});
    });
};

M2Server.m2InputAction = function( request, response) {
    assureClient(request, response, function (clientID) {
    	if (!checkForEventStream(clientID, response)) {
            return;
        };
    	request.setEncoding("utf8");
    	var body = "";
    	// When we get a chunk of data, add it to the body
    	request.on("data", function(chunk) { body += chunk; });
        
    	// Send input to M2 when we have received the complete body
    	request.on("end", function() { 
    	    m2ProcessInput(clientID, body, response);
    	});
    });
};

M2Server.m2ProcessInput = function( clientID, body, response ) {
    try {
	    logClient(clientID, "M2 input: " + body);
        if (!clients[clientID] || !clients[clientID].m2 || !clients[clientID].m2.stdin.writable) {
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
    }
    catch (err) {
        logClient(clientID, err);
        // At this point, there was some problem writing to the m2 process
        // we just return.
    }
    response.writeHead(200);  
    response.end();
};

// kill signal is sent to schroot, which results in killing M2
M2Server.restartAction = function(request, response) {
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
            logClient(clientID, "In restartAction, killed child process with PID " + client.m2.pid);
        }
        client.m2 = m2Start(clientID);
        m2ConnectStream(clientID);
        response.writeHead(200);  
        response.end();
    });
};

// SCHROOT: when using child.kill('SIGINT'), the signal is sent to schroot, where it is useless, instead, find actual PID of M2. 
M2Server.interruptAction = function(request, response)  {
    assureClient(request, response, function (clientID) {
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
            if (SCHROOT) {
    	        runShellCommand('pgrep -P ' + m2.pid, function(m2Pid) {
                        logClient(clientID, "PID of M2 inside schroot: " + m2Pid);
                        var cmd = 'kill -s INT ' + m2Pid;
                        runShellCommand(cmd, function(res) {
    			    });
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
// This currently does not work when working inside a schroot, because pid is not the schroot's pid
M2Server.findClientID = function(pid){
    //console.log("Searching for clientID whose M2 has PID " + pid);
    for (var prop in clients) {
        if (clients.hasOwnProperty(prop) && clients[prop] && clients[prop].m2) {
            if (pid == clients[prop].m2.pid) {
                //console.log("We found the client! It is " + prop);
                if (clients[prop].eventStream) {
                    //console.log("findClientID picked user with clientID " + prop);
                    return prop;
                } else {
                    throw ("Client " + clientID + " does not have an eventstream.");
                }
            }
        }
    }
    throw ("Did not find a client for PID " + pid);
};

// return PID extracted from pathname for image displaying
M2Server.parseUrlForPid = function(url) {
    //console.log(url);
    if (SCHROOT) {
        var pid = url.match(/^\/(user\d+)\//);
    } else {
        pid = url.match(/\/M2-(\d+)-/);
    }
    //console.log( pid );
    if (!pid) {
        console.log("error, didn't get PID in image url");
        throw ("Did not get PID in image url");
    }
    //console.log("PID = " + pid[1]);
    return pid[1];
};

// return path to image
M2Server.parseUrlForPath = function(url) {
    var imagePath = url.match(/^\/(user)?\d+\/(.*)/);
    //console.log(imagePath);
    
    if (!imagePath) {
        throw("Did not get imagePath in image url");
    }
    //console.log("imagePath = " + imagePath[2]);
    return imagePath[2];
};

// we get a /image from our open script
// imageAction finds the matching client by parsing the url, then sends the address of the image to the client's eventStream
M2Server.imageAction = function(request, response, next) {
    var url = require('url').parse(request.url).pathname;
    response.writeHead(200);  
    response.end();
    
    try {
        var pid = parseUrlForPid(url);
        var path = parseUrlForPath(url); // a string
        if (SCHROOT) {
            var clientID = pid;
        } else {
            clientID = findClientID(pid);
        }
        logClient(clientID, "image " + url + " received");
        
        client = clients[clientID];
          if (!client) {
              logClient(clientID, "oops, no client");
              return;
          }
          
          if (SCHROOT) {
              path = "/var/lib/schroot/mount/" + clientID + path
          }

          message = 'event: image\r\ndata: ' + path + "\r\n\r\n";
          if (!client.eventStream) { // fatal error, should not happen
              logClient(clientID, "Error: No event stream");
          }
          else {
              //logClient(clientID, "Sent image message: " + message);
              client.eventStream.write(message);           
          }
    }
    catch (err) {
        console.log("Received invalid /image request: " + err);
    }
};

M2Server.checkForEventStream = function(clientID, response) {
    if (!clients[clientID].eventStream ) {
        logClient(clientID, "Send notEventSourceError back to user.");
        response.writeHead(200, {'notEventSourceError': 'No socket for client...' });
        response.end();
        return false;
   }
   return true;
};

M2Server.unhandled = function(request, response, next) {
    var url = require('url').parse(request.url).pathname;
    if (url == '/chat' || url == 'interrupt' || url == '/restart') {
        next();
        return;
    }
    console.log("Request for something we don't serve: " + request.url);
};

M2Server.uploadM2Package = function(request, response, next) {
    assureClient(request, response, function(clientID) {
        logClient(clientID, "received: /upload");
        var formidable = require('./node-formidable');
        var form = new formidable.IncomingForm;
        if (SCHROOT) {
            var schrootPath = "/var/lib/schroot/mount/" + clientID + "/home/m2user/"; 
            form.uploadDir = schrootPath;
        }
        form.on('file', function(name, file) {
                if (SCHROOT) {
                    var newpath = schrootPath;
                } else {
                    newpath = "/tmp/";
                }
                fs.rename(file.path, newpath+file.name,function(error) {
                        if (error) {
                            logClient(clientID, "Error in renaming file: " + error);
                            response.writeHead(500, {"Content-Type": "text/html"});
                            response.end('rename failed: ' + error);
                            return;
                        }
                    });
        });
        form.on('end', function() {
                response.writeHead(200, {"Content-Type": "text/html"});
                response.end('upload complete!');
            });
        form.on('error', function(error) {
                logClient(clientID, 'received error in upload: ' + error);
                response.writeHead(200, {"Content-Type": "text/html"});
                response.end('Some error has occurred: ' + error);
            });
        
        form.parse(request);
        });
};

M2Server.app = connect()
    .use(connect.logger('dev'))
    .use(connect.favicon())
    .use(connect.static('public'))
    .use('/upload', M2Server.uploadM2Package)
    .use('/var', connect.static('/var')) // M2 creates temporary files (like created by Graphs.m2) here on MacOS
    .use('/tmp', connect.static('/tmp')) // and here on Ubuntu
    .use('/admin', M2Server.stats)
    .use('/image', M2Server.imageAction)
    .use('/startSourceEvent', M2Server.startSource)
    .use('/chat', M2Server.m2InputAction)
    .use('/interrupt', M2Server.interruptAction)
    .use('/restart', M2Server.restartAction)
    .use(M2Server.unhandled)
    ;
    //.use(connect.errorHandler());

M2Server.makeServer = function() {
    // when run in production, work with schroots, see startM2Process()
    if( process.argv[2] && process.argv[2]=='--schroot') {
        console.log('Running with schroots.');
        SCHROOT=true;
    };

    if (SCHROOT) {
        setInterval(pruneClients, PRUNECLIENTINTERVAL); 
    }

    // Send a comment to the clients every 20 seconds so they don't 
    // close the connection and then reconnect
    setInterval(M2Server.keepEventStreamsAlive, 20000);
    
    return M2Server;
};

M2Server.listen = function(port) {
    if (port !== undefined) {
        M2server.port = port;
    }
    console.log("Starting server.  Listening on port " + M2Server.port + "...");
    http.createServer(M2Server.app).listen(M2Server.port);
};

M2Server.listen();

// Local Variables:
// indent-tabs-mode: nil
// tab-width: 4
// End:
