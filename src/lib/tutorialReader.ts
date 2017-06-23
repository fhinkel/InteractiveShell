"use strict";

type Tutorial = string;
type Tutorials = Tutorial[];

function moveWelcomeTutorialToBeginning(
  tutorials: Tutorials,
  firstTutorial: Tutorial,
): Tutorials {
  const index: number = tutorials.indexOf(firstTutorial);
  if (index > -1) {
    tutorials.splice(index, 1);
    tutorials.unshift(firstTutorial);
  }
  return tutorials;
}

type GetListFunction = (any, {writeHead, end}) => void;

function tutorialReader(prefix: string, fs): GetListFunction {
  const filter = require("async/filter");
  const concat = require("async/concat");

  const prefixedFsReaddir = function(path: string, next): void {
    const totalPath: string = prefix + path;
    fs.readdir(totalPath, function(err, files) {
      const tutorials: Tutorials = files.map(function(filename): Tutorial {
        return path + filename;
      });
      next(err, tutorials);
    });
  };

  const prefixedFsExists = function(path: string, next): void {
    const totalPath: string = prefix + path;
    fs.exists(totalPath, function(exists) {
      next(exists);
    });
  };

  const getListOfTutorials = function(request, response: {writeHead, end})
    : void {
    const pathForTutorials: string = "tutorials/";
    const pathForUserTutorials: string = "shared-tutorials/";
    const folderList: string[] = [pathForTutorials, pathForUserTutorials];
    filter(
      folderList,
      prefixedFsExists,
      function(existingFolders,
      ) {
        concat(
          existingFolders,
          prefixedFsReaddir,
          function(err, files: string[],
          ) {
            if (err) {
              throw new Error("async.concat() failed: " + err);
            }
            let tutorials: Tutorials = files.filter(
              function(filename: Tutorial): Tutorials {
                return filename.match(/\.html$/);
              });
            response.writeHead(200, {
              "Content-Type": "text/html",
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
