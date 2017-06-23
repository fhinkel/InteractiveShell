// initialize with ID (string) of field that should act like a shell,
//  i.e., command history, taking input and replacing it with output from server

// historyArea is a div in which we save the command for future use
// shell functions for
// * postMessage2
// * interrupt
/* eslint-env browser */
/* eslint "max-len": "off" */
let keys = {
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
  ctrlc: "\x03",
};

import {Socket} from "./mathProgram";
let unicodeBell = "\u0007";
let setCaretPosition = require("set-caret-position");
let scrollDown = require("scroll-down");
let getSelected = require("get-selected-text");
let mathProgramOutput = "";
let cmdHistory: any = []; // History of commands for shell-like arrow navigation
cmdHistory.index = 0;

let postMessage2 = function(msg: string, socket: Socket) {
  socket.emit("input", msg);
  return true;
};

let interrupt = function(socket: Socket) {
  return function() {
    postMessage2(keys.ctrlc, socket);
  };
};

let sendCallback = function(id: string, socket: Socket) {
  return function() {
    const str = getSelected(id);
    postMessage2(str, socket);
    return false;
  };
};

let sendOnEnterCallback = function(id: string, socket: Socket, shell) {
  return function(e) {
    if (e.which === 13 && e.shiftKey) {
      e.preventDefault();
      // do not make a line break or remove selected text when sending
      const msg = getSelected(id);
      // We only trigger the innerTrack.
      shell.trigger("innerTrack", msg);
      postMessage2(msg, socket);
    }
  };
};

function stripInputPrompt(lastLine:string) {
  return lastLine.replace(/^i\d+\s*:/, "");
}

function stripSpacesAtBeginningOfLine(lastLine: string) {
  return lastLine.replace(/^\s*/, "");
}

function stripPrompt(lastLine: string) {
  const result = lastLine.replace(/^> /, "");
  return result.replace(/^\. /, "");
}

let getCurrentCommand = function(shell) : string {
  const completeText = shell.val().split("\n");
  let lastLine : string = completeText[completeText.length - 2];
    // Need to set prompt symbol somewhere else.
  lastLine = stripInputPrompt(lastLine);
  lastLine = stripSpacesAtBeginningOfLine(lastLine);
  lastLine = stripPrompt(lastLine);
  return lastLine;
};
 
let upDownArrowKeyHandling = function(shell, e: KeyboardEvent) {
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

let backspace = function(shell) {
  const completeText = shell.val();
  const before = completeText.substring(0, mathProgramOutput.length - 1);
  const after = completeText.substring(mathProgramOutput.length, completeText.length);
  mathProgramOutput = before;
  shell.val(before + after);
  scrollDown(shell);
};

module.exports = function() {
  const create = function(shell, historyArea, socket: Socket) {
    const history = historyArea;
    history.keypress(sendOnEnterCallback("M2In", socket, shell));

    shell.on("track", function(e, msg) { // add command to history
      if (typeof msg !== "undefined") {
        if (history !== undefined) {
          history.val(history.val() + msg + "\n");
          scrollDown(history);
        }
        shell.trigger("innerTrack", msg);
      }
    });

    shell.on("innerTrack", function(e, msg) {
        // This function will track the messages, i.e. such that arrow up and
        // down work, but it will not put the msg in the history textarea. We
        // need this if someone uses the shift+enter functionality in the
        // history area, because we do not want to track these messages.
      const input = msg.split("\n");
      for (const line in input) {
        if (input[line].length > 0) {
          cmdHistory.index = cmdHistory.push(input[line]);
        }
      }
    });

    const packageAndSendMessage = function(tail) {
      setCaretPosition(shell.attr("id"), shell.val().length);
      if (shell.val().length >= mathProgramOutput.length) {
        const l = shell.val().length;
        const msg = shell.val().substring(mathProgramOutput.length, l) + tail;
        postMessage2(msg, socket);
      } else {
        console.log("There must be an error.");
            // We don't want empty lines send to M2 at pressing return twice.
      }
    };

    // On pressing return send last part of M2Out to M2 and remove it.
    shell.keyup(function(e) {
      if (e.keyCode === keys.enter) { // Return
            // We trigger the track manually, since we might have used tab.
        shell.trigger("track", getCurrentCommand(shell));
            // Disable tracking of posted message.
        packageAndSendMessage("");
      }
    });

    // If something is entered, change to end of textarea, if at wrong position.
    shell.keydown(function(e: KeyboardEvent) {
      if (e.keyCode === keys.enter) {
        setCaretPosition(shell.attr("id"), shell.val().length);
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
      const pos = shell[0].selectionStart;
      if (pos < mathProgramOutput.length) {
        setCaretPosition(shell.attr("id"), shell.val().length);
      }
        // This deals with backspace.
        // If we start removing output, we have already received, then we need
        // to forward the backspace to M2. If backspacing is still allowed, we
        // will get a backspace back.
      if (e.keyCode === keys.backspace) {
        if (shell.val().length === mathProgramOutput.length) {
          packageAndSendMessage("\b");
          e.preventDefault();
        }
      }
        // Forward key for tab completion, but do not track it.
      if (e.keyCode === keys.tab) {
        packageAndSendMessage("\t");
        e.preventDefault();
      }
    });

    shell.on("onmessage", function(e, msgDirty) {
      if (msgDirty === unicodeBell) {
        return;
      }
        // If we get a 'Session resumed.' message, we check whether it is
        // relevant.
      if (msgDirty.indexOf("Session resumed.") > -1) {
        if (mathProgramOutput.length > 0) {
          return;
        }
      }
        // If we received a backspace, since backspacing was ok.
      if (msgDirty === "\b \b") {
        backspace(shell);
        return;
      }
      let msg : string = msgDirty.replace(/\u0007/, "");
      msg = msg.replace(/\r\n/g, "\n");
      msg = msg.replace(/\r/g, "\n");
      const completeText = shell.val();
      mathProgramOutput += msg;
      const after = completeText.substring(mathProgramOutput.length, completeText.length);
      let commonIndex = 0;
      while ((after[commonIndex] === msg[commonIndex]) && (commonIndex < after.length) && (commonIndex < msg.length)) {
        commonIndex++;
      }
      const nonReturnedInput = after.substring(commonIndex, after.length);
      shell.val(mathProgramOutput + nonReturnedInput);
      scrollDown(shell);
    });

    shell.on("reset", function() {
      shell.val(mathProgramOutput);
    });
  };

  return {
    create,
    postMessage2,
    sendCallback,
    interrupt,
  };
};
