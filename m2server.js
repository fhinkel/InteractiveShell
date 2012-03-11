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

// An array of Client objects.  Each has an M2 process, and a response object
// It is possible that this.m2 is not defined, and/or that this.response is not
// defined.
var clients = {};
var nextClientId = 0;

function Client(m2process, resp) {
    this.m2 = m2process;
    this.response = resp;
}

startM2Process = function() {
    var spawn = require('child_process').spawn;
    var m2 = spawn('M2');
    m2.stdout.setEncoding("utf8");
    m2.stderr.setEncoding("utf8");
    console.log('Spawned m2 pid: ' + m2.pid);
    return m2;
};

startM2 = function(client) {
    // client is an object of type Client
    client.m2 = startM2Process();
    console.log("starting emitter");
    var ondata = function(data) {
        console.log('ondata: ' + data);
        message = 'data: ' + data.replace(/\n/g, '\ndata: ') + "\r\n\r\n";
        client.response.write(message);           
    };
    client.m2.stdout.on('data', ondata);
    client.m2.stderr.on('data', ondata);
};

restartM2 = function(client) {
    if (client.m2) { client.m2.kill(); }
    startM2(client);
}

// Send a comment to the clients every 20 seconds so they don't 
// close the connection and then reconnect
setInterval(function() {
    for (var prop in clients) {
        if (clients.hasOwnProperty(prop) 
            && clients[prop]
            && clients[prop].response) {
            clients[prop].response.write(":ping\n");
        }
    }
}, 20000);

startUser = function(cookies) {
    var clientID = nextClientId.toString(10);
    cookies.set( "trym2cookie", clientID, { httpOnly: false } );
    clients[clientID] = new Client(); // will be populated with a Client in /chat
    nextClientId = nextClientId + 1;
    return clientID;
}

// Create a new server
var server = new http.Server();  

// When the server gets a new request, run this function
server.on("request", function (request, response) {
    console.log( "got on");
    // Parse the requested URL
    var cookies = new Cookies(request, response);
    var url = require('url').parse(request.url);
    
    // If the request was for "/", send the client-side chat UI.
    if (url.pathname === "/" || url.pathname === "/index.html") {  // A request for the chat UI
        startUser(cookies);
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(clientui);
        response.end();
        return;
    }
    if (/\.css/.test(url.pathname) ) {
        response.writeHead(200, {'Content-Type': 'text/css'});
        var u = url.pathname.replace("/", '');
        response.write(require('fs').readFileSync(u));
        response.end();
        return;
    }
    if (url.pathname === "/chat") {
        // If the request was a post, then a client is posting a new message
        var clientID = cookies.get("trym2cookie");
        console.log("cookie value from client: " + clientID);
        
        if (!clients[clientID]) {
            // somehow the user sent M2 commands without sending "/" first
            console.log("startUser");
            clientID = startUser(cookies);
        }
        if (request.method === "POST") {
            console.log( " got post");
            request.setEncoding("utf8");
            
            //   for (e in request.headers) {
            //       console.log(e+": "+request.headers[e]);
            //   }

            var body = "";
            // When we get a chunk of data, add it to the body
            request.on("data", function(chunk) { body += chunk; });

            request.on("end", function() {                
                // Send 'body' to M2
                try {
                    console.log("Send M2 output: " + body);
                    clients[clientID].m2.stdin.write(body);
                }
                catch (err) {
                    console.log("socket was closed for clients[" + clientID + "]");
                    // send error back to user so user restart eventSource
                    response.writeHead(200, {
                      'notEventSourceError': 'No socket for client...' });
                    response.end();
                    return;
                }
                response.writeHead(200);   // Respond to the request
                response.end();
            });
            return;
        } else {
            console.log( " got get");
            
            response.writeHead(200, {'Content-Type': "text/event-stream" });
            if (!clients[clientID].response) {
                clients[clientID].response = response;
                startM2(clients[clientID]);
            }

            // If the client closes the connection, remove the corresponding
            // response object from the array of active clients
            request.connection.on("end", function() {
                console.log("close connection: clients[" + clientID + "]");
                clients[clientID].m2.kill();
                clients[clientID].m2 = null;
                clients[clientID].response = null;
                response.end();
            });

            return;
        }
    }
    if (url.pathname === "/restart") {
        var clientID = cookies.get("trym2cookie");
        restartM2(clients[clientID]);
        console.log("received: /restart from " + clientID);
        return;
    }
    if (url.pathname === "/interrupt") {
        var clientID = cookies.get("trym2cookie");
        if (clients[clientID] && clients[clientID].m2) {
            clients[clientID].m2.kill('SIGINT');
        }
        console.log("received: /interrupt from " + clientID);
        return;
    }    
    // Send file (e.g. images and tutorial) or 404 if not found
    if (url.pathname !== "/chat") {
        
        var u = url.pathname.replace("/", '');
        try {
            data = require('fs').readFileSync(u);
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
});

// Run the server on port 8000. Connect to http://localhost:8000/ to use it.
console.log("Listening on port 8000...");
server.listen(8000);