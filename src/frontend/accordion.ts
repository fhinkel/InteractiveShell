/* global fetch */
import * as $ from "jquery";

const cssClasses = {
  titleSymbolClass: "material-icons titleSymbol",
  titleSymbolActive: "expand_more",
  titleSymbolInactive: "expand_less",
  title: "mdl-button mdl-js-button mdl-button--raised mdl-list__item",
  titleHover: "mdl-button--colored",
  titleToggleClass: "",
  content: "mdl-list__item-text-body mdl-list__item",
  innerListItem: "unstyled",
  titleHref: "menuTitle mdl-button mdl-js-button mdl-button-raised",
  submenuHref: "submenuItem",
};

$.fn.extend({
  toggleText(text) {
    return this.each(function() {
      const current = $(this).text();
      const replacement = text.replace(current, "");
      $(this).text(replacement);
    });
  },
});

const doUptutorialClick = function() {
  $("#uptutorial").val("");
  $("#uptutorial").click();
};

const scrollDownUntilTutorialVisible = function() {
  const y = $(this).position().top;
  const height = parseInt($("#home").css("height"), 10);
  const totalHeight = parseInt($(this).css("height"), 10) + 50;
  if (height - y < totalHeight) {
    const scroll = totalHeight - height + y;
    $("#home").animate({
      scrollTop: ($("#home").scrollTop() + scroll),
    }, 400);
  }
};

const appendTutorialToAccordion = function(tmptitle, lessons, index) {
  const title = tmptitle.clone();
  title.wrapInner("<a href='#' class='" + cssClasses.titleHref +
          "' tutorialid=" + index + "/>")
      .addClass(cssClasses.title)
      .prepend(
          '<i class="' + cssClasses.titleSymbolClass + '">' +
          cssClasses.titleSymbolActive + "</i>")
      .hover(function() {
        $(this).toggleClass(cssClasses.titleHover);
      })
      .click(function() {
          ($(this).toggleClass(cssClasses.titleToggleClass)
           .find("> .titleSymbol") as any).toggleText(
            cssClasses.titleSymbolActive + " " +
            cssClasses.titleSymbolInactive).end()
            .next().slideToggle(scrollDownUntilTutorialVisible);
          return false;
      })
      .next();
  const div = $("<div>");
  let content = "<ul>";
  for (let j = 0; j < lessons.length; j++) {
    content = content +
        '<li class="' + cssClasses.innerListItem + '"><a href="#" class="' +
        cssClasses.submenuHref + '" tutorialid=' + index +
        " lessonid=" + j + ">  " + lessons[j].title + "</a></li>";
  }
  content += "</ul>";
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

const appendLoadTutorialTitleToAccordion = function() {
  const title = $("<h3>");
  title.prop("id", "loadTutorialMenu");
  title.addClass(
      cssClasses.title);
  $("#accordion").append(title);
};

const appendInstructionsToAccordion = function() {
  const instructions = $("<div>");

  fetch("uploadTutorialHelp.txt", {
    credentials: "same-origin",
  }).then(function(response) {
    return response.text();
  }).then(function(content) {
    instructions.append(content);
  }).catch(function(error) {
    console.log("loading /uploadTutorialHelp.txt failed: " + error);
  });
  instructions.prop("id", "loadTutorialInstructions");
  instructions.addClass(
      cssClasses.content).hide();
  $("#accordion").append(instructions);
};

const addExpandLoadTutorialInstructionsButton = function() {
  const expandButton = $("<i>");
  expandButton.addClass(cssClasses.titleSymbolClass);
  expandButton.text(cssClasses.titleSymbolActive);
  expandButton.click(function() {
    const title = $("#loadTutorialMenu");
    const instructions = $("#loadTutorialInstructions");
    (expandButton as any).toggleText(cssClasses.titleSymbolInactive + " " +
        cssClasses.titleSymbolActive);
    title.toggleClass(
        cssClasses.titleToggleClass);
    instructions.slideToggle(scrollDownUntilTutorialVisible);
  });
  $("#loadTutorialMenu").append(expandButton);
};

const addLoadTutorialButton = function() {
  const loadTutorialButton = $("<a>");
  loadTutorialButton.prop("id", "loadTutorialButton");
  loadTutorialButton.html("Load Your Own Tutorial");
  // loadTutorialButton has no tutorial attached, that can be loaded on click.
  loadTutorialButton.addClass(cssClasses.titleHref.replace("menuTitle", ""));
  $("#loadTutorialMenu").append(loadTutorialButton);
  $("#loadTutorialButton").click(doUptutorialClick);
};

const appendLoadTutorialMenuToAccordion = function() {
  appendLoadTutorialTitleToAccordion();
  appendInstructionsToAccordion();
  addExpandLoadTutorialInstructionsButton();
  addLoadTutorialButton();
};

const makeAccordion = function(tutorials) {
  $("#home").append("<div id=\"accordion\"></div>");
  appendLoadTutorialMenuToAccordion();
  for (let i = 0; i < tutorials.length; i++) {
    const title = tutorials[i].title; // this is an <h3>
    const lessons = tutorials[i].lessons;
    appendTutorialToAccordion(title, lessons, i);
  }
};

const removeTutorial = function(title, div, button) {
  return function() {
    button.remove();
    div.remove();
    title.remove();
  };
};

const insertDeleteButtonAtLastTutorial = function(tutorialMenu) {
  const lastTitle = tutorialMenu.prev().prev();
  const lastDiv = tutorialMenu.prev();
  const deleteButton = $("<i>");
  deleteButton.addClass("material-icons icon-with-action saveDialogClose");
  deleteButton.text("close");
  lastTitle.append(deleteButton);
  deleteButton.click(removeTutorial(lastTitle, lastDiv, deleteButton));
};

module.exports = function() {
  return {
    appendTutorialToAccordion,
    makeAccordion,
    insertDeleteButtonAtLastTutorial,
  };
};
