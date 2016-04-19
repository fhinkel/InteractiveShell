/* global $, MathJax */
/* eslint-env browser */
/* eslint "max-len": "off" */
/* eslint "new-cap": "off" */

var lessonNr = 0;
var tutorialNr = 0;
var tutorials = [];
var firstLoadFlag = true; // true until we show tutorial for the first time. Needed because we need to load lesson 0
var accordion = require('./accordion')();

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
  console.log(tutorialNr + "==" + tutorialid + " or " + lessonNr + "==" +
      lessonid);
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

var makeTutorialsList = function(i, tutorialNames) {
  if (i < tutorialNames.length) {
    $.get(tutorialNames[i], function(resultHtml) {
      tutorials[i] = populateTutorialElement(resultHtml);
      console.log(tutorials[i].title);
      makeTutorialsList(i + 1, tutorialNames);
    });
  } else {
    accordion.makeAccordion(tutorials);
    $(".menuTitle").on("click", {lessonIdNr: "0"}, showLesson);
    loadLessonIfChanged(tutorialNr, lessonNr);
  }
};

var uploadTutorial = function() {
  var files = this.files;
  var file = files[0];
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function(event) {
    var resultHtml = event.target.result;
    tutorials.push(populateTutorialElement(resultHtml));
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
    makeTutorialList: makeTutorialsList,
    tutorials: tutorials,
    uploadTutorial: uploadTutorial,
    switchLesson: switchLesson
  };
};
