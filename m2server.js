// This is server-side JavaScript, intended to be run with NodeJS.
// It implements a very simple, completely anonymous chat room.
// POST new messages to /chat, or GET a text/event-stream of messages
// from the same URL. Making a GET request to / returns a simple HTML file
// that contains the client-side chat UI.
var http = require('http');  // NodeJS HTTP server API
var Cookies = require("cookies");


// The HTML file for the chat client. Used below.
var clientui = require('fs').readFileSync("index.html");
// var emulation = require('fs').readFileSync("EventSourceEmulation.js");

// An array of ServerResponse objects that we're going to send events to
var clients = [];

var clientIds = [];
var clientId = 0;

// Send a comment to the clients every 20 seconds so they don't 
// close the connection and then reconnect
setInterval(function() {
    clients.forEach(function(client) {
        client.write(":ping\n");
    });
}, 20000);

var m2;
startM2Emitter = function(client) {
    var myM2 = client.myM2;
    myM2.stdout.on('data', function (data) {
           //console.log('m2stdout: ' + data);
           message = 'data: ' + data.replace(/\n/g, '\ndata: ') + "\r\n\r\n";
           //console.log('m2stdout message: ' + message);
           client.write(message); 
           console.log("This is the Id we attached to a response object: " + client.myId);
          
       });
       myM2.stderr.on('data', function (data) {
           console.log('m2stdout: ' + data);
           message = 'data: ' + data.replace(/\n/g, '\ndata: ') + "\r\n\r\n";
           //console.log('m2stdout message: ' + message);
           client.write(message); 
           console.log("This is the Id we attached to a response object: " + client.myId);
       });    
};

startM2 = function() {
    var spawn = require('child_process').spawn;
    m2 = spawn('M2');
    m2.stdout.setEncoding("utf8");
    m2.stderr.setEncoding("utf8");
    console.log('Spawned m2 pid: ' + m2.pid);
   
};


// Create a new server
var server = new http.Server();  

// When the server gets a new request, run this function
server.on("request", function (request, response) {
    // Parse the requested URL
    var cookies = new Cookies(request, response);
    var url = require('url').parse(request.url);
   
    // If the request was for "/", send the client-side chat UI.
    if (url.pathname === "/" || url.pathname === "/index.html") {  // A request for the chat UI
        cookies.set( "trym2cookie", clientId.toString(10), { httpOnly: false } );
        console.log("Here is a new client with these headers: ");
        for (e in request.headers) {
                console.log(e+": "+request.headers[e]);
        }
        clientIds.push(clientId);
        clientId = clientId + 1;
        startM2();
        
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(clientui);
        response.end();
        return;
    }
    if (/\.css/.test(url.pathname) ) {
        response.writeHead(200, {'Content-Type': 'text/css'});
        var u = url.pathname.replace("/", '');
        //console.log("Filenmae: " + u);
        response.write(require('fs').readFileSync(u));
        response.end();
        return;
        //response.writeHead(404);
        //response.end();
        //return;
    }
    if (url.pathname === "/chat") {
        // If the request was a post, then a client is posting a new message
        if (request.method === "POST") {
            request.setEncoding("utf8");
            
            for (e in request.headers) {
                console.log(e+": "+request.headers[e]);
            }

            var body = "";
            // When we get a chunk of data, add it to the body
            request.on("data", function(chunk) { body += chunk; });

            // When the request is done, send an empty response 
            // and broadcast the message to all listening clients.
            request.on("end", function() {
                response.writeHead(200);   // Respond to the request
                response.end();
                // Send 'body' to M2
                m2.stdin.write(body);
            });
            return;
        } else {
            // Set the content type and send an initial message event 
            response.writeHead(200, {'Content-Type': "text/event-stream" });
            response.myId = "hello " + clientId;
            response.myM2 = m2;
            //response.write("data: Connected, starting M2 ...\ndata: \n\n");
            startM2Emitter(response);

            // If the client closes the connection, remove the corresponding
            // response object from the array of active clients
            request.connection.on("end", function() {
                clients.splice(clients.indexOf(response), 1);
                response.end();
            });

            // Remember the response object so we can send future messages to it
            clients.push(response);
            return;
        }
    }
    // Send file (e.g. images and tutorial) or 404 if not found
    if (url.pathname !== "/chat") {
        
        var u = url.pathname.replace("/", '');
        //console.log("Filenmae: " + u);
        try {
            data = require('fs').readFileSync(u);
            //console.log(data);
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
//server.listen(8000);
console.log("Listening on port 8000...");
server.listen(8000);
