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

type GetListFunction = (request: any, response: { writeHead: any; end: any; }) => void;

function tutorialReader(prefix: string, fs): GetListFunction {
  const async = require("async");

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
    fs.access(totalPath, fs.constants.R_OK, function(error) {
      next(null, !error);
    });
  };

  const getListOfTutorials = function(request, response: {writeHead, end})
    : void {
    const pathForTutorials: string = "tutorials/";
    const pathForUserTutorials: string = "shared-tutorials/";
    const folderList: string[] = [pathForTutorials, pathForUserTutorials];
    async.filter(folderList, prefixedFsExists, function(err, existingFolders) {
      if (err) {
        console.log("Something went wrong when getting the list of tutorials.");
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.end("Something went wrong when getting the list of tutorials.");
        return;
      }
      async.concat(
          existingFolders,
          prefixedFsReaddir,
          function(error, files: string[],
          ) {
            if (error) {
              throw new Error("async.concat() failed: " + error);
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
