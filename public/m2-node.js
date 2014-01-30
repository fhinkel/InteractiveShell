/*global $, alert, console, document, trym2, window */

var trym2 = {
    lessonNr: 0,
    tutorialNr: 0,
    tutorials: [], 
    firstLoadFlag: true, // true until we show tutorial for the first time. Needed because we need to load lesson 0
    MAXFILESIZE: 500000 // max size in bytes for file uploads
};



// initialize with ID (string) of field that should act like a shell,
//  i.e., command history, taking input and replacing it with output from server
var shellObject = function(shellArea, historyArea) {
    var shell = shellArea;
    var history = historyArea;
    var cmdHistory = []; // History of M2 commands for shell-like arrow navigation
    cmdHistory.index = 0;
    var outIndex = 0; // End of real M2 output in M2Out textarea, without user's typing.   
    var dataSentIndex = 0;
    shell.on("track", function(e, msg) { // add command to history
        if (typeof msg != 'undefined') {
            input = msg.split("\n");
            for (var line in input) {
                if (input[line].length > 0) {
                    console.log("add command to cmdHistory: " + input[line]);
                    cmdHistory.index = cmdHistory.push(input[line]);
                }
            }
        }

    });
    
    // On pressing return send last part of M2Out to M2 and remove it.
    shell.keypress(function(e) {
        var l, msg;
        if (e.keyCode == 13) { // Return
            trym2.setCaretPosition(shell, shell.val().length);
            if (shell.val().length > outIndex) {
                l = shell.val().length;
                msg = shell.val().substring(dataSentIndex, l);
                if(history != undefined){
                   history.val(history.val() + msg + "\n");
                   trym2.scrollDown(history);
                }
                dataSentIndex += msg.length + 1;
                outIndex += msg.length + 1;
                trym2.postMessage('/chat', msg + "\n")();
            } else {
                // We don't want empty lines send to M2 at pressing return twice.
                e.preventDefault(); 
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
            if (pos < outIndex) {
                //console.log(pos + " Moving to end."); 
                trym2.setCaretPosition(shell, shell.val().length);
            }
        } else if ((e.keyCode == arrowUp) || (e.keyCode == arrowDown)) {
            // console.log("Arrow key.");
            if ((e.keyCode == arrowDown) && (cmdHistory.index < cmdHistory.length)) { // DOWN
                cmdHistory.index++;
            }
            if ((e.keyCode == arrowUp) && (cmdHistory.index > 0)) { // UP
                if (cmdHistory.index == cmdHistory.length) {
                    cmdHistory.current = shell.val().substring(outIndex, $(
                        shell).val().length);
                }
                cmdHistory.index--;
            }
            if (cmdHistory.index == cmdHistory.length) {
                shell.val(shell.val().substring(0, outIndex) + cmdHistory
                    .current);
            } else {
                shell.val(shell.val().substring(0, outIndex) + cmdHistory[
                    cmdHistory.index]);
            }
            trym2.scrollDown(shell);
            e.preventDefault();
        }
        // This deals with backspace.
        // We may not shorten the string entered by M2.
        if (e.keyCode == backspace) {
            if (shell.val().length == outIndex) {
                e.preventDefault();
            }
        }
        if (e.keyCode == tab) {
            e.preventDefault();
            // Do something for tab-completion.
        }
    });

    shell.on("onmessage", function(e, msg) {
        console.log("New Message: *" + msg + "*");
        var before = shell.val().substring(0, outIndex),
            after = shell.val().substring(outIndex, shell.val().length);
        var currIndex = -1;
        var afterSplit = after.split("\n");
        while ((after.length > 0) && (afterSplit.length > 1)) {
            var nextIndex = msg.indexOf(afterSplit[0]);
            if (afterSplit[0].length == 0) {
                nextIndex = currIndex + 1;
            }
            if (nextIndex > currIndex) {
                dataSentIndex -= afterSplit[0].length + 1;
                afterSplit.shift();
                currIndex = nextIndex;
            } else {
                break;
            }
        }

        if (/^Macaulay2, version \d\.\d/.test(msg)) {
            shell.val(before + msg);
            dataSentIndex = outIndex;
        } else {
            shell.val(before + msg + afterSplit.join("\n"));
        }
        trym2.scrollDown(shell);
        outIndex += msg.length;
        dataSentIndex += msg.length;
    });
};


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
        this.btn = btn, 
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
    };
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
}

trym2.appendLoadTutorialMenuToAccordion = function(){
   trym2.appendLoadTutorialTitleToAccordion();
   trym2.appendInstructionsToAccordion();
   trym2.addExpandLoadTutorialInstructionsButton();
   trym2.addLoadTutorialButton();
}

trym2.addLoadTutorialButton = function(){
   console.log("Adding buttons.");
   var loadTutorialButton = $("<a>");
   loadTutorialButton.prop("id", "loadTutorialButton");
   loadTutorialButton.html("Load Tutorial");
   $("#loadTutorialMenu").append(loadTutorialButton);
   $("#loadTutorialButton").click(trym2.doUptutorialClick);
}

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

}

trym2.appendLoadTutorialTitleToAccordion = function(){
   console.log("Adding Title.");
   var title = $("<h3>");
   title.prop("id", "loadTutorialMenu");
   title.addClass(
        "ui-accordion-header ui-helper-reset ui-state-default ui-corner-all ui-accordion-icons");
   $("#accordion").append(title);
}

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
}

trym2.makeAccordion = function(tutorials) {
    $("#home").append("<div id=\"accordion\"></div>");
    trym2.appendLoadTutorialMenuToAccordion();
    for (var i = 0; i < tutorials.length; i++) {
        var title = tutorials[i].title; //this is an <h3>
        var lessons = tutorials[i].lessons;
        trym2.appendTutorialToAccordion(title, lessons, i);
    };

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
    };
    if (lessonid >= 0 && lessonid < this.tutorials[this.tutorialNr].lessons.length) {
        this.lessonNr = lessonid;
    };
    var lessonContent = this.tutorials[this.tutorialNr].lessons[this.lessonNr]
        .html;

    if (changedLesson) {
        console.log("Lesson changed");
        var title = this.tutorials[this.tutorialNr].title.text();
        $("#lesson").html(lessonContent).prepend("<h3>" + title + "</h3>").show();
        $("#lesson").scrollTop(0); //scroll to the top of a new lesson
    }
};

trym2.switchLesson = function(incr) {
    //console.log("Current lessonNr " + trym2.lessonNr);
    this.loadLesson(this.tutorialNr, this.lessonNr + incr);
    trym2.navBar.activate("tutorial");
};

trym2.makeTutorialsList = function(i, tutorialNames, callback) {
    if (i < tutorialNames.length) {
        $.get(tutorialNames[i], function(resultHtml) {
            trym2.tutorials[i] = trym2.populateTutorialElement(resultHtml);
            console.log(trym2.tutorials[i].title);
            trym2.makeTutorialsList(i + 1, tutorialNames, callback);
        });
    } else {
        callback();
    };
};

trym2.populateTutorialElement = function(theHtml) {
    // populate a Tutorial element, and return it
    var theLessons = [];
    var tutorial = $("<div>").html(theHtml);
    $("div", tutorial).each(function() {
        theLessons.push({
            title: $("h4:first", $(this)).text(),
            html: $(this)
        });
    });
    return { // class Tutorial
        title: $("<h3>").append($("title", tutorial).text()),
        current: 0,
        lessons: theLessons
    };
};

trym2.inspect = function(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            console.log("inspect: " + prop + " : " + obj.prop);
        }
    }
};

trym2.scrollDown = function(area) {
    area.scrollTop(area[0].scrollHeight);
    return false;
    // Return false to cancel the default link action
};

/* get selected text, or current line, in the textarea #M2In */
trym2.getSelected = function(inputField) {
    var str = $(inputField).val(),
        start = $(inputField)[0].selectionStart,
        end = $(inputField)[0].selectionEnd,
        endPos;
    if (start === end) {
        // grab the current line
        if (end != 0) {
            start = 1 + str.lastIndexOf("\n", end - 1);
        } else {
            start = 0;
        }
        endPos = str.indexOf("\n", start);
        if (endPos !== -1) {
            end = endPos;
        } else {
            str = $(inputField).val() + "\n";
            $(inputField).val(str);
            end = str.length - 1; // position of last \n 
        }
        // move cursor to beginning of line below 
        this.setCaretPosition($(inputField), end + 1);
    }
    return str.slice(start, end) + "\n";
};


trym2.setCaretPosition = function(inputField, caretPos) {
    if (inputField != null) {
        if (inputField[0].createTextRange) {
            var range = inputField[0].createTextRange();
            range.move('character', caretPos);
            range.select();
        } else {
            if (inputField[0].selectionStart || $(inputField)[0].selectionStart ===
                0) {
                inputField[0].focus();
                inputField[0].setSelectionRange(caretPos, caretPos);
            } else {
                inputField[0].focus();
            }
        }
    }
}


trym2.postMessage = function(url, msg) {
    return function() {
        var xhr = new XMLHttpRequest(); // Create a new XHR
        //console.log( "URL: " + url);
        xhr.open("POST", url); // to POST to url.
        xhr.setRequestHeader("Content-Type", // Specify plain UTF-8 text 
        "text/plain;charset=UTF-8");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                //console.log( "All ResponseHeaders: " + xhr.getAllResponseHeaders());
                var resHead = xhr.getResponseHeader('notEventSourceError');
                //console.log( "ResponseHeader: " + resHead);
                if (resHead) {
                    console.log(
                        "We must have lost the EventSource Stream, redoing it...");
                    //ask for new EventSource and send msg again
                    trym2.startEventSource();
                    setTimeout(function() {
                        trym2.postMessage("/chat", msg)();
                    }, 1000);
                }
            }
        };
        xhr.send(msg); // Send the message
        $("#M2Out").trigger("track", msg);
        return true;
    }
};

trym2.sendCallback = function(inputField) {
    return function() {
        var str = trym2.getSelected(inputField);
        trym2.postMessage('/chat', str)();
        return false;
    };
};

trym2.sendOnEnterCallback = function(inputfield) {
    return function(e) {
        if (e.which === 13 && e.shiftKey) {
            e.preventDefault();
            // do not make a line break or remove selected text when sending
            trym2.postMessage('/chat', trym2.getSelected(inputfield))();
        }
    };
};


trym2.saveFiles = function(filenames) {
    $("<div></div>").html('<p><a href="' + filenames.input +
        '" target="_blank">Input</a>')
        .append('<p><a href="' + filenames.output +
        '" target="_blank">Output</a>')
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

trym2.doUptutorialClick = function() {
    $("#uptutorial").val("");
    console.log("Click tutorial: " + typeof($("#uptutorial")));
    $("#uptutorial").click();
};

trym2.doUpfileClick = function() {
    $("#upfile").val("");
    console.log("Click file: " + typeof($("#upfile")));
    $("#upfile").click();
};

trym2.saveInteractions = function() {
    var xhr = new XMLHttpRequest(); // Create a new XHR
    //console.log( "URL: " + url);
    var msg = {
        input: $("#M2In").val(),
        output: $("#M2Out").val()
    };
    xhr.open("POST", '/save'); // to POST to url.
    xhr.setRequestHeader("Content-Type", // Specify plain UTF-8 text 
    "application/json;charset=UTF-8");
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            console.log("saveInteractions post finished");
            var filenames = JSON.parse(xhr.responseText);
            console.log(filenames);
            trym2.saveFiles(filenames);
            //window.open(filenames.input, 'Download');
        }
    };

    xhr.send(JSON.stringify(msg));
    return true;
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
        console.log(resultHtml);
        trym2.tutorials.push(trym2.populateTutorialElement(resultHtml));
        var lastIndex = trym2.tutorials.length - 1;
        var newTutorial = trym2.tutorials[lastIndex];
        var title = newTutorial.title; //this is an <h3>
        console.log("new title: " + title.html());
    
        var lessons = newTutorial.lessons;
        trym2.appendTutorialToAccordion(title, lessons, lastIndex);
        trym2.insertDeleteButtonAtLastTutorial();
    };
    return false;
}

trym2.insertDeleteButtonAtLastTutorial = function() {
   var lastTitle = $("#loadTutorialMenu").prev().prev();
   var lastDiv = $("#loadTutorialMenu").prev();
   var deleteButton = $("<span>");
   deleteButton.addClass("close-icon ui-icon ui-icon-close");
   lastTitle.prepend(deleteButton);
   deleteButton.click(trym2.removeTutorial(lastTitle, lastDiv, deleteButton));
}

trym2.removeTutorial = function(title, div, button){
   return function(){
      button.remove();
      div.remove();
      title.remove();
   }
}

trym2.doUpload = function() {
    var obj = this;
    var file = obj.files[0];
    var fileName = obj.value.split("\\"); // this is an array
    fileName = fileName[fileName.length - 1]; // take the last element
    var formData = new FormData();
    formData.append('file', file);
    console.log("process form " + file);
    console.log(file.size);
    if (file.size > this.MAXFILESIZE) {
        $(
            "<div><span class='ui-icon ui-icon-alert ' style='float: left; margin-right: .3em;'></span>Your file is too big to upload.  Sorry!</div>")
            .dialog({
            dialogClass: 'alert',
        });
        return false;
    }

    $.ajax({
        url: '/upload',
        type: 'POST',
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        statusCode: {
            500: function(data) {
                $(
                    "<div><span class='ui-icon ui-icon-alert ' style='float: left; margin-right: .3em;'></span>Uploading failed.</div>")
                    .dialog({
                    dialogClass: 'alert'
                });
            }
        },
        success: function(data) {
            console.log("File uploaded successfully!" + data);
            $("<div class='smallFont'>" + fileName +
                " has been uploaded and you can use it by loading it into your Macaulay2 session (use the input terminal).</div>")
                .dialog({
                dialogClass: ' alert',
                title: 'File uploaded'
            });
        }
    });
    return false;
}

// Register for notification of new messages using EventSource
trym2.startEventSource = function() {
    if ( !! window.EventSource) {
        var chat = new EventSource("/startSourceEvent");
        chat.addEventListener('image', function(event) {
            var imageUrl = event.origin + event.data;
            console.log("Image coming from: " + event.origin);
            //console.log("We got an image! " + imageUrl);
            if (imageUrl) {
                console.log("We got an image! " + imageUrl);
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
        }, false);
        chat.addEventListener('viewHelp', function(event) {
            var helpUrl = event.origin + event.data;
            console.log("viewHelp coming from: " + event.origin);
            if (helpUrl) {
                console.log("We got a viewHelp! " + helpUrl);
                window.open(helpUrl, "M2 Help");
            }
        }, false);
        chat.onmessage = function(event) { // When a new message arrives
            var msg = event.data; // Get text from event object
            //console.log(event);
            if (msg !== "") {
                console.log("The message " + msg);
                $("#M2Out").trigger("onmessage", msg);
            }
        }
    }
};

trym2.importTutorials = function() {
    console.log("Import tutorials.");

    $.ajax({
          url: '/getListOfTutorials',
          type: 'GET',
          statusCode: {
              500: function(error) {
                  console.log("There was an error obtaining the list of tutorial files: " + error);
              }
          },
          success: function(tutorialData) {
              console.log("Obtaining list of tutorials successful: " + tutorialData);
              var tutorialPaths =  JSON.parse(tutorialData);
              trym2.makeTutorialsList(0, tutorialPaths, function() {
                  trym2.makeAccordion(trym2.tutorials);
              });
          }
      });
      return false;
};

$(document).ready(function() {
    // Init procedures for right hand side.
    $("#M2Out").val("");
    shellObject($("#M2Out"), $("#M2In"));

    // send server our client.eventStream
    trym2.startEventSource();

    // Restarting the EventSource after pressing 'esc':
    $(document).keyup(function(e) {
        //console.log("Got a key:"+e.keyCode);
        if (e.keyCode == 27) {
            trym2.startEventSource();
        } // esc
    });

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


    var M2InDefaultText = "" +
        "-- Welcome to Macaulay2 !\n" +
        "-- In this window you may type in Macaulay2 commands \n" +
        "-- and have them evaluated by the server.\n" +
        "\n" +
        "-- Evaluate a line or selection by typing Shift+Enter \n" +
        "-- or by clicking on Evaluate.\n" +
        "\n" +
        "-- To open the Macaulay2 documentation for a \n" +
        "-- topic in another browser tab or window do e.g.:\n" +
        "\n" +
        "viewHelp \"determinant\"\n" +
        "\n" +
        "-- If nothing shows up, you may need to set your browser \n" +
        "-- to allow pop up windows.\n" +
        "\n" +
        "-- Here are some sample commands:\n" +
        "  R = ZZ/101[a,b,c,d]\n" +
        "  I = ideal(a^2-b*c, a^3-b^3, a^4-b*d^3, a^5-c^2*d^3)\n" +
        "  J = ideal groebnerBasis I;\n" +
        "  netList J_*\n" +
        "\n" +
        "  -- Some examples of rings\n" +
        "  A = ZZ/32003[a..g]\n" +
        "  B = QQ[x_1..x_6]\n" +
        "  C = ZZ/101[vars(0..12)]\n" +
        "---------------\n";

    $('#M2In').val(M2InDefaultText);
    $("#sendBtn").click(trym2.sendCallback('#M2In'));
    $('#M2In').keypress(trym2.sendOnEnterCallback('#M2In'));
    $("#resetBtn").click(trym2.postMessage('/restart'));
    $("#interruptBtn").click(trym2.postMessage('/interrupt'));
    $("#inputBtn").click(function() {
        trym2.navBar.activate("input");
    });
    $("#saveBtn").click(trym2.saveInteractions);
    $("#uploadBtn").click(trym2.doUpfileClick);
    $("#upfile").on('change', trym2.doUpload);
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
        trym2.postMessage('/chat', code)();
    });

    trym2.importTutorials();

    trym2.navBar.activate("home"); 
});
