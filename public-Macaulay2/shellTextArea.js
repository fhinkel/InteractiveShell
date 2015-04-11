console.log("1: Loading shell.");
// initialize with ID (string) of field that should act like a shell,
//  i.e., command history, taking input and replacing it with output from server
var shellObject = function(shellArea, historyArea, shellFunctions) {
    console.log("2: Loading shell.");
    var setCaretPosition = shellFunctions['setCaretPosition'];
    var postMessage = shellFunctions['postMessage'];
    var scrollDown = shellFunctions['scrollDown'];
    var mathProgramOutput = "";
    var shell = shellArea;
    var history = historyArea;
    var cmdHistory = []; // History of M2 commands for shell-like arrow navigation
    cmdHistory.index = 0;
    shell.on("track", function(e, msg) { // add command to history
        if (typeof msg != 'undefined') {
            input = msg.split("\n");
            for (var line in input) {
                if (input[line].length > 0) {
                    // console.log("Line: " + input[line]);
                    cmdHistory.index = cmdHistory.push(input[line]);
                }
            }
        }

    });

    // On pressing return send last part of M2Out to M2 and remove it.
    shell.keyup(function(e) {
        var l, msg, input;
        if (e.keyCode == 13) { // Return
            setCaretPosition(shell, shell.val().length);
            if (shell.val().length > mathProgramOutput.length) {
                l = shell.val().length;
                msg = shell.val().substring(mathProgramOutput.length, l);
                // console.log("Sending message: " + msg);
                if(history != undefined){
                   history.val(history.val() + msg);
                   scrollDown(history);
                }
                postMessage(msg)();
            } else {
                console.log("There must be an error.");
                // We don't want empty lines send to M2 at pressing return twice.
                //e.preventDefault();
            }
        }
    });

    // If something is entered, change to end of textarea, if at wrong position.
    shell.keydown(function(e) {
        // The keys 37, 38, 39 and 40 are the arrow keys.
        var arrowUp = 38;
        var arrowDown = 40;
        var arrowLeft = 37;
        var arrowRight = 39;
        var cKey = 67;
        var ctrlKeyCode = 17;
        var metaKeyCodes = [224, 17, 91, 93];
        var backspace = 8;
        var tab = 9;
        if ((e.keyCode > arrowDown) || (e.keyCode < arrowLeft)) { //  we did not receive an arrow key
            if ((e.ctrlKey && e.keyCode == cKey) || e.keyCode == ctrlKeyCode) { // do not jump to bottom on Ctrl+C or on Ctrl
                return;
            }

            // for MAC OS
            if ((e.metaKey && e.keyCode == cKey) || (metaKeyCodes.indexOf(e.keyCode) > -
                1)) { // do not jump to bottom on Command+C or on Command
                return;
            }

            // we need to move cursor to end of input
            var pos = shell[0].selectionStart;
            if (pos < mathProgramOutput.length) {
                //console.log(pos + " Moving to end."); 
                setCaretPosition(shell, shell.val().length);
            }
        } else if ((e.keyCode == arrowUp) || (e.keyCode == arrowDown)) {
            // console.log("Arrow key.");
            if ((e.keyCode == arrowDown) && (cmdHistory.index < cmdHistory.length)) { // DOWN
                cmdHistory.index++;
            }
            if ((e.keyCode == arrowUp) && (cmdHistory.index > 0)) { // UP
                if (cmdHistory.index == cmdHistory.length) {
                    cmdHistory.current = shell.val().substring(mathProgramOutput.length, $(
                        shell).val().length);
                }
                cmdHistory.index--;
            }
            if (cmdHistory.index == cmdHistory.length) {
                shell.val(shell.val().substring(0, mathProgramOutput.length) + cmdHistory
                    .current);
            } else {
                shell.val(shell.val().substring(0, mathProgramOutput.length) + cmdHistory[
                    cmdHistory.index]);
            }
            scrollDown(shell);
            e.preventDefault();
        }
        // This deals with backspace.
        // We may not shorten the string entered by M2.
        if (e.keyCode == backspace) {
            if (shell.val().length == mathProgramOutput.length) {
                e.preventDefault();
            }
        }
        if (e.keyCode == tab) {
            e.preventDefault();
            // Do something for tab-completion.
        }
    });

    shell.on("onmessage", function(e, msgDirty) {
        // console.log("Dirty msg: " + JSON.stringify(msgDirty));
        var msg = msgDirty.replace(/\r\n/g,"\n");
        msg = msg.replace(/\r/g,"\n");
        // console.log("Msg after replace: " + msg);
        var completeText = shell.val();
        mathProgramOutput += msg;
        // console.log(completeText + "\n vs \n" + mathProgramOutput);
        var before = completeText.substring(0, mathProgramOutput.length),
            after = completeText.substring(mathProgramOutput.length, completeText.length);
        var commonIndex = 0;
        // console.log(after[commonIndex] + " -- " + msg[commonIndex] + " gives " + (after[commonIndex] == msg[commonIndex]));
        while((after[commonIndex] == msg[commonIndex]) && (commonIndex < after.length) && (commonIndex < msg.length)){
            commonIndex++;
        }
        //console.log("Crucial: " + after[3] + " vs " + msg[3]);
        // console.log(commonIndex + " Common is: " + after.substring(0, commonIndex) + " - " + msg.substring(0, commonIndex));
        var nonReturnedInput = after.substring(commonIndex, after.length);
        //console.log("The non-returned after is: " + nonReturnedInput);
        //console.log("mathProgramOutput is " + mathProgramOutput);
        shell.val(mathProgramOutput + nonReturnedInput);
        scrollDown(shell);
    });

    shell.on("reset", function(e){
       console.log("Received reset event.");
       shell.val(mathProgramOutput);
    });
};

