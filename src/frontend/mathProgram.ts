/* global io, SocketIOFileUpload, mathProgramName, DefaultText */
/* eslint-env browser */

declare var mathProgramName: string;
declare var DefaultText: string;
declare var io: any;

let socket = null;
let serverDisconnect = false;
let dialogPolyfill = require("dialog-polyfill");
let shell = require("./shell-emulator")();
let $ = require("jquery");

let saveInteractions = function() {
  const input = $("#M2In");
  const output = $("#M2Out");
  const dialog: any = document.querySelector("#saveDialog");
  const inputLink = "data:application/octet-stream," +
      encodeURIComponent(input.val());
  const inputParagraph = document.getElementById("inputContent");
  inputParagraph.setAttribute("href", inputLink);
  inputParagraph.setAttribute("download", "input.txt");
  const outputLink = "data:application/octet-stream," +
      encodeURIComponent(output.val());
  const outputParagraph = document.getElementById("outputContent");
  outputParagraph.setAttribute("href", outputLink);
  outputParagraph.setAttribute("download", "output.txt");
  if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog);
  }
  dialog.showModal();
};

let attachMinMaxBtnActions = function() {
  const maximize = document.getElementById("maximizeOutput");
  const downsize = document.getElementById("downsizeOutput");
  const zoomBtns = document.getElementById("M2OutZoomBtns");
  maximize.addEventListener("click", function() {
    const dialog: any = document.getElementById("fullScreenOutput");
    const maxCtrl = document.getElementById("M2OutCtrlBtnsMax");
    if (!dialog.showModal) {
      dialogPolyfill.registerDialog(dialog);
    }
    const output = document.getElementById("M2Out");
    dialog.appendChild(output);
    maxCtrl.insertBefore(zoomBtns, downsize);
    dialog.showModal();
  });
  downsize.addEventListener("click", function() {
    const dialog: any = document.getElementById("fullScreenOutput");
    const oldPosition = document.getElementById("right-half");
    const output = document.getElementById("M2Out");
    const ctrl = document.getElementById("M2OutCtrlBtns");
    oldPosition.appendChild(output);
    ctrl.insertBefore(zoomBtns, maximize);
    dialog.close();
  });
};

let attachTutorialNavBtnActions = function(switchLesson) {
  $("#previousBtn").click(function() {
    switchLesson(-1);
  });

  $("#nextBtn").click(function() {
    switchLesson(1);
  });
};

let emitReset = function() {
  $("#M2Out").trigger("reset");
  socket.emit("reset");
};

let attachCtrlBtnActions = function() {
  $("#sendBtn").click(shell.sendCallback("M2In", socket));
  $("#resetBtn").click(emitReset);
  $("#interruptBtn").click(shell.interrupt(socket));
  $("#saveBtn").click(saveInteractions);
};

let showUploadSuccessDialog = function(event) {
  const dialog: any = document.getElementById("uploadSuccessDialog");
  if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog);
  }
  // console.log('we uploaded the file: ' + event.success);
  // console.log(event.file);
  const filename = event.file.name;
  // console.log("File uploaded successfully!" + filename);
  const successSentence = filename +
      " has been uploaded and you can use it by loading it into your " +
      mathProgramName + " session (use the input terminal).";
  document.getElementById("uploadSuccessDialogContent").innerText =
      successSentence;
  dialog.showModal();
};

let showImageDialog = function(imageUrl) {
  if (imageUrl) {
    const dialog: any = document.getElementById("showImageDialog");
    if (!dialog.showModal) {
      dialogPolyfill.registerDialog(dialog);
    }
    // console.log("We received an image: " + imageUrl);
    const btn = document.getElementById("showImageDialogBtn");
    // Get rid of old click event listeners.
    const btnClone = btn.cloneNode(true);
    const content = document.getElementById("showImageDialogContent");
    content.innerText = "";
    content.appendChild(btnClone);
    btnClone.addEventListener("click", function() {
      window.open(imageUrl, "_blank",
          "height=200,width=200,toolbar=0,location=0,menubar=0");
      dialog.close();
    });
    content.appendChild(document.createTextNode(imageUrl.split("/").pop()));
    dialog.showModal();
  }
};

let attachCloseDialogBtns = function() {
  document.getElementById("saveDialogClose").addEventListener("click",
      function() {
          (document.getElementById("saveDialog") as any).close();
      });
  document.getElementById("uploadSuccessDialogClose").addEventListener("click",
      function() {
          (document.getElementById("uploadSuccessDialog") as any).close();
      });
  document.getElementById("showImageDialogClose").addEventListener("click",
      function() {
          (document.getElementById("showImageDialog") as any).close();
      });
};

let socketOnDisconnect = function(msg) {
  console.log("We got disconnected. " + msg);
  $("#M2Out").trigger("onmessage", " Sorry, your session was disconnected" +
      " by the server.\n\nPlease click the reset button to reconnect.\n\n");
  serverDisconnect = true;
  // Could use the following to automatically reload. Probably too invasive,
  // might kill results.
  // location.reload();
};

let wrapEmitForDisconnect = function(event, msg) {
  if (serverDisconnect) {
    const events = ["reset", "input"];
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

let displayUrlInNewWindow = function(url) {
  if (url) {
    window.open(url, "M2 Help");
  }
};

let codeClickAction = function() {
  $(this).addClass("redWithShortTransition");
  let code = $(this).text();
  code += "\n";
  $("#M2In").val($("#M2In").val() + code);
  require("scroll-down")($("#M2In"));
  shell.postMessage2(code, socket);
};

let openTabCloseDrawer = function(event) {
  const panelId = $(this).attr("href");
  // show tab panel
  document.getElementById(panelId).click();
  // close drawer menu
  (document.body.querySelector(".mdl-layout__obfuscator.is-visible") as any).click();
  // do not follow link
  event.preventDefault();
};

let openAboutTab = function(event) {
  // show tab panel
  document.getElementById("helpTitle").click();
  // do not follow link
  event.preventDefault();
};

let socketOnMessage = function(msg) {
  if (msg !== "") {
    $("#M2Out").trigger("onmessage", msg);
  }
};

let socketOnError = function(type) {
  return function(error) {
    console.log("We got an " + type + " error. " + error);
    serverDisconnect = true;
  };
};

let fadeBackToOriginalColor = function() {
  $(this).removeClass("redWithShortTransition");
};

let init = function() {
  const zoom = require("./zooming");
  zoom.attachZoomButtons("M2Out", "M2OutZoomIn", "M2OutResetZoom",
      "M2OutZoomOut");

  socket = io();
  console.log("Connection attempts: " + socket.reconnectionAttempts);
  socket.on("reconnect_failed", socketOnError("reconnect_fail"));
  socket.on("reconnect_error", socketOnError("reconnect_error"));
  socket.on("connect_error", socketOnError("connect_error"));
  socket.on("result", socketOnMessage);
  socket.on("disconnect", socketOnDisconnect);
  socket.oldEmit = socket.emit;
  socket.emit = wrapEmitForDisconnect;
  socket.on("image", showImageDialog);
  socket.on("viewHelp", displayUrlInNewWindow);

  const tutorialManager = require("./tutorials")();
  const fetchTutorials = require("./fetchTutorials");
  fetchTutorials(tutorialManager.makeTutorialsList);
  $("#uptutorial").on("change", tutorialManager.uploadTutorial);
  $(document).on("click", ".submenuItem", tutorialManager.showLesson);

  attachTutorialNavBtnActions(tutorialManager.switchLesson);
  attachMinMaxBtnActions();
  attachCtrlBtnActions();
  attachCloseDialogBtns();

  $("#M2Out").val("");
  $("#M2In").val(DefaultText);

  shell.create($("#M2Out"), $("#M2In"), socket);

  const siofu = new SocketIOFileUpload(socket);
  document.getElementById("uploadBtn").addEventListener("click", siofu.prompt,
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
