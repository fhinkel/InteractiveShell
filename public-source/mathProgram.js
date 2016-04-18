/* global $, MathJax, io, SocketIOFileUpload, mathProgramName, tutorialFunctions, DefaultText */
/* eslint-env browser */
/* eslint "max-len": "off" */
/* eslint "new-cap": "off" */

var trym2 = {
  firstLoadFlag: true, // true until we show tutorial for the first time. Needed because we need to load lesson 0
  MAXFILESIZE: 500000, // max size in bytes for file uploads
  socket: null,
  serverDisconnect: false
};

var ctrlc = "\x03";

var dialogPolyfill = require('dialog-polyfill');

var shellTextArea = require('shell-emulator');




trym2.postMessage = function(msg, notrack) {
  // console.log("Posting msg " + msg);
  trym2.socket.emit('input', msg);
  if (!notrack) {
// Closure to capture the file information.
    $("#M2Out").trigger("track", msg);
    // console.log("Tracking.");
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
  document.getElementById("uploadSuccessDialogContent").innerText = successSentence;
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
  var tutorialManager = require('../src/frontend/tutorials.js')();
    var tf = tutorialFunctions(tutorialManager.makeAccordion, tutorialManager.tutorials);
  tf.importTutorials();

    var uploadAction = tutorialManager.uploadTutorial(tf.insertDeleteButtonAtLastTutorial, tf.populateTutorialElement);
  $("#uptutorial").on('change', uploadAction);
  $(document).on("click", ".submenuItem", tutorialManager.showLesson);
  
  attachTutorialNavBtnActions(tutorialManager.switchLesson);
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
      // console.log("We got a viewHelp! " + helpUrl);
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

  $('#M2In').val(DefaultText);
  $('#M2In').keypress(trym2.sendOnEnterCallback('M2In'));

  var siofu = new SocketIOFileUpload(trym2.socket);

  document.getElementById("uploadBtn").addEventListener('click', siofu.prompt, false);

  siofu.addEventListener("complete", showUploadSuccessDialog);

  siofu.addEventListener("complete", function(event) {
    console.log('we uploaded the file: ' + event.success);
    // console.log(event.file);
  });


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

});
