// initialize with ID (string) of field that should act like a shell,
//  i.e., command history, taking input and replacing it with output from server

// historyArea is a div in which we save the command for future use
// shell functions for
// * postMessage
// * interrupt
/* global $ */
/* eslint-env browser */
/* eslint "max-len": "off" */
var keys = {
    // The keys 37, 38, 39 and 40 are the arrow keys.
  arrowUp: 38,
  arrowDown: 40,
  arrowLeft: 37,
  arrowRight: 39,
  cKey: 67,
  ctrlKeyCode: 17,
  metaKeyCodes: [224, 17, 91, 93],
  backspace: 8,
  tab: 9,
  enter: 13,
  ctrlc: "\x03"
};

var unicodeBell = '\u0007';
var setCaretPosition = require('set-caret-position');
var scrollDown = require('scroll-down');
var getSelected = require('get-selected-text');
var mathProgramOutput = "";
var cmdHistory = []; // History of commands for shell-like arrow navigation
cmdHistory.index = 0;

var postMessage = function(msg, notrack, socket) {
  socket.emit('input', msg);
  if (!notrack) {
    $("#M2Out").trigger("track", msg);
  }
  return true;
};

var interrupt = function(socket) {
  return function() {
    postMessage(keys.ctrlc, true, socket);
  };
};

var sendCallback = function(id, socket) {
  return function() {
    var str = getSelected(id);
    postMessage(str, false, socket);
    return false;
  };
};

var sendOnEnterCallback = function(id, socket) {
  return function(e) {
    if (e.which === 13 && e.shiftKey) {
      e.preventDefault();
      // do not make a line break or remove selected text when sending
      postMessage(getSelected(id), false, socket);
    }
  };
};

function stripInputPrompt(lastLine) {
  return lastLine.replace(/^i\d+\s*:/, "");
}

function stripSpacesAtBeginningOfLine(lastLine) {
  return lastLine.replace(/^\s*/, "");
}

function stripPrompt(lastLine) {
  return lastLine.replace(/^> /, "");
}

var getCurrentCommand = function(shell) {
  var completeText = shell.val().split("\n");
  var lastLine = completeText[completeText.length - 2];
    // Need to set prompt symbol somewhere else.
  lastLine = stripInputPrompt(lastLine);
  lastLine = stripSpacesAtBeginningOfLine(lastLine);
  lastLine = stripPrompt(lastLine);
  return lastLine;
};

var upDownArrowKeyHandling = function(shell, e) {
  e.preventDefault();
  if (cmdHistory.length === 0) {
        // Maybe we did nothing so far.
    return;
  }
  if ((e.keyCode === keys.arrowDown) && (cmdHistory.index < cmdHistory.length)) { // DOWN
    cmdHistory.index++;
  }
  if ((e.keyCode === keys.arrowUp) && (cmdHistory.index > 0)) { // UP
    if (cmdHistory.index === cmdHistory.length) {
      cmdHistory.current = shell.val().substring(mathProgramOutput.length, shell.val().length);
    }
    cmdHistory.index--;
  }
  if (cmdHistory.index === cmdHistory.length) {
    shell.val(shell.val().substring(0, mathProgramOutput.length) + cmdHistory.current);
  } else {
    shell.val(shell.val().substring(0, mathProgramOutput.length) + cmdHistory[cmdHistory.index]);
  }
  scrollDown(shell);
};

var backspace = function(shell) {
  var completeText = shell.val();
  var before = completeText.substring(0, mathProgramOutput.length - 1);
  var after = completeText.substring(mathProgramOutput.length, completeText.length);
  mathProgramOutput = before;
  shell.val(before + after);
  scrollDown(shell);
};

module.exports = function() {
  var create = function(shell, historyArea, socket) {
    var history = historyArea;
    historyArea.keypress(sendOnEnterCallback('M2In', socket));

    shell.on("track", function(e, msg) { // add command to history
      if (typeof msg !== 'undefined') {
        var input = msg.split("\n");
        for (var line in input) {
          if (input[line].length > 0) {
            cmdHistory.index = cmdHistory.push(input[line]);
          }
        }
      }
    });

    var packageAndSendMessage = function(tail, notrack) {
      setCaretPosition(shell.attr('id'), shell.val().length);
      if (shell.val().length >= mathProgramOutput.length) {
        var l = shell.val().length;
        var msg = shell.val().substring(mathProgramOutput.length, l) + tail;
        if (history !== undefined) {
          history.val(history.val() + msg);
          scrollDown(history);
        }
        postMessage(msg, notrack, socket);
      } else {
        console.log("There must be an error.");
            // We don't want empty lines send to M2 at pressing return twice.
      }
    };

    // On pressing return send last part of M2Out to M2 and remove it.
    shell.keyup(function(e) {
      if (e.keyCode === keys.enter) { // Return
            // We trigger the track manually, since we might have used tab.
        shell.trigger('track', getCurrentCommand(shell));
            // Disable tracking of posted message.
        packageAndSendMessage('', true);
      }
    });

    // If something is entered, change to end of textarea, if at wrong position.
    shell.keydown(function(e) {
      if (e.keyCode === keys.enter) {
        setCaretPosition(shell.attr('id'), shell.val().length);
      }

      if ((e.keyCode === keys.arrowUp) || (e.keyCode === keys.arrowDown)) {
        upDownArrowKeyHandling(shell, e);
      }
      if (e.keyCode === keys.ctrlKeyCode) { // do not jump to bottom on Ctrl+C or on Ctrl
        return;
      }
      if (e.ctrlKey && e.keyCode === keys.cKey) {
        interrupt(socket);
      }
        // for MAC OS
      if ((e.metaKey && e.keyCode === keys.cKey) || (keys.metaKeyCodes.indexOf(e.keyCode) > -1)) { // do not jump to bottom on Command+C or on Command
        return;
      }
      var pos = shell[0].selectionStart;
      if (pos < mathProgramOutput.length) {
        setCaretPosition(shell.attr('id'), shell.val().length);
      }
        // This deals with backspace.
        // If we start removing output, we have already received, then we need
        // to forward the backspace to M2. If backspacing is still allowed, we
        // will get a backspace back.
      if (e.keyCode === keys.backspace) {
        if (shell.val().length === mathProgramOutput.length) {
          packageAndSendMessage("\b", true);
          e.preventDefault();
        }
      }
        // Forward key for tab completion, but do not track it.
      if (e.keyCode === keys.tab) {
        packageAndSendMessage("\t", true);
        e.preventDefault();
      }
    });

    shell.on("onmessage", function(e, msgDirty) {
      if (msgDirty === unicodeBell) {
        return;
      }
        // If we get a 'Session resumed.' message, we check whether it is
        // relevant.
      if (msgDirty.indexOf('Session resumed.') > -1) {
        if (mathProgramOutput.length > 0) {
          return;
        }
      }
        // If we received a backspace, since backspacing was ok.
      if (msgDirty === "\b \b") {
        backspace(shell);
        return;
      }
      var msg = msgDirty.replace(/\u0007/, "");
      msg = msg.replace(/\r\n/g, "\n");
      msg = msg.replace(/\r/g, "\n");
      var completeText = shell.val();
      mathProgramOutput += msg;
      var after = completeText.substring(mathProgramOutput.length, completeText.length);
      var commonIndex = 0;
      while ((after[commonIndex] === msg[commonIndex]) && (commonIndex < after.length) && (commonIndex < msg.length)) {
        commonIndex++;
      }
      var nonReturnedInput = after.substring(commonIndex, after.length);
      shell.val(mathProgramOutput + nonReturnedInput);
      scrollDown(shell);
    });

    shell.on("reset", function() {
      shell.val(mathProgramOutput);
    });
  };

  return {
    create: create,
    postMessage: postMessage,
    sendCallback: sendCallback,
    interrupt: interrupt
  };
};
