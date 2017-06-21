var currentUsers = function(clients) : number {
  return Object.keys(clients).length - 1;
};

var totalUsers = function(clients) : number {
  return clients.totalUsers;
};

module.exports = function(clients, options) {
  var program : string = options.MATH_PROGRAM;
  var stats = function(request, response) : void {
    response.writeHead(200, {
      "Content-Type": "text/html"
    });

    const htmlString : string =
`<head>
    <link rel="stylesheet" href="mathProgram.css" type="text/css"
        media="screen">
</head>
<h1>
    ${program} User Statistics
</h1>
There are currently ${currentUsers(clients)} users using ${program}.
<br>
In total, there were ${totalUsers(clients)} new users since
 the server started.
<br>
Enjoy ${program}!`;

    response.write(htmlString);
    response.end();
  };

  return {
    stats: stats
  };
};
