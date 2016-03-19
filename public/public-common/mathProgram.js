(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// initialize with ID (string) of field that should act like a shell,
//  i.e., command history, taking input and replacing it with output from server

// historyArea is a div in which we save the command for future use
// shell functions for 
// * setCaretPosition
// * postMessage 
// * scrollDown
// * interrupt

exports.create = function (shellArea, historyArea, shellFunctions) {
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
        enter: 13
    };

    var unicodeBell = '\u0007';

    var setCaretPosition = shellFunctions['setCaretPosition'];
    var postMessage = shellFunctions['postMessage'];
    var scrollDown = shellFunctions['scrollDown'];
    var interrupt = shellFunctions['interrupt'];

    var mathProgramOutput = "";
    var shell = shellArea;
    var history = historyArea;
    var cmdHistory = []; // History of commands for shell-like arrow navigation
    cmdHistory.index = 0;


    shell.on("track", function (e, msg) { // add command to history
        if (typeof msg != 'undefined') {
            var input = msg.split("\n");
            for (var line in input) {
                if (input[line].length > 0) {
                    cmdHistory.index = cmdHistory.push(input[line]);
                }
            }
        }
    });


    function stripInputPrompt(lastLine) {
        return lastLine.replace(/^i\d+\s*:/, "");
    }

    function stripSpacesAtBeginningOfLine(lastLine) {
        return lastLine.replace(/^\s*/, "");
    }

    function stripPrompt(lastLine) {
        return lastLine.replace(/^> /, "");
    }

    var getCurrentCommand = function () {
        var completeText = shell.val().split("\n");
        var lastLine = completeText[completeText.length - 2];
        // Need to set prompt symbol somewhere else.
        lastLine = stripInputPrompt(lastLine);
        lastLine = stripSpacesAtBeginningOfLine(lastLine);
        lastLine = stripPrompt(lastLine);
        return lastLine;
    };

    // On pressing return send last part of M2Out to M2 and remove it.
    shell.keyup(function (e) {
        if (e.keyCode == keys.enter) { // Return
            // We trigger the track manually, since we might have used tab.
            shell.trigger('track', getCurrentCommand());
            // Disable tracking of posted message.
            packageAndSendMessage('', true);
        }
    });

    var packageAndSendMessage = function (tail, notrack) {
        setCaretPosition(shell, shell.val().length);
        if (shell.val().length >= mathProgramOutput.length) {
            l = shell.val().length;
            msg = shell.val().substring(mathProgramOutput.length, l) + tail;
            if (history != undefined) {
                history.val(history.val() + msg);
                scrollDown(history);
            }
            postMessage(msg, notrack);
        } else {
            console.log("There must be an error.");
            // We don't want empty lines send to M2 at pressing return twice.
        }
    };


    var upDownArrowKeyHandling = function (e) {
        e.preventDefault();
        if (cmdHistory.length == 0) {
            // Maybe we did nothing so far.
            return;
        }
        if ((e.keyCode == keys.arrowDown) && (cmdHistory.index < cmdHistory.length)) { // DOWN
            cmdHistory.index = cmdHistory.index + 1;
        }
        if ((e.keyCode == keys.arrowUp) && (cmdHistory.index > 0)) { // UP
            if (cmdHistory.index == cmdHistory.length) {
                cmdHistory.current = shell.val().substring(mathProgramOutput.length, shell.val().length);
            }
            cmdHistory.index = cmdHistory.index - 1;
        }
        if (cmdHistory.index == cmdHistory.length) {
            shell.val(shell.val().substring(0, mathProgramOutput.length) + cmdHistory.current);
        } else {
            shell.val(shell.val().substring(0, mathProgramOutput.length) + cmdHistory[cmdHistory.index]);
        }
        scrollDown(shell);
    };

    // If something is entered, change to end of textarea, if at wrong position.
    shell.keydown(function (e) {
        if (e.keyCode == keys.enter) {
            setCaretPosition(shell, shell.val().length);
        }

        if ((e.keyCode == keys.arrowUp) || (e.keyCode == keys.arrowDown)) {
            upDownArrowKeyHandling(e);
        }
        if (e.keyCode == keys.ctrlKeyCode) { // do not jump to bottom on Ctrl+C or on Ctrl
            return;
        }
        if (e.ctrlKey && e.keyCode == keys.cKey) {
            interrupt();
        }
        // for MAC OS
        if ((e.metaKey && e.keyCode == keys.cKey) || (keys.metaKeyCodes.indexOf(e.keyCode) > -
                1)) { // do not jump to bottom on Command+C or on Command
            return;
        }
        var pos = shell[0].selectionStart;
        if (pos < mathProgramOutput.length) {
            setCaretPosition(shell, shell.val().length);
        }
        // This deals with backspace.
        // We may not shorten the string entered by M2.
        if (e.keyCode == keys.backspace) {
            if (shell.val().length == mathProgramOutput.length) {
                packageAndSendMessage("\b", true);
                e.preventDefault();
            }
        }
        // Forward key for tab completion, but do not track it.
        if (e.keyCode == keys.tab) {
            packageAndSendMessage("\t", true);
            e.preventDefault();
        }
    });

    shell.on("onmessage", function (e, msgDirty) {
        if (msgDirty == unicodeBell) {
            return;
        }
        // If we get a 'Session resumed.' message, we check whether it is
        // relevant.
        if(msgDirty.indexOf('Session resumed.') > -1){
            if(mathProgramOutput.length > 0){
                return;
            }
        }
        // If we received a backspace.
        if(msgDirty == "\b \b"){
            backspace();
            return;
        }
        var msg = msgDirty.replace(/\u0007/,"");
        msg = msg.replace(/\r\n/g,"\n");
        msg = msg.replace(/\r/g,"\n");
        var completeText = shell.val();
        mathProgramOutput += msg;
        var after = completeText.substring(mathProgramOutput.length, completeText.length);
        var commonIndex = 0;
        while ((after[commonIndex] == msg[commonIndex]) && (commonIndex < after.length) && (commonIndex < msg.length)) {
            commonIndex++;
        }
        var nonReturnedInput = after.substring(commonIndex, after.length);
        shell.val(mathProgramOutput + nonReturnedInput);
        scrollDown(shell);
    });

    var backspace = function(){
        var completeText = shell.val();
        var before = completeText.substring(0, mathProgramOutput.length - 1),
            after = completeText.substring(mathProgramOutput.length, completeText.length);
        mathProgramOutput = before;
        shell.val(before + after);
        scrollDown(shell);
    };

    shell.on("reset", function(e){
        shell.val(mathProgramOutput);
    });
};

},{}],2:[function(require,module,exports){
/*global $, alert, console, document, trym2, window */

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





// this global variable changes the content on the left as the users
// naviges between home, tutorial, and input
// tabs are hard coded as home, tutorial, and input
// the controller assures that always exactly one tab from the tabs list is active. 
// usage: trym2.navBar.activate("home")
trym2.navBar = function () {
    this.activate = function( s ) { // string with name of tab
        console.log("activate tab: " + s);
        var tab = this.tabs[s];
        $(tab.btn).prop("checked", true).button("refresh"); // set the color of the tab
        tab.show( ); // do a few things for this tab
        var i, j;
        for (j in this.tabs) { // hide all other tabs' elements
            var otherTab = this.tabs[j];
            if ( otherTab != tab) {
                for (i in otherTab.elements) {
                    console.log( otherTab.elements[i] );
                    $(otherTab.elements[i]).hide();
                }
            }
        }
        for (i in tab.elements) { // show this tab's elements
            $(tab.elements[i]).show();
        }
    };

    var Tab = function(elements, btn, showFunction) {
        this.elements = elements;
        this.btn = btn;
        this.show = showFunction;
    };

    var homeTab = new Tab( ["#home"],
                              "#homeBtn",
                              function() {
                                    console.log( "home.show()" );
                              }
                        );

    var tutorialTab = new Tab(  ["#lesson", "#previousBtn", "#nextBtn", "#pageIndex"],
                                   "#tutorialBtn",
                                   function() {
                                        console.log("tutorial.show()");
                                        var maxLesson = trym2.tutorials[trym2.tutorialNr].lessons.length;
                                        $("#pageIndex").button("option", "label", (trym2.lessonNr + 1) + "/" +
                                              maxLesson).show().unbind().css('cursor', 'default');
                                    }
                                );

    var inputTab = new Tab( ["#inputarea", "#sendBtn"],
                               "#inputBtn",
                            function() {
                                console.log("input.show()");
                            }
                        );
    this.tabs =  {
       "home" : homeTab,
       "tutorial": tutorialTab,
       "input": inputTab
   };
   return this;
}();


///////////////////
// Tutorial code //
///////////////////


trym2.tutorials = [];

trym2.appendTutorialToAccordion = function(title, lessons, index) {
    title.wrapInner("<a href='#' class='menuTitle' tutorialid=" + index + "/>")
        .addClass(
        "ui-accordion-header ui-helper-reset ui-state-default ui-corner-all ui-accordion-icons")
        .prepend(
        '<span class="ui-icon ui-accordion-header-icon ui-icon-triangle-1-e"></span>')
        .hover(function() {
        $(this).toggleClass("ui-state-hover");
    })
        .click(function() {
        $(this)
            .toggleClass(
            "ui-accordion-header-active ui-state-active ui-corner-all ui-corner-top")
            .find("> .ui-icon").toggleClass(
            "ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
            .next().slideToggle(function() {
            // Needs improvement! Possibly do this synchronously with the slide toggle,
            // i.e. not as a callback.
            var y = $(this).position().top;
            var height = parseInt($("#home").css('height'), 10);
            var total_height = parseInt($(this).css('height'), 10) + 50;
            if (height - y < total_height) {
                var scroll = total_height - height + y;
                $("#home").animate({
                    scrollTop: ($("#home").scrollTop() + scroll)
                }, 400);
            }
        });
        return false;
    })
        .next();
    var div = $("<div>");
    var content = '<ul>';
    for (var j = 0; j < lessons.length; j++) {
        content = content +
            '<li><a href="#" class="submenuItem" tutorialid=' + index +
            ' lessonid=' + j + '>  ' + lessons[j].title + '</a></li>';
    }
    content = content + '</ul>';
    if (index > 0) {
        div.append(content).addClass(
            "ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom")
            .hide();
    } else {
        // Expand the first tutorial:
        title.toggleClass(
            "ui-accordion-header-active ui-state-active ui-corner-all ui-corner-top")
            .find("> .ui-icon").toggleClass(
            "ui-icon-triangle-1-e ui-icon-triangle-1-s");
        div.append(content).addClass(
            "ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom");
    }
    $("#loadTutorialMenu").before(title);
    $("#loadTutorialMenu").before(div);
};

trym2.appendLoadTutorialMenuToAccordion = function(){
   trym2.appendLoadTutorialTitleToAccordion();
   trym2.appendInstructionsToAccordion();
   trym2.addExpandLoadTutorialInstructionsButton();
   trym2.addLoadTutorialButton();
};

trym2.addLoadTutorialButton = function(){
   console.log("Adding buttons.");
   var loadTutorialButton = $("<a>");
   loadTutorialButton.prop("id", "loadTutorialButton");
   loadTutorialButton.html("Load Tutorial");
   $("#loadTutorialMenu").append(loadTutorialButton);
   $("#loadTutorialButton").click(trym2.doUptutorialClick);
};

trym2.addExpandLoadTutorialInstructionsButton = function(){
   var expandButton = $("<span>");
   expandButton.addClass("ui-icon ui-accordion-header-icon ui-icon-triangle-1-e");
   expandButton.click(function() {
      var title = $("#loadTutorialMenu");
      var instructions = $("#loadTutorialInstructions");
      expandButton.toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s");
      title.toggleClass(
         "ui-accordion-header-active ui-state-active ui-corner-all ui-corner-top");
      instructions.slideToggle(function() {
         // Needs improvement! Possibly do this synchronously with the slide toggle,
         // i.e. not as a callback.
         var y = $(this).position().top;
         var height = parseInt($("#home").css('height'), 10);
         var total_height = parseInt($(this).css('height'), 10) + 50;
         if (height - y < total_height) {
            var scroll = total_height - height + y;
            $("#home").animate({
            scrollTop: ($("#home").scrollTop() + scroll)
            }, 400);
         }
      });
   });
   $("#loadTutorialMenu").append(expandButton);

};

trym2.appendLoadTutorialTitleToAccordion = function(){
   console.log("Adding Title.");
   var title = $("<h3>");
   title.prop("id", "loadTutorialMenu");
   title.addClass(
        "ui-accordion-header ui-helper-reset ui-state-default ui-corner-all ui-accordion-icons");
   $("#accordion").append(title);
};

trym2.appendInstructionsToAccordion = function(){
   console.log("Adding Instructions.");
   var instructions = $("<div>");
   $.get("uploadTutorialHelp.txt", function(content){
      instructions.append(content);
   });
   instructions.prop("id", "loadTutorialInstructions");
   instructions.addClass(
               "ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom").hide();
   $("#accordion").append(instructions);
};

trym2.makeAccordion = function(tutorials) {
    $("#home").append("<div id=\"accordion\"></div>");
    trym2.appendLoadTutorialMenuToAccordion();
    for (var i = 0; i < tutorials.length; i++) {
        var title = tutorials[i].title; //this is an <h3>
        var lessons = tutorials[i].lessons;
        trym2.appendTutorialToAccordion(title, lessons, i);
    }

    $("#accordion").addClass("ui-accordion ui-widget ui-helper-reset");
    $(".menuTitle").on("click", {lessonIdNr: "0"}, trym2.showLesson);
};

trym2.showLesson = function(e) {
    var lessonId,
        lessonIdNr,
        tutorialId = $(this).attr('tutorialid'),
        tutorialIdNr = parseInt(tutorialId.match(/\d/g), 10);
    if(e.data && e.data.lessonIdNr){
        lessonIdNr = parseInt(e.data.lessonIdNr, 10);
    } else { // Get number from link attribute
        lessonId = $(this).attr('lessonid'),
        lessonIdNr = parseInt(lessonId.match(/\d/g), 10);
    }
    //console.log("LessonID: " + lessonId);
    //console.log("You clicked a submenuItem: " + $(this).html());
    trym2.loadLesson(tutorialIdNr, lessonIdNr);
    trym2.navBar.activate("tutorial");
    return false;
};

trym2.loadLesson = function(tutorialid, lessonid ) {
    console.log( this.tutorialNr + "==" + tutorialid + " or " + this.lessonNr + "==" +
        lessonid );
    var changedLesson = (this.tutorialNr != tutorialid || this.lessonNr !=
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
        var title = this.tutorials[this.tutorialNr].title.text();
        $("#lesson").html(lessonContent).prepend("<h3>" + title + "</h3>").show();
        $("#lesson").scrollTop(0); //scroll to the top of a new lesson
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"#lesson"])
    }
};

trym2.switchLesson = function(incr) {
    //console.log("Current lessonNr " + trym2.lessonNr);
    this.loadLesson(this.tutorialNr, this.lessonNr + incr);
    trym2.navBar.activate("tutorial");
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
    if(!notrack){
        $("#M2Out").trigger("track", msg);
        console.log("Tracking.");
    }
    return true;
};

trym2.sendCallback = function(inputField) {
    return function() {
        var str = trym2.getSelected(inputField);
        trym2.postMessage(str);
        return false;
    };
};

trym2.sendOnEnterCallback = function(inputfield) {
    return function(e) {
        if (e.which === 13 && e.shiftKey) {
            e.preventDefault();
            // do not make a line break or remove selected text when sending
            trym2.postMessage(trym2.getSelected(inputfield));
        }
    };
};

trym2.doUptutorialClick = function() {
    $("#uptutorial").val("");
    console.log("Click tutorial: " + typeof($("#uptutorial")));
    $("#uptutorial").click();
};


trym2.saveInteractions = function() {
    var input = $("#M2In");
    var output = $("#M2Out");
    var inputParagraph = $("<p>");
    inputParagraph.append(trym2.downloadTextArea(input, "Content of input window", mathProgramName + "In"));
    var outputParagraph = $("<p>");
    outputParagraph.append(trym2.downloadTextArea(output, "Content of terminal", mathProgramName + "Out"));
    $("<div></div>").append(inputParagraph)
        .append(outputParagraph)
        .append("<span autofocus='autofocus'></span>")
        .dialog({
        title: "Download"
    }).attr('id', 'save-dialog');
    $("#save-dialog a").button({
        icons: {
            primary: "ui-icon-document"
        }
    });
};

trym2.uploadTutorial = function() {
    var obj = this;
    var files = this.files;
    console.log("number of files in upload tutorial: " + files.length);
    file = files[0];
    var fileName = file.name;
    console.log("Process file for tutorial upload:" + fileName);

    var reader = new FileReader();
    reader.readAsText(file);

    // Closure to capture the file information.
    reader.onload = function(event) {
        var resultHtml = event.target.result;
        //console.log(resultHtml);
        trym2.tutorials.push(trym2.populateTutorialElement(resultHtml));
        var lastIndex = trym2.tutorials.length - 1;
        var newTutorial = trym2.tutorials[lastIndex];
        var title = newTutorial.title; //this is an <h3>
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
trym2.populateTutorialElement = tf.populateTutorialElement;




$(document).ready(function() {

    trym2.scrollDown = scrollDown;
    trym2.getSelected = getSelected;
    trym2.setCaretPosition = setCaretPosition;
    trym2.downloadTextArea = downloadTextArea;

    trym2.socket = io();

    trym2.socket.on('result', function(msg) {
        if (msg !== "") {
            $("#M2Out").trigger("onmessage", msg);
        }
    });
    

    trym2.socket.on('serverDisconnect', function(msg) {
        console.log("We got disconnected. " + msg);
        $("#M2Out").trigger("onmessage", " Sorry, your session was disconnected by the server.\n\n");
        trym2.serverDisconnect = true;
    });

    trym2.socket.oldEmit = trym2.socket.emit;
    trym2.socket.emit = function(event, msg){
        if(trym2.serverDisconnect){
            var events = ['reset', 'input'];
            console.log("We are disconnected.");
            if(events.indexOf(event) != -1){
                trym2.socket.connect();
                trym2.serverDisconnect = false;
                trym2.socket.oldEmit(event, msg);
            } else {
                // console.log("Will not reconnect for " + event);
            }
        } else {
            trym2.socket.oldEmit(event, msg);
        }
    };

    trym2.socket.on('image', function(imageUrl) {
        if (imageUrl) {
            console.log("We received an image: " + imageUrl);
            var graphBtn = $('<a href="#">').html(imageUrl.split('/').pop())
                .button({
                    icons: {
                        primary: "ui-icon-document"
                    }
                }).on('click', function() {
                    window.open(imageUrl, '_blank',
                        'height=200,width=200,toolbar=0,location=0,menubar=0');
                    $(".graph-dialog").dialog("close");
                    return false;
                });
            $("<div></div>").html(graphBtn).dialog({
                title: 'Image',
                dialogClass: 'alert'
            }).addClass('graph-dialog');
        }
    });

    trym2.socket.on('viewHelp', function(helpUrl){
        if (helpUrl) {
            console.log("We got a viewHelp! " + helpUrl);
            window.open(helpUrl, "M2 Help");
        }
    });

    // Init procedures for right hand side.
    $("#M2Out").val("");
    
    var shellFunctions = {
        setCaretPosition: trym2.setCaretPosition,
        postMessage: trym2.postMessage,
        scrollDown: trym2.scrollDown,
        interrupt: function(){trym2.postMessage(ctrlc, true)}
    };

    var shellTextArea = require('shell-emulator');
    shellTextArea.create($("#M2Out"), $("#M2In"), shellFunctions);

    $("#navigation").children("input").attr("name", "navbutton");
    $("#navigation").buttonset();
    $(".buttonset").buttonset();

    $("button").button();
    $("#previousBtn").button({
        icons: { primary: "ui-icon-arrowthick-1-w" },
        text: false
    }).click(function() {
        trym2.switchLesson(-1);
        $(this).removeClass("ui-state-focus");
    });

    $("#nextBtn").button({
        icons: { primary: "ui-icon-arrowthick-1-e" },
        text: false
    }).click(function() {
        trym2.switchLesson(1);
        $(this).removeClass("ui-state-focus");
    });



    $('#M2In').val(DefaultText);
    $("#sendBtn").click(trym2.sendCallback('#M2In'));
    $('#M2In').keypress(trym2.sendOnEnterCallback('#M2In'));
    $("#resetBtn").click(function(){$("#M2Out").trigger("reset"); trym2.socket.emit('reset')});;
    $("#interruptBtn").click(function(){trym2.postMessage(ctrlc, true)});
    $("#inputBtn").click(function() {
        trym2.navBar.activate("input");
    });
    $("#saveBtn").click(trym2.saveInteractions);

    var siofu = new SocketIOFileUpload(trym2.socket);

    document.getElementById("uploadBtn").addEventListener('click', siofu.prompt, false);

    siofu.addEventListener("complete", function(event){
        console.log('we uploaded the file: ' + event.success);
        console.log(event.file);
        var filename = event.file.name;
        console.log("File uploaded successfully!" + filename);
        $("<div class='smallFont'>"
            + filename
            + " has been uploaded and you can use it by loading it into your " + mathProgramName + " session (use the input terminal).</div>"
        ).dialog({
                dialogClass: ' alert',
                title: 'File uploaded'
            });
    }); 

    siofu.addEventListener("complete", function(event){
        console.log('we uploaded the file: ' + event.success);
        console.log(event.file);
    });

    $("#uptutorial").on('change', trym2.uploadTutorial);

    $("#tutorialBtn").click(function() {
        trym2.loadLesson( trym2.tutorialNr, trym2.lessonNr);
        trym2.navBar.activate("tutorial");
    });

    $("#homeBtn").click( function() {
        trym2.navBar.activate("home");
    });

    $(document).on("click", ".submenuItem", trym2.showLesson);

    $(document).on("click", "code", function() {
        $(this).effect("highlight", {
            color: 'red'
        }, 300);
        var code = $(this).text();
        code = code + "\n";
        $("#M2In").val($("#M2In").val() + code);
        trym2.scrollDown($("#M2In"));
        trym2.postMessage(code);
    });

    $(document).on("click", "code2", function() {
        $(this).effect("highlight", {
            color: 'red'
        }, 300);
        var code = $(this).text();
        code = code + "\n";
        $("#M2In").val($("#M2In").val() + code);
        trym2.scrollDown($("#M2In"));
        trym2.postMessage(code);
    });

    trym2.importTutorials();

    trym2.navBar.activate("home");
});

},{"shell-emulator":1}]},{},[2]);
