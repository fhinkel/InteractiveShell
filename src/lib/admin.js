var currentUsers = function(clients) {
  return Object.keys(clients).length - 1;
};

module.exports = function(clients, options) {
  var stats = function(request, response) {
    response.writeHead(200, {
      "Content-Type": "text/html"
    });
    response.write(
        '<head>' +
        '<link rel="stylesheet" href="mathProgram.css" ' +
        'type="text/css" media="screen">' +
        '</head>');
    response.write('<h1>' + options.MATH_PROGRAM + ' User Statistics</h1>');
    response.write('There are currently ' + currentUsers(clients) +
        ' users using ' + options.MATH_PROGRAM + '.<br>');
    response.write('In total, there were ' +
        clients.totalUsers +
        ' new users since the server started.<br>');
    response.write('Enjoy ' + options.MATH_PROGRAM + '!');
    response.end();
  };

  return {
    stats: stats
  };
};
