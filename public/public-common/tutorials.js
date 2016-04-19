/* global $ */
/* eslint "max-len": "off" */
/* eslint "no-unused-vars": "off" */
var tutorials = [];

var populateTutorialElement = function(theHtml) {
  var theLessons = [];
  var tutorial = $("<div>").html(theHtml);
  $("div", tutorial).each(function() {
    theLessons.push({
      title: $("h4:first", $(this)).text(),
      html: $(this)
    });
  });
  return { // class Tutorial
    title: $("<h3>").append($("title", tutorial).text()),
    current: 0,
    lessons: theLessons
  };
};

var tutorialFunctions = function(makeAccordion) {
  var makeTutorialsList = function(i, tutorialNames, callback) {
    if (i < tutorialNames.length) {
      $.get(tutorialNames[i], function(resultHtml) {
        tutorials[i] = populateTutorialElement(resultHtml);
        console.log(tutorials[i].title);
        makeTutorialsList(i + 1, tutorialNames, callback);
      });
    } else {
      callback(tutorials);
    }
  };

  var importTutorials = function(fetch) {
    console.log("Import tutorials.");

    fetch('/getListOfTutorials')
        .then(function(data) {
          return data.json();
        }).then(function(tutorialPaths) {
          console.log("Obtaining list of tutorials successful: " + tutorialPaths);
          makeTutorialsList(0, tutorialPaths, makeAccordion);
        }).catch(function(error) {
          console.log("There was an error obtaining the list of tutorial files: " + error);
        });
  };

  return {
    importTutorials: importTutorials,
    populateTutorialElement: populateTutorialElement
  };
};
