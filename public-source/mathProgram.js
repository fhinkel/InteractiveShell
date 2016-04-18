/* global $, MathJax, io, SocketIOFileUpload, mathProgramName, tutorialFunctions, DefaultText */
/* eslint-env browser */
/* eslint "max-len": "off" */
/* eslint "new-cap": "off" */

var trym2 = {
  lessonNr: 0,
  tutorialNr: 0,
  tutorials: [],
  firstLoadFlag: true, // true until we show tutorial for the first time. Needed because we need to load lesson 0
  MAXFILESIZE: 500000, // max size in bytes for file uploads
  socket: null,
  serverDisconnect: false
};

var ctrlc = "\x03";

var dialogPolyfill = require('dialog-polyfill');

var shellTextArea = require('shell-emulator');

// /////////////////
// Tutorial code //
// /////////////////

trym2.tutorials = [];

trym2.CssClasses = {
  accordion: {
    titleSymbolClass: "material-icons titleSymbol",
    titleSymbolActive: "expand_more",
    titleSymbolInactive: "expand_less",
    title: "mdl-button mdl-js-button mdl-button--raised mdl-list__item",
    titleHover: "mdl-button--accent",
    titleToggleClass: "",
    content: "mdl-list__item-text-body mdl-list__item",
    innerListItem: "unstyled",
    titleHref: "menuTitle mdl-button mdl-js-button mdl-button-raised",
    submenuHref: "submenuItem"
  }
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

trym2.appendTutorialToAccordion = function(tmptitle, lessons, index) {
  var title = tmptitle.clone();
  title.wrapInner("<a href='#' class='" + trym2.CssClasses.accordion.titleHref + "' tutorialid=" + index + "/>")
      .addClass(trym2.CssClasses.accordion.title)
      .prepend(
          '<i class="' + trym2.CssClasses.accordion.titleSymbolClass + '">' + trym2.CssClasses.accordion.titleSymbolActive + '</i>')
      .hover(function() {
        $(this).toggleClass(trym2.CssClasses.accordion.titleHover);
      })
      .click(function() {
        $(this).toggleClass(trym2.CssClasses.accordion.titleToggleClass)
            .find("> .titleSymbol").toggleText(
            trym2.CssClasses.accordion.titleSymbolActive + " " + trym2.CssClasses.accordion.titleSymbolInactive).end()
            .next().slideToggle(trym2.scrollDownUntilTutorialVisible);
        return false;
      })
      .next();
  var div = $("<div>");
  var content = '<ul>';
  for (var j = 0; j < lessons.length; j++) {
    content = content +
        '<li class="' + trym2.CssClasses.accordion.innerListItem + '"><a href="#" class="' + trym2.CssClasses.accordion.submenuHref + '" tutorialid=' + index +
        ' lessonid=' + j + '>  ' + lessons[j].title + '</a></li>';
  }
  content += '</ul>';
  if (index > 0) {
    div.append(content).addClass(
        trym2.CssClasses.accordion.content)
        .hide();
  } else {
    // Expand the first tutorial:
    title.toggleClass(
        trym2.CssClasses.accordion.titleToggleClass)
        .find("> .titleSymbol").toggleText(
        trym2.CssClasses.accordion.titleSymbolActive + " " + trym2.CssClasses.accordion.titleSymbolInactive);
    div.append(content).addClass(
        trym2.CssClasses.accordion.content);
  }
  $("#loadTutorialMenu").before(title);
  $("#loadTutorialMenu").before(div);
};

trym2.appendLoadTutorialMenuToAccordion = function() {
  trym2.appendLoadTutorialTitleToAccordion();
  trym2.appendInstructionsToAccordion();
  trym2.addExpandLoadTutorialInstructionsButton();
  trym2.addLoadTutorialButton();
};

trym2.addLoadTutorialButton = function() {
  console.log("Adding buttons.");
  var loadTutorialButton = $("<a>");
  loadTutorialButton.prop("id", "loadTutorialButton");
  loadTutorialButton.html("Load Tutorial");
  loadTutorialButton.addClass(trym2.CssClasses.accordion.titleHref);
  $("#loadTutorialMenu").append(loadTutorialButton);
  $("#loadTutorialButton").click(trym2.doUptutorialClick);
};

trym2.addExpandLoadTutorialInstructionsButton = function() {
  var expandButton = $("<i>");
  expandButton.addClass(trym2.CssClasses.accordion.titleSymbolClass);
  expandButton.text(trym2.CssClasses.accordion.titleSymbolActive);
  expandButton.click(function() {
    var title = $("#loadTutorialMenu");
    var instructions = $("#loadTutorialInstructions");
    expandButton.toggleText(trym2.CssClasses.accordion.titleSymbolInactive + " " + trym2.CssClasses.accordion.titleSymbolActive);
    title.toggleClass(
        trym2.CssClasses.accordion.titleToggleClass);
    instructions.slideToggle(trym2.scrollDownUntilTutorialVisible);
  });
  $("#loadTutorialMenu").append(expandButton);
};

trym2.scrollDownUntilTutorialVisible = function() {
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

trym2.appendLoadTutorialTitleToAccordion = function() {
  console.log("Adding Title.");
  var title = $("<h3>");
  title.prop("id", "loadTutorialMenu");
  title.addClass(
      trym2.CssClasses.accordion.title);
  $("#accordion").append(title);
};

trym2.appendInstructionsToAccordion = function() {
  console.log("Adding Instructions.");
  var instructions = $("<div>");
  $.get("uploadTutorialHelp.txt", function(content) {
    instructions.append(content);
  });
  instructions.prop("id", "loadTutorialInstructions");
  instructions.addClass(
      trym2.CssClasses.accordion.content).hide();
  $("#accordion").append(instructions);
};

trym2.makeAccordion = function(tutorials) {
  $("#home").append("<div id=\"accordion\"></div>");
  trym2.appendLoadTutorialMenuToAccordion();
  for (var i = 0; i < tutorials.length; i++) {
    var title = tutorials[i].title; // this is an <h3>
    var lessons = tutorials[i].lessons;
    trym2.appendTutorialToAccordion(title, lessons, i);
  }

  $(".menuTitle").on("click", {lessonIdNr: "0"}, trym2.showLesson);
  trym2.loadLesson(trym2.tutorialNr, trym2.lessonNr);
};

trym2.showLesson = function(e) {
  var lessonId;
  var lessonIdNr;
  var tutorialId = $(this).attr('tutorialid');
  var tutorialIdNr = parseInt(tutorialId.match(/\d/g), 10);
  if (e.data && e.data.lessonIdNr) {
    lessonIdNr = parseInt(e.data.lessonIdNr, 10);
  } else { // Get number from link attribute
    lessonId = $(this).attr('lessonid');
    lessonIdNr = parseInt(lessonId.match(/\d/g), 10);
  }
  // console.log("LessonID: " + lessonId);
  // console.log("You clicked a submenuItem: " + $(this).html());
  trym2.loadLesson(tutorialIdNr, lessonIdNr);

  document.getElementById("lessonTabTitle").click();
  return false;
};

trym2.loadLesson = function(tutorialid, lessonid) {
  console.log(this.tutorialNr + "==" + tutorialid + " or " + this.lessonNr + "==" +
      lessonid);
  var changedLesson = (this.tutorialNr !== tutorialid || this.lessonNr !==
  lessonid || this.firstLoadFlag);
  trym2.firstLoadFlag = false;
  if (tutorialid >= 0 && tutorialid < this.tutorials.length) {
    this.tutorialNr = tutorialid;
  }
  if (lessonid >= 0 && lessonid < this.tutorials[this.tutorialNr].lessons.length) {
    this.lessonNr = lessonid;
  }

  var lessonContent = this.tutorials[this.tutorialNr].lessons[this.lessonNr]
      .html;
  if (changedLesson) {
    console.log("Lesson changed");
    console.log(this.tutorials[this.tutorialNr].title);
    var title = this.tutorials[this.tutorialNr].title.text();
    $("#lesson").html(lessonContent).prepend("<h3>" + title + "</h3>");
    $("#lesson").scrollTop(0); // scroll to the top of a new lesson
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, "#lesson"]);
    // document.getElementById("lessonTabTitle").click();
  }
};

trym2.switchLesson = function(incr) {
  console.log("Current lessonNr " + trym2.lessonNr);
  this.loadLesson(this.tutorialNr, this.lessonNr + incr);
};

trym2.inspect = function(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      console.log("inspect: " + prop + " : " + obj.prop);
    }
  }
};

trym2.postMessage = function(msg, notrack) {
  console.log("Posting msg " + msg);
  trym2.socket.emit('input', msg);
  if (!notrack) {
// Closure to capture the file information.
    $("#M2Out").trigger("track", msg);
    console.log("Tracking.");
  }
  return true;
};

trym2.sendCallback = function(id) {
  return function() {
    var str = trym2.getSelected(id);
    trym2.postMessage(str);
    return false;
  };
};

trym2.sendOnEnterCallback = function(id) {
  return function(e) {
    if (e.which === 13 && e.shiftKey) {
      e.preventDefault();
      // do not make a line break or remove selected text when sending
      trym2.postMessage(trym2.getSelected(id));
    }
  };
};

trym2.doUptutorialClick = function() {
  $("#uptutorial").val("");
  console.log("Click tutorial: " + typeof ($("#uptutorial")));
  $("#uptutorial").click();
};

var saveInteractions = function() {
  var input = $("#M2In");
  var output = $("#M2Out");
  var dialog = document.querySelector('#saveDialog');
  var inputLink = 'data:application/octet-stream,' + encodeURIComponent(input.val());
  var inputParagraph = document.getElementById("inputContent");
  inputParagraph.setAttribute('href', inputLink);
  inputParagraph.setAttribute('download', 'input.txt');
  var outputLink = 'data:application/octet-stream,' + encodeURIComponent(output.val());
  var outputParagraph = document.getElementById("outputContent");
  outputParagraph.setAttribute('href', outputLink);
  outputParagraph.setAttribute('download', 'output.txt');
  if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog);
  }
  dialog.showModal();
};

trym2.uploadTutorial = function() {
  var files = this.files;
  console.log("number of files in upload tutorial: " + files.length);
  var file = files[0];
  var fileName = file.name;
  console.log("Process file for tutorial upload:" + fileName);

  var reader = new FileReader();

  reader.readAsText(file);
  reader.onload = function(event) {
    var resultHtml = event.target.result;
    console.log(resultHtml);
    trym2.tutorials.push(trym2.populateTutorialElement(resultHtml));
    var lastIndex = trym2.tutorials.length - 1;
    var newTutorial = trym2.tutorials[lastIndex];

    var title = newTutorial.title; // this is an <h3>
    console.log("new title: " + title.html());
    var lessons = newTutorial.lessons;
    trym2.appendTutorialToAccordion(title, lessons, lastIndex);
    trym2.insertDeleteButtonAtLastTutorial($("#loadTutorialMenu"));
  };
  return false;
};

var tf = tutorialFunctions(trym2.makeAccordion, trym2.tutorials);
trym2.insertDeleteButtonAtLastTutorial = tf.insertDeleteButtonAtLastTutorial;
trym2.importTutorials = tf.importTutorials;

var attachMinMaxBtnActions = function() {
  var maximize = document.getElementById("maximizeOutput");
  var downsize = document.getElementById("downsizeOutput");
  var zoomBtns = document.getElementById("M2OutZoomBtns");
  maximize.addEventListener("click", function() {
    var dialog = document.getElementById("fullScreenOutput");
    var maxCtrl = document.getElementById("M2OutCtrlBtnsMax");
    if (!dialog.showModal) {
      dialogPolyfill.registerDialog(dialog);
    }
    var output = document.getElementById("M2Out");
    dialog.appendChild(output);
    maxCtrl.insertBefore(zoomBtns, downsize);
    dialog.showModal();
  });
  downsize.addEventListener("click", function() {
    var dialog = document.getElementById("fullScreenOutput");
    var oldPosition = document.getElementById("right-half");
    var output = document.getElementById("M2Out");
    var ctrl = document.getElementById("M2OutCtrlBtns");
    oldPosition.appendChild(output);
    ctrl.insertBefore(zoomBtns, maximize);
    dialog.close();
  });
};

var attachTutorialNavBtnActions = function() {
  $("#previousBtn").click(function() {
    trym2.switchLesson(-1);
  });

  $("#nextBtn").click(function() {
    trym2.switchLesson(1);
  });
};

var attachCtrlBtnActions = function() {
  $("#sendBtn").click(trym2.sendCallback('M2In'));
  $("#resetBtn").click(function() {
    $("#M2Out").trigger("reset");
    trym2.socket.emit('reset');
  });
  $("#interruptBtn").click(function() {
    trym2.postMessage(ctrlc, true);
  });
  $("#saveBtn").click(saveInteractions);
};

trym2.populateTutorialElement = tf.populateTutorialElement;

var showUploadSuccessDialog = function(event) {
  var dialog = document.getElementById("uploadSuccessDialog");
  if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog);
  }
  console.log('we uploaded the file: ' + event.success);
  console.log(event.file);
  var filename = event.file.name;
  console.log("File uploaded successfully!" + filename);
  var successSentence = filename +
      " has been uploaded and you can use it by loading it into your " +
      mathProgramName + " session (use the input terminal).";
  document.getElementById("uploadSuccessDialogContent").innerText = successSentence;
  dialog.showModal();
};

var showImageDialog = function(imageUrl) {
  if (imageUrl) {
    var dialog = document.getElementById("showImageDialog");
    if (!dialog.showModal) {
      dialogPolyfill.registerDialog(dialog);
    }
    console.log("We received an image: " + imageUrl);
    var a = document.getElementById("showImageDialogBtn");
    a.setAttribute("href", "#");
    a.innerText = imageUrl.split('/').pop();
    a.addEventListener("click", function() {
      window.open(imageUrl, '_blank',
          'height=200,width=200,toolbar=0,location=0,menubar=0');
      dialog.close();
    });
    dialog.showModal();
  }
};

var attachCloseDialogBtns = function() {
  document.getElementById("saveDialogClose").addEventListener('click', function() {
    document.getElementById("saveDialog").close();
  });
  document.getElementById("uploadSuccessDialogClose").addEventListener('click', function() {
    document.getElementById("uploadSuccessDialog").close();
  });
  document.getElementById("showImageDialogClose").addEventListener('click', function() {
    document.getElementById("showImageDialog").close();
  });
};

$(document).ready(function() {
  trym2.getSelected = require('get-selected-text');

  var zoom = require('../src/frontend/zooming');
  zoom.attachZoomButtons("M2Out", "M2OutZoomIn", "M2OutResetZoom", "M2OutZoomOut");

  trym2.socket = io();

  trym2.socket.on('result', function(msg) {
    if (msg !== "") {
      $("#M2Out").trigger("onmessage", msg);
    }
  });

  attachTutorialNavBtnActions();
  attachMinMaxBtnActions();
  attachCtrlBtnActions();
  attachCloseDialogBtns();

  trym2.socket.on('serverDisconnect', function(msg) {
    console.log("We got disconnected. " + msg);
    $("#M2Out").trigger("onmessage", " Sorry, your session was disconnected by the server.\n\n");
    trym2.serverDisconnect = true;
  });
  trym2.socket.oldEmit = trym2.socket.emit;
  trym2.socket.emit = function(event, msg) {
    if (trym2.serverDisconnect) {
      var events = ['reset', 'input'];
      console.log("We are disconnected.");
      if (events.indexOf(event) !== -1) {
        trym2.socket.connect();
        trym2.serverDisconnect = false;
        trym2.socket.oldEmit(event, msg);
      }
    } else {
      trym2.socket.oldEmit(event, msg);
    }
  };

  trym2.socket.on('image', showImageDialog);

  trym2.socket.on('viewHelp', function(helpUrl) {
    if (helpUrl) {
      console.log("We got a viewHelp! " + helpUrl);
      window.open(helpUrl, "M2 Help");
    }
  });

  // Init procedures for right hand side.
  $("#M2Out").val("");

  var shellFunctions = {
    postMessage: trym2.postMessage,
    interrupt: function() {
      trym2.postMessage(ctrlc, true);
    }
  };
  shellTextArea.create($("#M2Out"), $("#M2In"), shellFunctions);

  // $("#navigation").children("input").attr("name", "navbutton");
  // $("#navigation").buttonset();
  // $(".buttonset").buttonset();

  // $("button").button();

  $('#M2In').val(DefaultText);
  $('#M2In').keypress(trym2.sendOnEnterCallback('M2In'));

  var siofu = new SocketIOFileUpload(trym2.socket);

  document.getElementById("uploadBtn").addEventListener('click', siofu.prompt, false);

  siofu.addEventListener("complete", showUploadSuccessDialog);

  siofu.addEventListener("complete", function(event) {
    console.log('we uploaded the file: ' + event.success);
    console.log(event.file);
  });

  $("#uptutorial").on('change', trym2.uploadTutorial);
  $(document).on("click", ".submenuItem", trym2.showLesson);

  var codeClickAction = function() {
    $(this).effect("highlight", {
      color: 'red'
    }, 300);
    var code = $(this).text();
    code += "\n";
    $("#M2In").val($("#M2In").val() + code);
    require('scroll-down')($("#M2In"));
    trym2.postMessage(code);
  };

  $(document).on("click", "code", codeClickAction);
  $(document).on("click", "codeblock", codeClickAction);

  $(document).on("click", ".tabPanelActivator", function(event) {
    var panelId = $(this).attr('href');
    // show tab panel
    document.getElementById(panelId).click();
    // close drawer menu
    document.body.querySelector('.mdl-layout__obfuscator.is-visible').click();
    // do not follow link
    event.preventDefault();
  });

  $(document).on("click", "#about", function(event) {
    document.getElementById("helpTitle").click();
    // show tab panel
    // do not follow link
    event.preventDefault();
  });

  trym2.importTutorials();
});
