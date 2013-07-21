/*global $, alert, console, document, trym2, window */

var trym2 = {
    lessonNr: 0,
    tutorialNr: 0,
    tutorialScrollTop: 0, // this value is where we set the scrollTop of "#lesson" so we can reset it back
    // when we navigate back (from Input or Home views).
    tutorials: []
};

// initialize with ID (string) of field that should act like a shell,
//  i.e., command history, taking input and replacing it with output from server
var shellObject = function(shellArea, historyArea) {
    var shell = shellArea;
    var history = historyArea
    var cmdHistory = []; // History of M2 commands for shell-like arrow navigation
    cmdHistory.index = 0;
    var outIndex = 0; // End of real M2 output in M2Out textarea, without user's typing.   
    var dataSentIndex = 0;
    shell.on("track", function(e, msg) { // add command to history
        if (typeof msg != 'undefined') {
            input = msg.split("\n");
            for (var line in input) {
                if (input[line].length > 0) {
                    console.log("Line: " + input[line]);
                    cmdHistory.index = cmdHistory.push(input[line]);
                }
            }
        }

    });
    
    // On pressing return send last part of M2Out to M2 and remove it.
    shell.keypress(function(e) {
        var l, msg, input;
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


// this object is responsible for changing the content on the left as the users
// naviges between home, tutorial, and input
var navBar = function () {
    var NavBarController =  function( tabs ){
        this.tabs = tabs;
    };
    
    NavBarController.prototype.activate = function( s, param ) { // string with name of tab, maxLesson for show functions
        console.log("activate tab: " + s);
        console.log(this.tabs);
        var tab = this.tabs[s];
        $(tab.btn).prop("checked", true).button("refresh"); // set the color of the tab
        tab.show( param ); // do a few things for this tab
        for ( var i in tab.elements) { // show this tab's elements
            $(tab.elements[i]).show();
        }
        for (i in this.tabs) { // hide all other tabs' elements
            var otherTab = this.tabs[i];
            if ( otherTab != tab) {
                for (var j in otherTab.elements) {
                    $(otherTab.elements[j]).hide(); 
                }
            }
        }
    };
    
    var NavBarTab = function(elements, btn, show) {
        this.elements = elements;
        this.btn = btn, 
        this.show = show;
    };

    var home = new NavBarTab( ["#home"], 
                              "#homeBtn", 
                              function() {
        console.log( "home.show()" );
        trym2.tutorialScrollTop = $("#lesson").scrollTop();
    });

    var tutorial = new NavBarTab(  ["#lesson", "#previousBtn", "#nextBtn", "#pageIndex"],
                                   "#tutorialBtn",
                                   function( maxLesson ) {
        console.log("tutorial.show()");  
        $("#pageIndex").button("option", "label", (trym2.lessonNr + 1) + "/" +
              maxLesson).show().unbind().css('cursor', 'default');
    });

    var input = new NavBarTab( ["#inputarea", "#sendBtn"],
                               "#inputBtn",
                            function() {
        console.log("input.show()");
        $("#lesson").scrollTop();
    });
    
   return new NavBarController( {
       "home" : home, 
       "tutorial": tutorial,
       "input": input
   });
}();





///////////////////
// Tutorial code //
///////////////////

trym2.tutorials = [];

trym2.makeTutorial = function(theUrl, theHtml) {
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
        url: theUrl,
        title: $("<h3>").append($("title", tutorial).text()),
        current: 0,
        lessons: theLessons
    };
};

trym2.makeAccordion = function(tutorials) {
    for (var i = 0; i < tutorials.length; i++) {
        var title = tutorials[i].title; //this is an <h3>
        title.wrapInner("<a href='#' class='menuTitle' tutorialid=" + i + "/>")
            .addClass(
            "ui-accordion-header ui-helper-reset ui-state-default ui-corner-all ui-accordion-icons")
            .prepend(
            '<span class="ui-icon ui-accordion-header-icon ui-icon-triangle-1-e"></span>')
            .hover(function() {
            $(this).toggleClass("ui-state-hover");
        })
            .click(function() {
            //console.log($(this).html());
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
                //console.log("y-pos: " + y + " height: " + height + " number of children: " + children);
                //console.log($(this).position());
                //console.log("total height: " + total_height + " distance to bottom: " + (height - y));
                if (height - y < total_height) {
                    var scroll = total_height - height + y;
                    //console.log("I want to scroll! " + scroll + ' ' + $("#TOC").scrollTop());
                    $("#home").animate({
                        scrollTop: ($("#home").scrollTop() + scroll)
                    }, 400);
                    //$("#home").scrollTop($("#home").scrollTop() + scroll);
                }

            });
            return false;
        })
            .next();

        var div = $("<div>");
        var content = '<ul>';
        var lessons = tutorials[i].lessons;
        for (var j = 0; j < lessons.length; j++) {
            content = content +
                '<li><a href="#" class="submenuItem" tutorialid=' + i +
                ' lessonid=' + j + '>  ' + lessons[j].title + '</a></li>';
        };
        content = content + '</ul>';
        if (i > 0) {
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
        $("#accordion").append(title).append(div);
    };
    $("#accordion").addClass("ui-accordion ui-widget ui-helper-reset");
    $(".menuTitle").on("click", function() {
        var tutorialId = $(this).attr('tutorialid'),
            tutorialIdNr = parseInt(tutorialId.match(/\d/g), 10);
        trym2.loadLesson(tutorialIdNr, 0);
        return false;
    });
};

trym2.submenuItemCallback = function() {
    var lessonId = $(this).attr('lessonid'),
        tutorialId = $(this).attr('tutorialid'),
        lessonIdNr = parseInt(lessonId.match(/\d/g), 10),
        tutorialIdNr = parseInt(tutorialId.match(/\d/g), 10);
    console.log(lessonId);
    //console.log("You clicked a submenuItem: " + $(this).html());
    trym2.loadLesson(tutorialIdNr, lessonIdNr);
    return false;
};

trym2.loadLesson = function(tutorialid, lessonid) {
    var changedLesson = (trym2.tutorialNr != tutorialid || trym2.lessonIdNr !=
        lessonid);

    if (tutorialid >= 0 && tutorialid < trym2.tutorials.length) {
        trym2.tutorialNr = tutorialid;
    };
    if (lessonid >= 0 && lessonid < trym2.tutorials[trym2.tutorialNr].lessons.length) {
        trym2.lessonNr = lessonid;
    };
    var maxLesson = trym2.tutorials[trym2.tutorialNr].lessons.length;
    var lessonContent = trym2.tutorials[trym2.tutorialNr].lessons[trym2.lessonNr]
        .html;

    if (changedLesson) {
        var title = trym2.tutorials[trym2.tutorialNr].title.text();
        $("#lesson").html(lessonContent).prepend("<h3>" + title + "</h3>").show();
        $("#lesson").scrollTop(0);
    };

    navBar.activate("tutorial", maxLesson);
    
};

trym2.switchLesson = function(incr) {
    //console.log("Current lessonNr " + trym2.lessonNr);
    trym2.loadLesson(trym2.tutorialNr, trym2.lessonNr + incr);
};

trym2.getTutorials = function(i, tutorialNames, whenDone) {
    if (i < tutorialNames.length) {
        $.get(tutorialNames[i], function(resultHtml) {
            trym2.tutorials[i] = trym2.makeTutorial(tutorialNames[i],
                resultHtml);
            console.log(trym2.tutorials[i].title);
            trym2.getTutorials(i + 1, tutorialNames, whenDone);
        });
    } else {
        whenDone();
    };
};

// input: filename with tutorial content
// return a list of lessons title, each wrapped in a div and link, 
// <div><a>" + title + "</a></div>  
// attach a lesson ID
trym2.getLessonTitles = function(tutorialFile, callback) {
    $("#menuTutorial").load(tutorialFile, function() {
        var titles = "<h3>" + $("#menuTutorial title").text() + "</h3>";
        titles = titles + "<div> <ul>";
        var i = 1;
        $("#menuTutorial h4").each(function() {
            var title = $(this).text();
            titles = titles +
                "<li><a href='#' class='submenuItem' lessonid='lesson" +
                i + "'>" + title + "</a></li>";
            i = i + 1;
            //console.log("Title in m2.js: " + title);
        });
        titles = titles + "</ul></div>";
        //console.log("All titles: " + titles);
        callback(titles);
    });
};

trym2.getAllTitles = function(i, tutorials, next) {
    if (i < tutorials.length) {
        trym2.getLessonTitles(tutorials[i], function(titles) {
            $("#accordion").append(titles);
            console.log("Titles: " + titles);
            trym2.getAllTitles(i + 1, tutorials, next);
        });
    } else {
        next();
    }
};

///////////////////

trym2.MAXFILESIZE = 500000; // max size in bytes for file uploads

trym2.inspect = function(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            console.log("inspect: " + prop + " : " + obj.prop);
        }
    }
};

trym2.scrollDown = function(area) {
    //var mySize = $(area).val().length;
    // You can output the heights and the second one is much larger.
    //console.log("Size: "+mySize);
    //console.log("Height: "+$(area)[0].scrollHeight);
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
        trym2.setCaretPosition($(inputField), end + 1);
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

trym2.doUpload = function() {
    var obj = this;
    var file = obj.files[0];
    var fileName = obj.value.split("\\"); // this is an array
    fileName = fileName[fileName.length - 1]; // take the last element
    var formData = new FormData();
    formData.append('file', file);
    console.log("process form " + file);
    console.log(file.size);
    if (false) { //file.size > trym2.MAXFILESIZE) {
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
        icons: {
            primary: "ui-icon-arrowthick-1-w"
        },
        text: false
    });
    $("#nextBtn").button({
        icons: {
            primary: "ui-icon-arrowthick-1-e"
        },
        text: false
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
        navBar.activate("input");
    });
    $("#saveBtn").click(trym2.saveInteractions);
    $("#uploadBtn").click(trym2.doUpfileClick);
    $("#upfile").on('change', trym2.doUpload);

    $("#tutorialBtn").click(function() {
        trym2.loadLesson(trym2.tutorialNr, trym2.lessonNr);
        if (trym2.tutorialScrollTop != 0)
            $("#lesson").scrollTop(trym2.tutorialScrollTop);
        trym2.tutorialScrollTop = 0;
        //console.log("lesson!");
    });

    $("#homeBtn").click( function() {
        navBar.activate("home"); 
    });

    $(document).on("click", ".submenuItem", trym2.submenuItemCallback);

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

    var tutorialNames = ["tutorials/welcome2.html",
            "tutorials/getting-started.html",
            "tutorials/Beginning.html",
            "tutorials/elementary-groebner.html"
    ];
    $("#home").append("<div id=\"accordion\"></div>");

    $("#nextBtn").click(function() {
        trym2.switchLesson(1);
        $(this).removeClass("ui-state-focus");
    });
    $("#previousBtn").click(function() {
        trym2.switchLesson(-1);
        $(this).removeClass("ui-state-focus");
    });

    trym2.getTutorials(0, tutorialNames, function() {
        trym2.makeAccordion(trym2.tutorials);
    });
    
    navBar.activate("home"); 
});
