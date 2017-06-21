"use strict";

type Tutorial = string;
type Tutorials = Tutorial[];

function moveWelcomeTutorialToBeginning(
  tutorials : Tutorials,
  firstTutorial : Tutorial
) : Tutorials {
  var index : number = tutorials.indexOf(firstTutorial);
  if (index > -1) {
    tutorials.splice(index, 1);
    tutorials.unshift(firstTutorial);
  }
  return tutorials;
}

type GetListFunction = (any, {writeHead, end}) => void;

function tutorialReader(prefix : string, fs) : GetListFunction {
  const async = require('async');

  var prefixedFsReaddir = function(path : string, next) : void {
    var totalPath : string = prefix + path;
    fs.readdir(totalPath, function(err, files) {
      var tutorials : Tutorials = files.map(function(filename) : Tutorial {
        return path + filename;
      });
      next(err, tutorials);
    });
  };

  var prefixedFsExists = function(path : string, next) : void {
    var totalPath : string = prefix + path;
    fs.exists(totalPath, function(exists) {
      next(exists);
    });
  };

  var getListOfTutorials = function(request, response : {writeHead, end})
    : void {
    var pathForTutorials : string = 'tutorials/';
    var pathForUserTutorials : string = 'shared-tutorials/';
    var folderList : string[] = [pathForTutorials, pathForUserTutorials];
    async.filter(
      folderList,
      prefixedFsExists,
      function(existingFolders
      ) {
        async.concat(
          existingFolders,
          prefixedFsReaddir,
          function(err, files : string[]
          ) {
            if (err) {
              throw new Error("async.concat() failed: " + err);
            }
            var tutorials : Tutorials = files.filter(
              function(filename : Tutorial) : Tutorials {
                return filename.match(/\.html$/);
              });
            response.writeHead(200, {
              "Content-Type": "text/html"
            });
            tutorials = moveWelcomeTutorialToBeginning(tutorials,
              "tutorials/welcome2.html");
            response.end(JSON.stringify(tutorials));
          });
      });
  };

  return getListOfTutorials;
}

export {tutorialReader};
export {moveWelcomeTutorialToBeginning as sortTutorials};
export {Tutorials};
export {Tutorial};
export {GetListFunction};
