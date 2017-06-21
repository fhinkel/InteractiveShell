/* global MathJax, fetch */
/* eslint-env browser */
/* eslint "new-cap": "off" */

var lessonNr = 0;
var tutorialNr = 0;
var tutorials = [];
var firstLoadFlag = true; // true until we show tutorial for the first time.
// Needed because we need to load lesson 0
var accordion = require('./accordion')();
var $ = require('jquery');

var loadLesson = function(tutorialid, lessonid) {
  if (tutorialid >= 0 && tutorialid < tutorials.length) {
    tutorialNr = tutorialid;
  }
  if (lessonid >= 0 && lessonid < tutorials[tutorialNr].lessons.length) {
    lessonNr = lessonid;
  }
  var lessonContent = tutorials[tutorialNr].lessons[lessonNr]
      .html;
  var title = tutorials[tutorialNr].title.text();
  $("#lesson").html(lessonContent).prepend("<h3>" + title + "</h3>");
  $("#lesson").scrollTop(0); // scroll to the top of a new lesson
  MathJax.Hub.Queue(["Typeset", MathJax.Hub, "#lesson"]);
};

var loadLessonIfChanged = function(tutorialid, lessonid) {
  var changedLesson = (tutorialNr !== tutorialid || lessonNr !==
  lessonid || firstLoadFlag);
  firstLoadFlag = false;
  if (changedLesson) {
    loadLesson(tutorialid, lessonid);
  }
};

var showLesson = function(e) {
  var lessonId;
  var lessonIdNr;
  console.log("Showing lesson. " + $(this).toString());
  console.log("Showing lesson. " + $(this).attr('tutorialid'));
  var tutorialId = $(this).attr('tutorialid');
  var tutorialIdNr = parseInt(tutorialId.match(/\d/g), 10);
  if (e.data && e.data.lessonIdNr) {
    lessonIdNr = parseInt(e.data.lessonIdNr, 10);
  } else { // Get number from link attribute
    lessonId = $(this).attr('lessonid');
    lessonIdNr = parseInt(lessonId.match(/\d/g), 10);
  }
  loadLessonIfChanged(tutorialIdNr, lessonIdNr);
  document.getElementById("lessonTabTitle").click();
  return false;
};

var switchLesson = function(incr) {
  // console.log("Current lessonNr " + lessonNr);
  loadLessonIfChanged(tutorialNr, lessonNr + incr);
};

var enrichTutorialWithHtml = function(theHtml) {
    var result;
    var theLessons = [];
    var tutorial = $("<div>").html(theHtml);
    $("div", tutorial).each(function() {
        theLessons.push({
            title: $("h4:first", $(this)).text(),
            html: $(this)
        });
    });
    result = { // class Tutorial
        title: $("<h3>").append($("title", tutorial).text()),
        current: 0,
        lessons: theLessons
    };
    return result;
};

var getTutorial = function(url) {
  return fetch(url, {
    credentials: 'same-origin'
  }).then(function(response) {
    if (response.status !== 200) {
      throw new Error('Fetching tutorial failed: ' + url);
    }
    return response.text();
  }, function(error) {
    console.log("Error in fetch: " + error);
    throw error;
  });
};

var makeTutorialsList = function(tutorialNames) {
  return Promise.all(
      tutorialNames.map(getTutorial)
  ).then(function(rawTutorials) {
    return rawTutorials.map(enrichTutorialWithHtml);
  }).then(function(data) {
    accordion.makeAccordion(data);
    tutorials = data;
    $(".menuTitle").on("click", {lessonIdNr: "0"}, showLesson);
    loadLessonIfChanged(tutorialNr, lessonNr);
  }).catch(function(error) {
    console.log("Error in makeTutorialList: " + error);
  });
};

var markdownToHtml = function(markdownText) {
    var lines = markdownText.split("\n");
    var output = [];
    var inSection = false; // only false until the first ##.  After that, it is true.
    var inExample = false;
    var firstLineInExample = false;
    var inPara = false;
    for (let line of lines) {
        if (line.match("^\#\#")) {
            if (inPara) {
                output.push("</p>");
                inPara = false;
            }
            if (inSection) {
                output.push("</div>");
            }
            inSection = true;
            output.push("<div><h4>" + line.substring(2) + "</h4>");    
        } else if (line.match("^\#")) {
            output.push("<title>" + line.substring(1) + "</title>");    
        } else if (line.match("^ *$")) {
            if (inPara) {
                output.push("</p>");
                inPara = false;
            }
        } else if (line.match("^```")) {
            if (inPara) {
                output.push("</p>");
                inPara = false;
            }
            if (inExample) {
                output[output.length-1] = output[output.length-1] + "</code></p>";
                inExample = false;
            } else {
                firstLineInExample = true;
                inExample = true;
            }
        } else {
            // all other lines
            if (firstLineInExample) {
                output.push("<p><code>" + line);
                firstLineInExample = false;
            } else if (inPara || inExample) {
                output.push(line);
            } else {
                output.push("<p>" + line);
                inPara = true;
            }
        }
    }
    if (inPara) {
        output.push("</p>");
    }
    if (inSection) {
        output.push("</div>");
    }
    var txt = output.join("\n");
    console.log(txt);
    return txt;
};

var uploadTutorial = function() {
  var files = this.files;
  var file = files[0];
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function(event) {
    var markdownText = event.target.result;
    var resultHtml = markdownToHtml(markdownText);
    tutorials.push(enrichTutorialWithHtml(resultHtml));
    var lastIndex = tutorials.length - 1;
    var newTutorial = tutorials[lastIndex];
    var title = newTutorial.title; // this is an <h3>
    var lessons = newTutorial.lessons;
    accordion.appendTutorialToAccordion(title, lessons, lastIndex);
    accordion.insertDeleteButtonAtLastTutorial($("#loadTutorialMenu"));
  };
  return false;
};

module.exports = function() {
  return {
    showLesson: showLesson,
    tutorials: tutorials,
    uploadTutorial: uploadTutorial,
    switchLesson: switchLesson,
    makeTutorialsList: makeTutorialsList
  };
};
