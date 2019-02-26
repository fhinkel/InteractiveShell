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
  const getListOfTutorials = function(request, response: {writeHead, end})
    : void {
    const pathForTutorials: string = "tutorials/";

    const totalPath: string = prefix + pathForTutorials;
    fs.access(totalPath, fs.constants.R_OK, function(error) {
      if (error) {
        console.log("Tutorial directory does not exists.");
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.end("Tutorial directory does not exists.");
        return;
      }
      fs.readdir(totalPath, function(err, files) {
        if (err) {
          console.log("Reading directory of tutorials failed.");
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.end("Reading directory of tutorials failed.");
          return;
        }
        let tutorials: Tutorials = files.map(function(filename): Tutorial {
          return pathForTutorials + filename;
        });
        tutorials = tutorials.filter(
          function(filename: Tutorial): Tutorials {
              return filename.match(/\.html$/);
        });
        tutorials = moveWelcomeTutorialToBeginning(tutorials,
          "tutorials/welcome2.html");

        response.writeHead(200, {
          "Content-Type": "text/html",
        });
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
