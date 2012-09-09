// September 2012, Franziska Hinkelmann, Mike Stillman, and Lars Kastner
//
// This is server-side JavaScript, intended to be run with Node.js.
// This file defines a Node.js server for serving 'tryM2'.
//   run 
//      node m2server.js
// in a terminal in this directory.
// Then in a browser, use: 
//      http://localhost:8000/
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

var port = 8002; 
var sandboxDir = "/";

var http = require('http') 
    , connect = require('connect')
    , Cookies = require('cookies');
    
var SCHROOT = false; // start with --schroot on server
    


// The HTML file for the chat client. Used below.
//var clientui = require('fs').readFileSync("index.html");
var totalUsers = 0;

// An array of Client objects.  Each has an M2 process, and a response object
// It is possible that this.m2 is not defined, and/or that this.eventStream is not
// defined.
var clients = {};

function Client(m2process, resp) {
    this.m2 = m2process;
    this.eventStream = resp;
    this.clientID = null;
}

startUser = function(cookies) {
    totalUsers = totalUsers + 1;
    var clientID = Math.random()*1000000;
    clientID = Math.floor(clientID);
    clientID = "user" + clientID.toString(10);
    cookies.set( "tryM2", clientID, { httpOnly: false } );
    clients[clientID] = new Client(); 
    clients[clientID].clientID = clientID;
    return clientID;
}



       
startChildProcess = function(clientID) {
    var spawn = require('child_process').spawn;
    if (SCHROOT) {
        var sName = clientID; // name of schroot
        console.log("Spawning new schroot process named " + sName + ".");
        var tasks = [
            function(sName) {
                spawn('schroot', ['-c', 'clone', '-n', sName, '-b'], function() {
                    next(sName);
                });
            },
            function(sName) {
                var filename = "/var/lib/schroot/mount/" + sName + "/home/franzi/sName.txt";
                 // TODO copy some files
                // create a file inside schroot directory to allow schroot know its own name
                require('fs').writeFileSync(filename, sName, function(err) {
                    if(err) {
                        console.log("failing to write the file " + filename);
                        console.log(err);
                    } else {
                        console.log("wrote schroot's name into " + filename);
                    }
                });
                next(sName);
            },
            function(sName) {
                var m2 = spawn('schroot', ['-c', sName, '-u', 'franzi', '-d', '/home/franzi/', '-r', '/M2/bin/M2']);
                initializeRunningM2(m2, clientID);
                next(sName);
            }
        ];
        
        function next (sName) {
            var currentTask = tasks.shift();
            if (currentTask) {
                currentTask(sName);
            }
        }
        next(sName);
    } else {
        console.log("Spawning new M2 process...");
        m2 = spawn('M2');
        initializeRunningM2(m2, clientID);
    }
}

initializeRunningM2 = function(m2, clientID) {
     m2.running = true;
     m2.stdout.setEncoding("utf8");
     m2.stderr.setEncoding("utf8");
     console.log('Spawned m2 pid: ' + m2.pid);
     m2.on('exit', function(code, signal) {
         m2.running = false;
         console.log("M2 exited");
     });
     clients[cliendID].m2 = m2;
}


// can only be called when client.eventStream is set
// if client.m2 is not null, kill it, then start a new process
// attach M2 output to client.eventStream
startM2 = function(client) {
    if (!client.m2) { 
        startChildProcess(client.clientID);   
    }
    // client is an object of type Client

    console.log("starting sending M2 output to eventStream");
    var ondata = function(data) {
        console.log('ondata: ' + data);
        message = 'data: ' + data.replace(/\n/g, '\ndata: ') + "\r\n\r\n";
        if (!client.eventStream) { // fatal error, should not happen
            console.log("Error: No event stream in Start M2");
            throw "Error: No client.eventStream in Start M2";
        }
        client.eventStream.write(message);           
    };
    client.m2.stdout.removeAllListeners('data');
    client.m2.stderr.removeAllListeners('data');
    client.m2.stdout.on('data', ondata);
    client.m2.stderr.on('data', ondata);

};

getCurrentClientID = function(request, response) {
    var cookies = new Cookies(request, response);
    var clientID = cookies.get("tryM2");
    //console.log("Client has cookie value: " + clientID);

    // Start new user for users coming with invalid, i.e., old, cookie
    if (!clients[clientID]) {
        console.log("startUser");
        clientID = startUser(cookies);
    }
    return clientID;
};

var stats = function(request, response, next) {
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
}

// Send a comment to the clients every 20 seconds so they don't 
// close the connection and then reconnect
setInterval(function() {
    for (var prop in clients) {
        if (clients.hasOwnProperty(prop) 
            && clients[prop]
            && clients[prop].eventStream) {
            clients[prop].eventStream.write(":ping\n");
        }
    }
}, 20000);



// Client starts eventStream to obtain M2 output and start M2
startSource = function( request, response) {
    var clientID = getCurrentClientID(request, response);
    response.writeHead(200, {'Content-Type': "text/event-stream" });
    if (!clients[clientID].eventStream) {
        clients[clientID].eventStream = response;
        startM2(clients[clientID]);
    }

    // If the client closes the connection, remove client from the list of active clients
    request.connection.on("end", function() {
        console.log("close connection: clients[" + clientID + "]");
        clients[clientID].eventStream = null;
        response.end();
    });
};

chatAction = function( request, response) {
    var clientID = getCurrentClientID(request, response);
    if (!checkForEventStream(clientID, response)) {return false};
    request.setEncoding("utf8");
    var body = "";
    // When we get a chunk of data, add it to the body
    request.on("data", function(chunk) { body += chunk; });
            
    // Send input to M2 when we have received the complete body
    request.on("end", function() { 
        if(!clients[clientID].m2) {
            console.log("No M2 object for client " + clientID + ", starting M2.");
            startM2(clients[clientID]);                    
        }
        if (!clients[clientID].m2.running) {
            console.log("No running M2 for client " + clientID + ", waiting for user to send /restart.");
            response.writeHead(200);  
            response.end();
            return;
        }               
        try {
            console.log("M2 input: " + body);
            clients[clientID].m2.stdin.write(body);
        }
        catch (err) {
            console.log("Internal error: nothing to write to?!");
            throw ("Internal error: nothing to write to?!");
            // send error back to user, user needs to start eventStream and resend 'body'
            //response.writeHead(200, {
            //  'notEventSourceError': 'No socket for client...' });
            //response.end();
            return;
        }
        response.writeHead(200);  
        response.end();
    });
};

restartAction = function(request, response) {
    var clientID = getCurrentClientID(request, response);
    if (!checkForEventStream(clientID, response)) {return false};
    var client = clients[clientID];
    console.log("received: /restart from " + clientID);
    if (client.m2) { 
        client.m2.kill(); 
        console.log("In restartAction, killed child process with PID " + client.m2.pid);
        if (SCHROOT) {
            spawn('schroot', ['-c', sName, '-e']); // this unmounts the schroot
        }         
        client.m2 = null;
    }
    startM2(client);
    response.writeHead(200);  
    response.end();
};


interruptAction = function(request, response)  {
    var clientID = getCurrentClientID(request, response);
    if (!checkForEventStream(clientID, response)) {return false};
    console.log("received: /interrupt from " + clientID);
    if (clients[clientID] && clients[clientID].m2) {
        clients[clientID].m2.kill('SIGINT');
    }
    response.writeHead(200);  
    response.end();
};

// returning clientID for a given M2 pid
findClientID = function(pid){
    console.log("Searching for clientID whose M2 has PID " + pid);
    for (var prop in clients) {
        if (clients.hasOwnProperty(prop) && clients[prop] && clients[prop].m2) {
            if (pid == clients[prop].m2.pid) {
                console.log("We found the client! It is " + prop);
                if (clients[prop].eventStream) {
                    console.log("findClientID picked user with clientID " + prop);
                    return prop;
                } else {
                    throw ("Client " + clientID + " does not have an eventstream.");
                }
            }
        }
    }
    throw ("Did not find a client for PID " + pid);
}

// return PID extracted from pathname for image displaying
parseUrlForPid = function(url) {
    console.log(url);
    if (SCHROOT) {
        var pid = url.match(/^\/(\d+)\//);
    } else {
        pid = url.match(/\/M2-(\d+)-/);
    }
    //console.log( pid );
    if (!pid) {
        console.log("error, didn't get PID in image url");
        throw ("Did not get PID in image url");
    }
    console.log("PID = " + pid[1]);
    return parseInt(pid[1],10);
}

// return path to image
parseUrlForPath = function(url) {
    var imagePath = url.match(/^\/\d+\/(.*)/);
    console.log(imagePath);
    if (!imagePath) {
        throw("Did not get imagePath in image url");
    }
    console.log("imagePath = " + imagePath[1]);
    return imagePath[1];
}

// we get a /image from our open script
// imageAction finds the matching client by parsing the url, then sends the address of the image to the client's eventStream
imageAction = function(request, response, next) {
    var url = require('url').parse(request.url).pathname;
    response.writeHead(200);  
    response.end();
    
    try {
        var pid = parseUrlForPid(url);
        var path = parseUrlForPath(url); // a string
        var clientID = findClientID(pid);
        
        client = clients[clientID];
          if (!client) {
              console.log("oops, no client");
              return;
          }
          console.log('we got a request for an image: ' + path + ", for clientID " + clientID);
          // parse request for PID and path to image

          message = 'event: image\r\ndata: ' + path + "\r\n\r\n";
          if (!client.eventStream) { // fatal error, should not happen
              console.log("Error: No event stream in Start M2");
          }
          else {
              console.log("Sent image message: " + message);
              client.eventStream.write(message);           
          }
    }
    catch (err) {
        console.log("Received invalid /image request: " + err);
    }
  
};

function checkForEventStream(clientID, response) {
    if (!clients[clientID].eventStream ) {
      console.log("Send notEventSourceError back to user.");
      response.writeHead(200, {'notEventSourceError': 'No socket for client...' });
      response.end();
      return false;
   }
   return true;
}

function unhandled(request, response, next) {
    var url = require('url').parse(request.url).pathname;
    if (url == '/chat' || url == 'interrupt' || url == '/restart') {
        next();
        return;
    }
    console.log("User requested something we don't serve");
    console.log(request.url);
}

// when run in production, work with schroots, see startM2Process()
if( process.argv[2] && process.argv[2]=='--schroot') {
    console.log('Running with schroots.');
    SCHROOT=true;
}


var app = connect()
    .use(connect.logger('dev'))
    .use(connect.favicon())
    .use(connect.static('public'))
    .use('/var', connect.static('/var')) // M2 creates temporary files (like created by Graphs.m2) here on MacOS
    .use('/tmp', connect.static('/tmp')) // and here on Ubuntu
    .use('/admin', stats)
    .use('/image', imageAction)
    .use('/startSourceEvent', startSource)
    .use('/chat', chatAction)
    .use('/interrupt', interruptAction)
    .use('/restart', restartAction)
    .use(unhandled)
    ;
    //.use(connect.errorHandler());
console.log("Listening on port " + port + "...");
http.createServer(app).listen(port);




