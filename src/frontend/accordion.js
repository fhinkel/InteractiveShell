/* global $ */

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

var doUptutorialClick = function() {
  $("#uptutorial").val("");
  $("#uptutorial").click();
};

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
  title.wrapInner("<a href='#' class='" + cssClasses.titleHref +
      "' tutorialid=" + index + "/>")
      .addClass(cssClasses.title)
      .prepend(
          '<i class="' + cssClasses.titleSymbolClass + '">' +
          cssClasses.titleSymbolActive + '</i>')
      .hover(function() {
        $(this).toggleClass(cssClasses.titleHover);
      })
      .click(function() {
        $(this).toggleClass(cssClasses.titleToggleClass)
            .find("> .titleSymbol").toggleText(
            cssClasses.titleSymbolActive + " " +
            cssClasses.titleSymbolInactive).end()
            .next().slideToggle(scrollDownUntilTutorialVisible);
        return false;
      })
      .next();
  var div = $("<div>");
  var content = '<ul>';
  for (var j = 0; j < lessons.length; j++) {
    content = content +
        '<li class="' + cssClasses.innerListItem + '"><a href="#" class="' +
        cssClasses.submenuHref + '" tutorialid=' + index +
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
    expandButton.toggleText(cssClasses.titleSymbolInactive + " " +
        cssClasses.titleSymbolActive);
    title.toggleClass(
        cssClasses.titleToggleClass);
    instructions.slideToggle(scrollDownUntilTutorialVisible);
  });
  $("#loadTutorialMenu").append(expandButton);
};

var addLoadTutorialButton = function() {
  var loadTutorialButton = $("<a>");
  loadTutorialButton.prop("id", "loadTutorialButton");
  loadTutorialButton.html("Load Your Own Tutorial");
  // loadTutorialButton has no tutorial attached, that can be loaded on click.
  loadTutorialButton.addClass(cssClasses.titleHref.replace("menuTitle", ""));
  $("#loadTutorialMenu").append(loadTutorialButton);
  $("#loadTutorialButton").click(doUptutorialClick);
};

var appendLoadTutorialMenuToAccordion = function() {
  appendLoadTutorialTitleToAccordion();
  appendInstructionsToAccordion();
  addExpandLoadTutorialInstructionsButton();
  addLoadTutorialButton();
};

var makeAccordion = function(tutorials) {
  $("#home").append("<div id=\"accordion\"></div>");
  appendLoadTutorialMenuToAccordion();
  for (var i = 0; i < tutorials.length; i++) {
    var title = tutorials[i].title; // this is an <h3>
    var lessons = tutorials[i].lessons;
    appendTutorialToAccordion(title, lessons, i);
  }
};

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

module.exports = function() {
  return {
    appendTutorialToAccordion: appendTutorialToAccordion,
    makeAccordion: makeAccordion,
    insertDeleteButtonAtLastTutorial: insertDeleteButtonAtLastTutorial
  };
};
