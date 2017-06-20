// This starts the main server!
var fs = require('fs');

var fileExistsPromise = function(filename) {
  return new Promise(function(resolve /* , reject*/) {
    fs.access(filename, fs.R_OK, function(err) {
      console.log(!err);
      resolve(!err);
    });
  });
};

module.exports = function(overrideOptions) {
  fileExistsPromise("public/users.htpasswd")
    .then(function(exists) {
      if (exists) {
        overrideOptions.authentication = "basic";
      } else {
        overrideOptions.authentication = "none";
      }
    })
    .then(function() {
      require('./default.js').getConfig(overrideOptions, function(options) {
        global.OPTIONS = options;
        console.log(global.OPTIONS);
        var Macaulay2Server = require('../lib/server.js').mathServer();
        Macaulay2Server.listen();
      });
    })
    .catch(function(err) {
      console.log(err);
    });
};
