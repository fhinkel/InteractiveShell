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
var port = 8002; 
var sandboxDir = "/";

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
    console.log("spawning new M2 process...");
    var m2 = spawn('M2');
    //var m2 = spawn('sudo', ['../sandbox/sandbox', '../../sandbox-dir', 'bin/M2', '-q', '-e', 'limitResources()']);
    //var m2 = spawn('../sandbox/sandbox', ['../../sandbox-dir', 'bin/M2', '-q', '--read-only-files', '-e', 'limitProcesses 0; limitFiles 25']);
    // sudo env -i ./sandbox sandbox-dir /bin/M2 -q --read-only-files -e 'limitProcesses 0; limitFiles 25'
    m2.running = true;
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
    var clientEventStream = client.eventStream;
    if (!client.m2) { 
        client.m2 = startM2Process();   
    }
    // client is an object of type Client

    console.log("starting sending M2 output to eventStream");
    var ondata = function(data) {
        console.log('ondata: ' + data);
        message = 'data: ' + data.replace(/\n/g, '\ndata: ') + "\r\n\r\n";
        if (!clientEventStream) { // fatal error, should not happen
            console.log("Error: No event stream in Start M2");
            throw "Error: No client.eventStream in Start M2";
        }
        clientEventStream.write(message);           
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
    var filename = "";
    if (/\.jpg/.test(url.pathname) && /\/tmp\//.test(url.pathname)) {
        filename = url.pathname;
        console.log("Request for jpg inside sandbox dir: "+ filename );       
        filename = sandboxDir + filename;
        filename = require('path').normalize(filename);
        if (filename.indexOf(sandboxDir + "tmp/") != 0 ) {
            console.log( "requested file, " + filename + " is not in " + sandboxDir + "tmp/");
            response.writeHead(404,{"Content-Type": "text/html"});
            response.write( '<h3>Page not found. Return to <a href="/">TryM2</a></h3>');
            response.end();
            return;
        }
         
        if ( require('path').existsSync(filename)) {
            data = require('fs').readFileSync(filename);
            response.writeHead(200, {"Content-Type": "image/jpg"});
            response.write(data);
        }
        else {
            console.log("There was an error opening the file: " + filename);
            response.writeHead(404,{"Content-Type": "text/html"});
            response.write( '<h3>Page not found. Return to <a href="/">TryM2</a></h3>');
        }
        response.end();
        return;
    }

    console.log("User requested: " + url.pathname);
    // If the request was for "/", send index.html
    if (url.pathname === "/" ) {  
        filename = __dirname + "/index.html";
    }
    else {
        filename = __dirname + url.pathname;
    }

    filename = require('path').normalize(filename);
    if (filename.indexOf(__dirname) != 0 ) {
        console.log( "requested file, " + filename + " is not in " + __dirname);
        response.writeHead(404,{"Content-Type": "text/html"});
        response.write( '<h3>Page not found. Return to <a href="/">TryM2</a></h3>');
        response.end();
        return;
    }
    console.log("We are trying to serve: " + filename);

    var ext = require('path').extname(filename);
    var contentType = "text/html";
    if ( /\.css|\.jpg|\.png|\.html|\.js/.test(ext)) {
        switch(ext) {
        case ".css": 
            contentType = 'text/css';
            break;
        case ".jpg":
            contentType = 'image/jpg';
            break;
        }
        if ( require('path').existsSync(filename)) {
            data = require('fs').readFileSync(filename);
            response.writeHead(200, {"Content-Type": contentType});
            response.write(data);
        }
        else {
            console.log("There was an error opening the file:");
            response.writeHead(404,{"Content-Type": "text/html"});
            response.write( '<h3>Page not found. Return to <a href="/">TryM2</a></h3>');
        }
        response.end();
        return;
    }
    // send css files requested by index.html
    response.writeHead(404,{"Content-Type": "text/html"});
    response.write( '<h3>Page not found. Return to <a href="/">TryM2</a></h3>');
    response.end();
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
        //if( clients[clientID] && clients[clientID].m2) {
         //   clients[clientID].m2.kill();
          //  clients[clientID].m2 = null;
        //}
        //delete clients[clientID];
        clients[clientID].eventStream = null;
        response.end();
    });
};

chatAction = function(clientID, request, response) {
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

restartAction = function(clientID, request, response) {
    console.log("received: /restart from " + clientID);
    if (client.m2) { 
        client.m2.kill(); 
        console.log("In startM2(), killed M2 with PID " + client.m2.pid);
    }
    startM2(clients[clientID]);
    response.writeHead(200);  
    response.end();
};


interruptAction = function(clientID, request, response)  {
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
    var pid = url.match(/\/image\/(\d+)\//);
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
    var imagePath = url.match(/\/image\/\d+\/(.*)/);
    console.log(imagePath);
    if (!imagePath) {
        throw("Did not get imagePath in image url");
    }
    console.log("imagePath = " + imagePath[1]);
    return imagePath[1];
}

imageAction = function(url, response) {
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
        console.log("Sorry, could not serve the image: " + err);
    }
  
};

// server reacts to these requests
var actions = [];
actions['/chat'] = chatAction;
actions['/restart'] = restartAction;
actions['/interrupt'] = interruptAction;
actions['/'] = false;
actions['/startSourceEvent'] = startSource;
actions['/admin'] = false;
actions['/image'] = false;

// Create a new server
var server = new http.Server();  
// When the server gets a new request, run this function
server.on("request", function (request, response) {
    //console.log( "got on");
    var url = require('url').parse(request.url);
    
    if (url.pathname === "/admin") {
        stats(response);
        return;
    }
    
    if ( /^\/image/.test(url.pathname) ){
        console.log("Server got a request for /image from the open program");
        imageAction(url.pathname, response);
        return;
    }
 
    if (url.pathname === "/"  || actions[url.pathname] == undefined ) {
        loadFile (url, response);
        return;
    }
    
    var cookies = new Cookies(request, response);
    var clientID = getCurrentClientID(cookies);
        
    if(url.pathname == '/startSourceEvent') {
        //console.log("action is startSourceEvent");
        actions[url.pathname](clientID, request, response);
        return;
    }

    if (!clients[clientID].eventStream ) {
         console.log("Send notEventSourceError back to user.");
         response.writeHead(200, {'notEventSourceError': 'No socket for client...' });
         response.end();
         return;
    }
        
    actions[url.pathname](clientID, request, response);
});

// Run the server on port 8000. Connect to http://localhost:8000/ to use it.
console.log("Listening on port " + port + "...");
server.listen(port);