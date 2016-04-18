/* global $ */
/* eslint "max-len": "off" */
/* eslint "no-unused-vars": "off" */
var removeTutorial = function(title, div, button) {
  return function() {
    button.remove();
    div.remove();
    title.remove();
  };
};

var insertDeleteButtonAtLastTutorial = function(tutorialMenu) {
  var lastTitle = tutorialMenu.prev().prev();
  var lastDiv = tutorialMenu.prev();
  var deleteButton = $("<i>");
  deleteButton.addClass("material-icons icon-with-action saveDialogClose");
  deleteButton.text("close");
  lastTitle.append(deleteButton);
  deleteButton.click(removeTutorial(lastTitle, lastDiv, deleteButton));
};

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

var tutorialFunctions = function(makeAccordion, tutorials) {
  var makeTutorialsList = function(i, tutorialNames, callback) {
    if (i < tutorialNames.length) {
      $.get(tutorialNames[i], function(resultHtml) {
        tutorials[i] = populateTutorialElement(resultHtml);
        console.log(tutorials[i].title);
        makeTutorialsList(i + 1, tutorialNames, callback);
      });
    } else {
      callback();
    }
  };

  var importTutorials = function(fetch) {
    console.log("Import tutorials.");

    fetch('/getListOfTutorials')
        .then(function(tutorialData) {
          return tutorialData.json();
        }).then(function(tutorialPaths) {
          console.log("Obtaining list of tutorials successful: " + tutorialPaths);
      // var tutorialPaths = JSON.parse(tutorialData);
          makeTutorialsList(0, tutorialPaths, function() {
        makeAccordion(tutorials);
      });
        }).catch(function(error) {
      console.log("There was an error obtaining the list of tutorial files: " + error);
      return;
    });

    /* $.ajax({
     url: '/getListOfTutorials',
     type: 'GET',
     statusCode: {
     500: function(error) {
     console.log("There was an error obtaining the list of tutorial files: " + error);
     }
     },
     success: function(tutorialData) {
     console.log("Obtaining list of tutorials successful: " + tutorialData);
     var tutorialPaths = JSON.parse(tutorialData);
     makeTutorialsList(0, tutorialPaths, function() {
     makeAccordion(tutorials);
     });
     }
     });*/
    return false;
  };

  return {
    insertDeleteButtonAtLastTutorial: insertDeleteButtonAtLastTutorial,
    importTutorials: importTutorials,
    populateTutorialElement: populateTutorialElement
  };
};
