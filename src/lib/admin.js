module.exports = function(clients, options) {
  return {
    stats: function(request, response) {
      // to do: authorization
      response.writeHead(200, {
        "Content-Type": "text/html"
      });
      var currentUsers = -1;
      for (var c in clients) {
        if (clients.hasOwnProperty(c)) {
          currentUsers++;
        }
      }
      response.write(
          '<head>' +
          '<link rel="stylesheet" href="mathProgram.css" ' +
          'type="text/css" media="screen">' +
          '</head>');
      response.write('<h1>' + options.MATH_PROGRAM + ' User Statistics</h1>');
      response.write('There are currently ' + currentUsers +
          ' users using ' + options.MATH_PROGRAM + '.<br>');
      response.write('In total, there were ' +
          clients.totalUsers +
          ' new users since the server started.<br>');
      response.write('Enjoy ' + options.MATH_PROGRAM + '!');
      response.end();
    }
  };
};
