"use strict";

module.exports = function(prefix, fs) {
  var async = require('async');

  var moveWelcomeTutorialToBeginning = function(tutorials, firstTutorial) {
    var index = tutorials.indexOf(firstTutorial);
    if (index > -1) {
      tutorials.splice(index, 1);
      tutorials.unshift(firstTutorial);
    }
    return tutorials;
  };

  var prefixedFsReaddir = function(path, next) {
    var totalPath = prefix + path;
    fs.readdir(totalPath, function(err, files) {
      var tutorials = files.map(function(filename) {
        return path + filename;
      });
      next(err, tutorials);
    });
  };

  var prefixedFsExists = function(path, next) {
    var totalPath = prefix + path;
    fs.exists(totalPath, function(exists) {
      next(exists);
    });
  };

  var getListOfTutorials = function(request, response) {
    var pathForTutorials = 'tutorials/';
    var pathForUserTutorials = 'shared-tutorials/';
    var folderList = [pathForTutorials, pathForUserTutorials];
    async.filter(folderList, prefixedFsExists, function(existingFolders) {
      async.concat(existingFolders, prefixedFsReaddir, function(err, files) {
        var tutorials = files.filter(function(filename) {
            return filename.match(/\.html$/);
          });
        response.writeHead(200, {
            "Content-Type": "text/html"
          });
        tutorials = moveWelcomeTutorialToBeginning(tutorials, "tutorials/welcome2.html");
        response.end(JSON.stringify(tutorials));
      });
    });
  };

  return {
    getList: getListOfTutorials,
    sortTutorials: moveWelcomeTutorialToBeginning
  };
};


