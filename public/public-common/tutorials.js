var tutorialFunctions = function (makeAccordion, tutorials){
    
     var insertDeleteButtonAtLastTutorial = function(tutorialMenu) {
       var lastTitle = tutorialMenu.prev().prev();
       var lastDiv = tutorialMenu.prev();
       var deleteButton = $("<span>");
       deleteButton.addClass("close-icon ui-icon ui-icon-close");
       lastTitle.prepend(deleteButton);
       deleteButton.click(removeTutorial(lastTitle, lastDiv, deleteButton));
    };
    
    var removeTutorial = function(title, div, button){
       return function(){
          button.remove();
          div.remove();
          title.remove();
       }
    };

    var importTutorials = function() {
        console.log("Import tutorials.");

        $.ajax({
              url: '/getListOfTutorials',
              type: 'GET',
              statusCode: {
                  500: function(error) {
                      console.log("There was an error obtaining the list of tutorial files: " + error);
                  }
              },
              success: function(tutorialData) {
                  console.log("Obtaining list of tutorials successful: " + tutorialData);
                  var tutorialPaths =  JSON.parse(tutorialData);
                  makeTutorialsList(0, tutorialPaths, function() {
                      makeAccordion(tutorials);
                  });
              }
          });
          return false;
    };


    var populateTutorialElement = function(theHtml) {
        // populate a Tutorial element, and return it
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

    return {
        insertDeleteButtonAtLastTutorial: insertDeleteButtonAtLastTutorial,
        importTutorials: importTutorials,
        populateTutorialElement: populateTutorialElement
    }
};
