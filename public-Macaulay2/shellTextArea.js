console.log("1: Loading shell.");
// initialize with ID (string) of field that should act like a shell,
//  i.e., command history, taking input and replacing it with output from server
var shellObject = function(shellArea, historyArea, shellFunctions) {
    console.log("2: Loading shell.");
    var keys = {
        arrowUp: 38,
        arrowDown: 40,
        arrowLeft: 37,
        arrowRight: 39,
        cKey: 67,
        ctrlKeyCode: 17,
        metaKeyCodes: [224, 17, 91, 93],
        backspace: 8,
        tab: 9,
        enter: 13
    }
    
    var unicodeBell = '\u0007';
    var setCaretPosition = shellFunctions['setCaretPosition'];
    var postMessage = shellFunctions['postMessage'];
    var scrollDown = shellFunctions['scrollDown'];
    var interrupt = shellFunctions['interrupt'];
    var tabPress = shellFunctions['tabPress'];
    var mathProgramOutput = "";
    var shell = shellArea;
    var history = historyArea;
    var cmdHistory = []; // History of M2 commands for shell-like arrow navigation
    cmdHistory.index = 0;
    
    shell.on("track", function(e) { // add command to history
        msg = getCurrentCommand();
        if (typeof msg != 'undefined') {
            if (msg.length > 0) {
                // console.log("Line: " + input[line]);
                cmdHistory.index = cmdHistory.push(msg);
            }
        }
    });

    var getCurrentCommand = function(){
        var completeText = shell.val().split("\n");
        console.log(completeText);
        var lastLine = completeText[completeText.length-2];
        lastLine = lastLine.replace(/^i\d+\s*:/,"");
        lastLine = lastLine.replace(/^\s*/,"");
        console.log("Last line is: " + lastLine);
        return lastLine;
    };

    // On pressing return send last part of M2Out to M2 and remove it.
    shell.keyup(function(e) {
        var l, msg, input;
        if (e.keyCode == keys.enter) { // Return
            packageAndSendMessage('');
        }
    });

    var packageAndSendMessage = function(tail, notrack){
        setCaretPosition(shell, shell.val().length);
        if (shell.val().length >= mathProgramOutput.length) {
            l = shell.val().length;
            msg = shell.val().substring(mathProgramOutput.length, l) + tail;
            // console.log("Sending message: " + msg);
            if(history != undefined){
               history.val(history.val() + msg);
               scrollDown(history);
            }
            postMessage(msg, notrack);
        } else {
            console.log("There must be an error.");
            // We don't want empty lines send to M2 at pressing return twice.
            //e.preventDefault();
        }
    }

    shell.keypress(function(e){
        if(e.keyCode == keys.tab){
            packageAndSendMessage("\t", true);
            e.preventDefault();
        }
    });

    var upDownArrowKeyHandling = function(e){
        if ((e.keyCode == keys.arrowDown) && (cmdHistory.index < cmdHistory.length)) { // DOWN
            cmdHistory.index++;
        }
        if ((e.keyCode == keys.arrowUp) && (cmdHistory.index > 0)) { // UP
            if (cmdHistory.index == cmdHistory.length) {
                cmdHistory.current = shell.val().substring(mathProgramOutput.length, shell.val().length);
            }
            cmdHistory.index--;
        }
        if (cmdHistory.index == cmdHistory.length) {
            shell.val(shell.val().substring(0, mathProgramOutput.length) + cmdHistory.current);
        } else {
            shell.val(shell.val().substring(0, mathProgramOutput.length) + cmdHistory[cmdHistory.index]);
        }
        scrollDown(shell);
        e.preventDefault();
    };

    // If something is entered, change to end of textarea, if at wrong position.
    shell.keydown(function(e) {
        // The keys 37, 38, 39 and 40 are the arrow keys.
        if (e.keyCode == keys.enter){
            setCaretPosition(shell, shell.val().length);
        }
        
        if ((e.keyCode == keys.arrowUp) || (e.keyCode == keys.arrowDown)) {
            upDownArrowKeyHandling(e);
            // console.log("Arrow key.");
        }
        if (e.keyCode == keys.ctrlKeyCode) { // do not jump to bottom on Ctrl+C or on Ctrl
            return;
        }
        if (e.ctrlKey && e.keyCode == keys.cKey){
            interrupt();
        }
        // for MAC OS
        if ((e.metaKey && e.keyCode == keys.cKey) || (keys.metaKeyCodes.indexOf(e.keyCode) > -
            1)) { // do not jump to bottom on Command+C or on Command
            return;
        }
        var pos = shell[0].selectionStart;
        if (pos < mathProgramOutput.length) {
            //console.log(pos + " Moving to end."); 
            setCaretPosition(shell, shell.val().length);
        }
        // This deals with backspace.
        // We may not shorten the string entered by M2.
        if (e.keyCode == keys.backspace) {
            if (shell.val().length == mathProgramOutput.length) {
                e.preventDefault();
            }
        }
        //if (e.keyCode == keys.tab) {
        //    e.preventDefault();
            // Do something for tab-completion.
        //}
    });

    shell.on("onmessage", function(e, msgDirty) {
        console.log("Dirty JSON message: " + JSON.stringify(msgDirty));
        if(msgDirty == unicodeBell){
            return;
        }
        var msg = msgDirty.replace(/\u0007/,"");
        msg = msg.replace(/\r\n/g,"\n");
        msg = msg.replace(/\r/g,"\n");
        var completeText = shell.val();
        mathProgramOutput += msg;
        var before = completeText.substring(0, mathProgramOutput.length),
            after = completeText.substring(mathProgramOutput.length, completeText.length);
        var commonIndex = 0;
        while((after[commonIndex] == msg[commonIndex]) && (commonIndex < after.length) && (commonIndex < msg.length)){
            commonIndex++;
        }
        var nonReturnedInput = after.substring(commonIndex, after.length);
        shell.val(mathProgramOutput + nonReturnedInput);
        scrollDown(shell);
    });

    shell.on("reset", function(e){
       console.log("Received reset event.");
       shell.val(mathProgramOutput);
    });
};

