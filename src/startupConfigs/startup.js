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
      global.OPTIONS = require('./default.js').getConfig(overrideOptions);
      console.log(global.OPTIONS);
      var Macaulay2Server = require('../lib/index.js').mathServer();
      Macaulay2Server.listen();
    })
    .catch(function(err) {
      console.log(err);
    });
};
