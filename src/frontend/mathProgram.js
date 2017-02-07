/* global io, SocketIOFileUpload, mathProgramName, DefaultText */
/* eslint-env browser */

var socket = null;
var serverDisconnect = false;
var dialogPolyfill = require('dialog-polyfill');
var shell = require('./shell-emulator')();
var $ = require('jquery');

var saveInteractions = function() {
  var input = $("#M2In");
  var output = $("#M2Out");
  var dialog = document.querySelector('#saveDialog');
  var inputLink = 'data:application/octet-stream,' +
      encodeURIComponent(input.val());
  var inputParagraph = document.getElementById("inputContent");
  inputParagraph.setAttribute('href', inputLink);
  inputParagraph.setAttribute('download', 'input.txt');
  var outputLink = 'data:application/octet-stream,' +
      encodeURIComponent(output.val());
  var outputParagraph = document.getElementById("outputContent");
  outputParagraph.setAttribute('href', outputLink);
  outputParagraph.setAttribute('download', 'output.txt');
  if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog);
  }
  dialog.showModal();
};

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

var attachTutorialNavBtnActions = function(switchLesson) {
  $("#previousBtn").click(function() {
    switchLesson(-1);
  });

  $("#nextBtn").click(function() {
    switchLesson(1);
  });
};

var emitReset = function() {
  $("#M2Out").trigger("reset");
  socket.emit('reset');
};

var attachCtrlBtnActions = function() {
  $("#sendBtn").click(shell.sendCallback('M2In', socket));
  $("#resetBtn").click(emitReset);
  $("#interruptBtn").click(shell.interrupt(socket));
  $("#saveBtn").click(saveInteractions);
};

var showUploadSuccessDialog = function(event) {
  var dialog = document.getElementById("uploadSuccessDialog");
  if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog);
  }
  // console.log('we uploaded the file: ' + event.success);
  // console.log(event.file);
  var filename = event.file.name;
  // console.log("File uploaded successfully!" + filename);
  var successSentence = filename +
      " has been uploaded and you can use it by loading it into your " +
      mathProgramName + " session (use the input terminal).";
  document.getElementById("uploadSuccessDialogContent").innerText =
      successSentence;
  dialog.showModal();
};

var showImageDialog = function(imageUrl) {
  if (imageUrl) {
    var dialog = document.getElementById("showImageDialog");
    if (!dialog.showModal) {
      dialogPolyfill.registerDialog(dialog);
    }
    // console.log("We received an image: " + imageUrl);
    var btn = document.getElementById("showImageDialogBtn");
    // Get rid of old click event listeners.
    var btnClone = btn.cloneNode(true);
    var content = document.getElementById("showImageDialogContent");
    content.innerText = "";
    content.appendChild(btnClone);
    btnClone.addEventListener("click", function() {
      window.open(imageUrl, '_blank',
          'height=200,width=200,toolbar=0,location=0,menubar=0');
      dialog.close();
    });
    content.appendChild(document.createTextNode(imageUrl.split('/').pop()));
    dialog.showModal();
  }
};

var attachCloseDialogBtns = function() {
  document.getElementById("saveDialogClose").addEventListener('click',
      function() {
        document.getElementById("saveDialog").close();
      });
  document.getElementById("uploadSuccessDialogClose").addEventListener('click',
      function() {
        document.getElementById("uploadSuccessDialog").close();
      });
  document.getElementById("showImageDialogClose").addEventListener('click',
      function() {
        document.getElementById("showImageDialog").close();
      });
};

var socketOnDisconnect = function(msg) {
  console.log("We got disconnected. " + msg);
  $("#M2Out").trigger("onmessage", " Sorry, your session was disconnected" +
      " by the server.\n\nPlease refresh to reconnect.\n\n");
  serverDisconnect = true;
  // Could use the following to automatically reload. Probably too invasive,
  // might kill results.
  // location.reload();
};

var wrapEmitForDisconnect = function(event, msg) {
  if (serverDisconnect) {
    var events = ['reset', 'input'];
    console.log("We are disconnected.");
    if (events.indexOf(event) !== -1) {
      socket.connect({reconnectionAttempts: 5});
      serverDisconnect = false;
      socket.oldEmit(event, msg);
    }
  } else {
    socket.oldEmit(event, msg);
  }
};

var displayUrlInNewWindow = function(url) {
  if (url) {
    window.open(url, "M2 Help");
  }
};

var codeClickAction = function() {
  $(this).addClass("redWithShortTransition");
  var code = $(this).text();
  code += "\n";
  $("#M2In").val($("#M2In").val() + code);
  require('scroll-down')($("#M2In"));
  shell.postMessage(code, false, socket);
};

var openTabCloseDrawer = function(event) {
  var panelId = $(this).attr('href');
  // show tab panel
  document.getElementById(panelId).click();
  // close drawer menu
  document.body.querySelector('.mdl-layout__obfuscator.is-visible').click();
  // do not follow link
  event.preventDefault();
};

var openAboutTab = function(event) {
  // show tab panel
  document.getElementById("helpTitle").click();
  // do not follow link
  event.preventDefault();
};

var socketOnMessage = function(msg) {
  if (msg !== "") {
    $("#M2Out").trigger("onmessage", msg);
  }
};

var socketOnError = function(error) {
  console.log("We got an error. " + error);
};

var fadeBackToOriginalColor = function() {
  $(this).removeClass("redWithShortTransition");
};

var init = function() {
  var zoom = require('./zooming');
  zoom.attachZoomButtons("M2Out", "M2OutZoomIn", "M2OutResetZoom",
      "M2OutZoomOut");

  socket = io();
  console.log("Connection attempts: " + socket.reconnectionAttempts);
  socket.on('reconnect_failed', socketOnError);
  socket.on('reconnect_error', socketOnError);
  socket.on('connect_error', socketOnError);
  socket.on('result', socketOnMessage);
  socket.on('disconnect', socketOnDisconnect);
  socket.oldEmit = socket.emit;
  socket.emit = wrapEmitForDisconnect;
  socket.on('image', showImageDialog);
  socket.on('viewHelp', displayUrlInNewWindow);

  var tutorialManager = require('./tutorials')();
  var fetchTutorials = require('./fetchTutorials');
  fetchTutorials(tutorialManager.makeTutorialsList);
  $("#uptutorial").on('change', tutorialManager.uploadTutorial);
  $(document).on("click", ".submenuItem", tutorialManager.showLesson);

  attachTutorialNavBtnActions(tutorialManager.switchLesson);
  attachMinMaxBtnActions();
  attachCtrlBtnActions();
  attachCloseDialogBtns();

  $("#M2Out").val("");
  $('#M2In').val(DefaultText);

  shell.create($("#M2Out"), $("#M2In"), socket);

  var siofu = new SocketIOFileUpload(socket);
  document.getElementById("uploadBtn").addEventListener('click', siofu.prompt,
      false);
  siofu.addEventListener("complete", showUploadSuccessDialog);

  $(document).on("click", "code", codeClickAction);
  $(document).on("click", "codeblock", codeClickAction);
  $(document).on("click", ".tabPanelActivator", openTabCloseDrawer);
  $(document).on("click", "#about", openAboutTab);

  $(document).on("transitionend", "code.redWithShortTransition",
      fadeBackToOriginalColor);
  $(document).on("transitionend", "codeblock.redWithShortTransition",
      fadeBackToOriginalColor);
};

module.exports = function() {
  init();
};
