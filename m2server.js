// March 2012, Franziska Hinkelmann, Mike Stillman, and Lars Kastner
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

//
// A message on / : possibly creates a cookie, and serves back index.html
//   and related js/css/png files
// A POST message on /chat: input should be Macaulay2 commands to perform.
// A message on /chat: start an event emitter, which will return the output of
// the M2 process.

var http = require('http');  // NodeJS HTTP server API
var Cookies = require("cookies");

// The HTML file for the chat client. Used below.
var clientui = require('fs').readFileSync("index.html");
var totalUsers = 0;

// An array of Client objects.  Each has an M2 process, and a response object
// It is possible that this.m2 is not defined, and/or that this.eventStream is not
// defined.
var clients = {};

function Client(m2process, resp) {
    this.m2 = m2process;
    this.eventStream = resp;
}

startUser = function(cookies) {
    totalUsers = totalUsers + 1;
    var clientID = Math.random()*1000000;
    clientID = Math.floor(clientID);
    clientID = "user" + clientID.toString(10);
    cookies.set( "tryM2", clientID, { httpOnly: false } );
    clients[clientID] = new Client(); 
    return clientID;
}

startM2Process = function() {
    var spawn = require('child_process').spawn;
    console.log("spawning...");
    var m2 = spawn('M2');
    m2.running = true;
    //var m2 = spawn('sudo', ['../sandbox/sandbox', '../../sandbox-dir', 'bin/M2', '-q', '-e', 'limitResources()']);
    //var m2 = spawn('../sandbox/sandbox', ['../../sandbox-dir', 'bin/M2', '-q', '-e', 'limitResources()']);
    m2.stdout.setEncoding("utf8");
    m2.stderr.setEncoding("utf8");
    console.log('Spawned m2 pid: ' + m2.pid);
    m2.on('exit', function(code, signal) {
        m2.running = false;
        console.log("M2 exited");
    });
    return m2;
};

// can only be called when client.eventStream is set
// if client.m2 is not null, kill it, then start a new process
// attach M2 output to client.eventStream
startM2 = function(client) {
    if (client.m2) { 
        client.m2.kill(); 
        console.log("In startM2(), killed M2 with PID " + client.m2.pid);
    }
    // client is an object of type Client
    client.m2 = startM2Process();
    console.log("starting sending M2 output to eventStream");
    var ondata = function(data) {
        //console.log('ondata: ' + data);
        message = 'data: ' + data.replace(/\n/g, '\ndata: ') + "\r\n\r\n";
        if (!client.eventStream) { // fatal error, should not happen
            console.log("Error: No event stream in Start M2");
            throw "Error: No client.eventStream in Start M2";
        }
        client.eventStream.write(message);           
    };
    client.m2.stdout.on('data', ondata);
    client.m2.stderr.on('data', ondata);

};

getCurrentClientID = function(cookies) {
    var clientID = cookies.get("tryM2");
    //console.log("Client has cookie value: " + clientID);

    // Start new user for users coming with invalid, i.e., old, cookie
    if (!clients[clientID]) {
        console.log("startUser");
        clientID = startUser(cookies);
    }
    return clientID;
};

var stats = function(response) {
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

loadFile = function(url, response) {
    console.log("User requested: " + url.pathname);
    // send css files requested by index.html
     if (/\.css/.test(url.pathname) ) { 
         response.writeHead(200, {'Content-Type': 'text/css'});
         var u = url.pathname.replace("/", '');
         response.write(require('fs').readFileSync(u));
         response.end();
         return;
     }
     // Send file (e.g. images and tutorial) or 404 if not found
     if ( /\.png|\.html|\.js/.test(url.pathname) ) {
         var filename = __dirname + url.pathname;
         //console.log( filename );
         //var path = require('path');
         var path = require('path');
         filename = path.normalize( filename );
         console.log("User requested: " + filename);
         try {
             data = require('fs').readFileSync(filename);
             response.writeHead(200, {"Content-Type": "text/html"});
             response.write(data);
         }
         catch (err) {
             console.error("There was an error opening the file:");
             console.log(err);
             response.writeHead(404,{"Content-Type": "text/html"});
             response.write( '<h3>Page not found. Return to <a href="/">TryM2</a></h3>');
         }
         response.end();
         return;
     }
}

// Client starts eventStream to obtain M2 output and start M2
startSource = function(clientID, request, response) {
    response.writeHead(200, {'Content-Type': "text/event-stream" });
    if (!clients[clientID].eventStream) {
        clients[clientID].eventStream = response;
        startM2(clients[clientID]);
    }

    // If the client closes the connection, remove client from the list of active clients
    request.connection.on("end", function() {
        console.log("close connection: clients[" + clientID + "]");
        if( clients[clientID] && clients[clientID].m2) {
            clients[clientID].m2.kill();
            clients[clientID].m2 = null;
        }
        delete clients[clientID];
        response.end();
    });
};

// server reacts to these requests
var actions = [];
actions['/chat'] = false;
actions['/restart'] = false;
actions['/interrupt'] = false;
actions['/'] = false;
actions['/startSourceEvent'] = startSource;
actions['/admin'] = false;

// Create a new server
var server = new http.Server();  
// When the server gets a new request, run this function
server.on("request", function (request, response) {
    //console.log( "got on");
    // Parse the requested URL
    var url = require('url').parse(request.url);
    
    if (url.pathname === "/admin") {
        stats(response);
        return;
    }
    
    // If the request was for "/", send index.html
    if (url.pathname === "/") {  
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(clientui);
        response.end();
        return;
    }
 
    if (actions[url.pathname] == undefined ) {
        loadFile (url, response);
        return;
    }
    
    var cookies = new Cookies(request, response);
    var clientID = getCurrentClientID(cookies);
        
    
    if(actions[url.pathname]) {
        actions[url.pathname](clientID, request, response);
        return;
    }


    // at this point, we are expecting /chat, /request, or /interrupt
    // for any connection, we want to be able to respond to the client
    // set client.eventStream, i.e., start eventSourceStream, if it has not been established yet
    if (!clients[clientID].eventStream ) {
         console.log("Send notEventSourceError back to user.");
         // send error back to user, user needs to start eventStream and resend 'body'
         response.writeHead(200, {
           'notEventSourceError': 'No socket for client...' });
         response.end();
         return;
    }
    // user is sending M2 input
    if (url.pathname === "/chat" ) {
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
                //console.log("Send M2 input: " + body);
                clients[clientID].m2.stdin.write(body);
            }
            catch (err) {
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
        return;
    }
    if (url.pathname === "/restart") {
        var clientID = getCurrentClientID(cookies);
        console.log("received: /restart from " + clientID);
        startM2(clients[clientID]);
        response.writeHead(200);  
        response.end();
        return;
    }
    if (url.pathname === "/interrupt") {
        var clientID = getCurrentClientID(cookies);
        if (clients[clientID] && clients[clientID].m2) {
            clients[clientID].m2.kill('SIGINT');
        }
        console.log("received: /interrupt from " + clientID);
        response.writeHead(200);  
        response.end();
        return;
    }    
});

// Run the server on port 8000. Connect to http://localhost:8000/ to use it.
console.log("Listening on port 8000...");
server.listen(8000);
