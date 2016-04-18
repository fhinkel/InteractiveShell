/* global $, MathJax */
/* eslint-env browser */
/* eslint "max-len": "off" */
/* eslint "new-cap": "off" */

var lessonNr = 0;
var tutorialNr = 0;
var tutorials = [];
var firstLoadFlag = true; // true until we show tutorial for the first time. Needed because we need to load lesson 0

var cssClasses = {
  titleSymbolClass: "material-icons titleSymbol",
  titleSymbolActive: "expand_more",
  titleSymbolInactive: "expand_less",
  title: "mdl-button mdl-js-button mdl-button--raised mdl-list__item",
  titleHover: "mdl-button--colored",
  titleToggleClass: "",
  content: "mdl-list__item-text-body mdl-list__item",
  innerListItem: "unstyled",
  titleHref: "menuTitle mdl-button mdl-js-button mdl-button-raised",
  submenuHref: "submenuItem"
};

$.fn.extend({
  toggleText: function(text) {
    return this.each(function() {
      var current = $(this).text();
      var replacement = text.replace(current, "");
      $(this).text(replacement);
    });
  }
});

var scrollDownUntilTutorialVisible = function() {
  var y = $(this).position().top;
  var height = parseInt($("#home").css('height'), 10);
  var totalHeight = parseInt($(this).css('height'), 10) + 50;
  if (height - y < totalHeight) {
    var scroll = totalHeight - height + y;
    $("#home").animate({
      scrollTop: ($("#home").scrollTop() + scroll)
    }, 400);
  }
};

var appendTutorialToAccordion = function(tmptitle, lessons, index) {
  var title = tmptitle.clone();
  title.wrapInner("<a href='#' class='" + cssClasses.titleHref + "' tutorialid=" + index + "/>")
      .addClass(cssClasses.title)
      .prepend(
          '<i class="' + cssClasses.titleSymbolClass + '">' + cssClasses.titleSymbolActive + '</i>')
      .hover(function() {
        $(this).toggleClass(cssClasses.titleHover);
      })
      .click(function() {
        $(this).toggleClass(cssClasses.titleToggleClass)
            .find("> .titleSymbol").toggleText(
            cssClasses.titleSymbolActive + " " + cssClasses.titleSymbolInactive).end()
            .next().slideToggle(scrollDownUntilTutorialVisible);
        return false;
      })
      .next();
  var div = $("<div>");
  var content = '<ul>';
  for (var j = 0; j < lessons.length; j++) {
    content = content +
        '<li class="' + cssClasses.innerListItem + '"><a href="#" class="' + cssClasses.submenuHref + '" tutorialid=' + index +
        ' lessonid=' + j + '>  ' + lessons[j].title + '</a></li>';
  }
  content += '</ul>';
  if (index > 0) {
    div.append(content).addClass(
        cssClasses.content)
        .hide();
  } else {
    // Expand the first tutorial:
    title.toggleClass(
        cssClasses.titleToggleClass)
        .find("> .titleSymbol").toggleText(
        cssClasses.titleSymbolActive + " " + cssClasses.titleSymbolInactive);
    div.append(content).addClass(
        cssClasses.content);
  }
  $("#loadTutorialMenu").before(title);
  $("#loadTutorialMenu").before(div);
};

var appendLoadTutorialTitleToAccordion = function() {
  var title = $("<h3>");
  title.prop("id", "loadTutorialMenu");
  title.addClass(
      cssClasses.title);
  $("#accordion").append(title);
};

var appendInstructionsToAccordion = function() {
  var instructions = $("<div>");
  $.get("uploadTutorialHelp.txt", function(content) {
    instructions.append(content);
  });
  instructions.prop("id", "loadTutorialInstructions");
  instructions.addClass(
      cssClasses.content).hide();
  $("#accordion").append(instructions);
};

var addExpandLoadTutorialInstructionsButton = function() {
  var expandButton = $("<i>");
  expandButton.addClass(cssClasses.titleSymbolClass);
  expandButton.text(cssClasses.titleSymbolActive);
  expandButton.click(function() {
    var title = $("#loadTutorialMenu");
    var instructions = $("#loadTutorialInstructions");
    expandButton.toggleText(cssClasses.titleSymbolInactive + " " + cssClasses.titleSymbolActive);
    title.toggleClass(
        cssClasses.titleToggleClass);
    instructions.slideToggle(scrollDownUntilTutorialVisible);
  });
  $("#loadTutorialMenu").append(expandButton);
};

var doUptutorialClick = function() {
  $("#uptutorial").val("");
  $("#uptutorial").click();
};

var addLoadTutorialButton = function() {
  var loadTutorialButton = $("<a>");
  loadTutorialButton.prop("id", "loadTutorialButton");
  loadTutorialButton.html("Load Your Own Tutorial");
  loadTutorialButton.addClass(cssClasses.titleHref);
  $("#loadTutorialMenu").append(loadTutorialButton);
  $("#loadTutorialButton").click(doUptutorialClick);
};

var appendLoadTutorialMenuToAccordion = function() {
  appendLoadTutorialTitleToAccordion();
  appendInstructionsToAccordion();
  addExpandLoadTutorialInstructionsButton();
  addLoadTutorialButton();
};

var loadLesson = function(tutorialid, lessonid) {
  console.log(tutorialNr + "==" + tutorialid + " or " + lessonNr + "==" +
      lessonid);
  var changedLesson = (tutorialNr !== tutorialid || lessonNr !==
  lessonid || firstLoadFlag);
  firstLoadFlag = false;
  if (tutorialid >= 0 && tutorialid < tutorials.length) {
    tutorialNr = tutorialid;
  }
  if (lessonid >= 0 && lessonid < tutorials[tutorialNr].lessons.length) {
    lessonNr = lessonid;
  }
  var lessonContent = tutorials[tutorialNr].lessons[lessonNr]
      .html;
  if (changedLesson) {
    var title = tutorials[tutorialNr].title.text();
    $("#lesson").html(lessonContent).prepend("<h3>" + title + "</h3>");
    $("#lesson").scrollTop(0); // scroll to the top of a new lesson
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, "#lesson"]);
  }
};

var showLesson = function(e) {
  var lessonId;
  var lessonIdNr;
  console.log("Showing lesson. " + $(this).toString());
  var tutorialId = $(this).attr('tutorialid');
  var tutorialIdNr = parseInt(tutorialId.match(/\d/g), 10);
  if (e.data && e.data.lessonIdNr) {
    lessonIdNr = parseInt(e.data.lessonIdNr, 10);
  } else { // Get number from link attribute
    lessonId = $(this).attr('lessonid');
    lessonIdNr = parseInt(lessonId.match(/\d/g), 10);
  }
  loadLesson(tutorialIdNr, lessonIdNr);
  document.getElementById("lessonTabTitle").click();
  return false;
};

var makeAccordion = function(tutorials) {
  $("#home").append("<div id=\"accordion\"></div>");
  appendLoadTutorialMenuToAccordion();
  for (var i = 0; i < tutorials.length; i++) {
    var title = tutorials[i].title; // this is an <h3>
    var lessons = tutorials[i].lessons;
    appendTutorialToAccordion(title, lessons, i);
  }
  $(".menuTitle").on("click", {lessonIdNr: "0"}, showLesson);
  loadLesson(tutorialNr, lessonNr);
};

var switchLesson = function(incr) {
  // console.log("Current lessonNr " + lessonNr);
  loadLesson(tutorialNr, lessonNr + incr);
};

var uploadTutorial = function(insertDeleteButtonAtLastTutorial, populateTutorialElement) {
  return function() {
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
      appendTutorialToAccordion(title, lessons, lastIndex);
      insertDeleteButtonAtLastTutorial($("#loadTutorialMenu"));
    };
    return false;
  };
};

module.exports = function() {
  return {
    showLesson: showLesson,
    makeAccordion: makeAccordion,
    tutorials: tutorials,
    uploadTutorial: uploadTutorial,
    switchLesson: switchLesson
  };
};
