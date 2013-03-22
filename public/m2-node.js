/*global $, alert, console, document, trym2, window */

var trym2 = {
    lessonNr: 1,
    maxLesson: 1
};

trym2.MAXFILESIZE = 500000; // max size in bytes for file uploads

trym2.inspect = function(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            console.log("inspect: " + prop + " : " + obj.prop);
        }
    }
};

trym2.scrollDown = function(area) {
    var mySize = $(area).val().length;
    $(area).scrollTop(mySize);
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
        start = 1 + str.lastIndexOf("\n", end - 1);
        endPos = str.indexOf("\n", start);
        if (endPos !== -1) {
            end = endPos;
        } else {
            end = str.length;
        }
    }
    return str.slice(start, end) + "\n";
};

trym2.showTerminal = function() {
    $("#lesson").hide();
    $("#inputarea").show();
    $("#send").show();
    $("#pageIndex").hide();
    $("#previous").hide();
    $("#next").hide();
    $("#showLesson").show();
    $("#terminal").hide();
    return false;
};

trym2.loadLesson = function(ell) {
    $("#inputarea").hide();
    var lessonContent = $('[lessonid="' + ell + '"]').html();
    $("#send").hide();
    $("#previous").show();
    $("#next").show();
    $("#pageIndex").text(trym2.lessonNr + "/" + trym2.maxLesson).show();
    $("#lesson").html(lessonContent).show();
    $("#showLesson").hide();
    $("#terminal").show();
};

trym2.switchLesson = function(incr) {
    //console.log("Current lessonNr " + trym2.lessonNr);
    //console.log("maxlesson " + trym2.maxLesson);
    trym2.lessonNr = trym2.lessonNr + incr;
    if (trym2.lessonNr >= 1 && trym2.lessonNr <= trym2.maxLesson) {
        //console.log("Switch lesson");
        trym2.loadLesson(trym2.lessonNr);
        $("#lesson").scrollTop(0);
    } else {
        trym2.lessonNr = trym2.lessonNr - incr;
        //alert("lesson with " + trym2.lessonNr + "." + incr + " not available");
    }
};

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
                    console.log("We must have lost the EventSource Stream, redoing it...");
                    //ask for new EventSource and send msg again
                    trym2.startEventSource();
                    setTimeout(function() {
                        trym2.postMessage("/chat", msg)();
                    }, 1000);
                }
            }
        };
        xhr.send(msg); // Send the message
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

trym2.helpScreen = function() {
    //console.log("Display Help.");
    $("#help-dialog").dialog('open');
    $("#help-dialog").scrollTop(0);


};

// input: filename with tutorial content
// return a list of lessons title, each wrapped in a div and link, 
// <div><a>" + title + "</a></div>  
// attach a lesson ID
trym2.getLessonTitles = function(tutorialFile, callback) {
    var titles = "";
    $("#menuTutorial").load(tutorialFile, function() {
        var i = 1;
        $("#menuTutorial h4").each(function() {
            var title = $(this).text();
            titles = titles + "<div><a class='submenuItem' lessonid='lesson" +
                i + "'>" + title + "</a></div>";
            i = i + 1;
            //console.log("Title in m2.js: " + title);
        });
        //console.log("All titles: " + titles);
        callback(titles);
    });
};

trym2.doUpfileClick = function () {
    $("#upfile").click();
};

trym2.doUpload = function () {
    var obj = this;
    var file = obj.files[0];
    var fileName = obj.value.split("\\");
    var formData = new FormData();
    formData.append('file', file);
    console.log("process form " + file );
    console.log(file.size);      
    if (file.size > trym2.MAXFILESIZE) {
        alert("Your file is too big to upload.  Sorry!");
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
                alert("Uploading failed.");
            }
        },
        success: function(data) {
            console.log("File uploaded successfully!" + data);
            alert(fileName +
                  " has been uploaded and you can use it by loading it into your Macaulay2 session (use the input terminal).");
            
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
                $('#graphDialog').html('<a href="#" id="newGraph">Click for image</a>');
                $('#graphDialog').dialog();
                $('#newGraph').click(function() {
                    window.open(imageUrl, '_blank', 'height=200,width=200,toolbar=0,location=0,menubar=0');
                    $("#graphDialog").dialog("close");
                    return false;
                });
//                ({
//                    //height: 340,
//                    //width: 460,
//                    modal: true,
//                    autoOpen: true
//                });
            }
        }, false);
        chat.addEventListener('viewHelp', function(event) {
            var helpUrl = event.origin + event.data;
            console.log("viewHelp coming from: " + event.origin);
            if (helpUrl) {
                console.log("We got a viewHelp! " + helpUrl);
                window.open(helpUrl, "M2 Help");
                //$('#viewHelp').load(helpUrl);
                //alert('Help is available here: ' + helpUrl);
            }
        }, false);
        chat.onmessage = function(event) { // When a new message arrives
            var msg = event.data; // Get text from event object
            //console.log(event);
            if (msg !== "") {
                //console.log("We got a chat message: ");
                $("#M2Out").val($("#M2Out").val() + msg);
                trym2.scrollDown("#M2Out");
            }

        }
    }
};

$(document).ready(function() {
    // send server our client.eventStream
    trym2.startEventSource();
    var extruderMenu = $("#extruderTop").buildMbExtruder({
        position: "top",
        width: 350,
        extruderOpacity: 1,
        onExtOpen: function() {},
        onExtContentLoad: function() {},
        onExtClose: function() {}
    });

    $('#M2In').val(
        "Evaluate a line by typing Shift+Enter or by clicking on Evaluate.\nHere are some sample commands:\n---------------\nR = ZZ/101[a,b,c]\nS = ZZ/32003[vars(1..10)]\nQQ[x_1..x_6]\n\nS = ZZ/32003[vars(1..13)]\nres coker vars S\n");

    $('.submenuItem').live("click", function() {
        var i = 1,
            lessonId = $(this).attr('lessonid');
        //console.log("You clicked a submenuItem: " + $(this).html());
        trym2.lessonNr = parseInt(lessonId.match(/\d/g), 10);
        $("#tutorial").html($("#menuTutorial").html());
        $("#tutorial h4").each(function() {
            $(this).parent().attr('lessonid', i); // add an ID to every lesson div
            i = i + 1;
        });
        trym2.maxLesson = i - 1;
        trym2.loadLesson(trym2.lessonNr);
    });

    if ( !! window.EventSource) {
        $('#help-dialog').dialog({
            height: 340,
            width: 460,
            modal: true,
            autoOpen: false
        });
        $('#help').click(trym2.helpScreen);
    }
    $("#send").click(trym2.sendCallback('#M2In'));
    $('#M2In').keypress(trym2.sendOnEnterCallback('#M2In'));
    $("#reset").click(trym2.postMessage('/restart'));
    $("#interrupt").click(trym2.postMessage('/interrupt'));
    $("#terminal").click(trym2.showTerminal);
    $("#inputTerminalLink").live("click", trym2.showTerminal);

    $("#upload").click(trym2.doUpfileClick);
    $("#upfile").change(trym2.doUpload);

    $("#showLesson").click(function() {
        trym2.loadLesson(trym2.lessonNr);
        //console.log("lesson!");
    });


    $("code").live("click", function() {
        $(this).effect("highlight", {
            color: 'red'
        }, 300);
        var code = $(this).text();
        code = code + "\n";
        $("#M2In").val($("#M2In").val() + code);
        trym2.scrollDown("#M2In");
        trym2.postMessage('/chat', code)();
    });

    $("#inputarea").hide();
    $("#send").hide();

    $("#pageIndex").hide();

    //$("#tutorial").html("<div class='lesson' lessonid='1'>  <div><br>Get started by <a href='#' id='selectTutorialLink'><b>selecting a tutorial</b></a> or by using the <a href='#' id='inputTerminalLink'><b>Input Terminal</b></a>. Have fun!<br> <br><a href='http://www.math.uiuc.edu/Macaulay2/'>Macaulay2</a> is a software system devoted to supporting research in algebraic geometry and commutative algebra, whose creation has been funded by the National Science Foundation since 1992. </p> <p> To get started, select a tutorial. Click on any highlighted code, Macaulay2 will execute it. The result is displayed on the right. Alternatively, you can use the <b>Input Terminal</b> on the left to write your own commands. Execute a line by positioning your cursor on it and click on the Evaluate button (or type Shift-Enter). You can switch back to the tutorial at any time. </p> <p>The tutorials demonstrate different aspects of Macaulay2. They are meant to be starting points for your own experimentation. Edit the commands in the <b>Input Terminal</b> and run them again. Whenever you're ready to move on, click the Next button.</p>");
    $("#tutorial").html(
        "<div class='lesson' lessonid='1'>  <div><br>Get started by <a href='#' id='selectTutorialLink'><b>selecting a tutorial</b></a> or by using the <a href='#' id='inputTerminalLink'><b>Input Terminal</b></a>. Have fun!<br> <p><code>viewHelp \"set\"</code><br><code> needsPackage \"Graphs\"<br>\nA = graph({{x_1,x_3},{x_2,x_4},{x_1,x_4}})<br>\ndisplayGraph A</code><p><code>4+3*9</code><br><code>apply(10, i -> i *17)</code><br><code>R = ZZ/3[a,b,c]</code><br><code>groebnerBasis ideal(a^2, a*b-b*b, -c^2)</code><br><a href='http://www.math.uiuc.edu/Macaulay2/'>Macaulay2</a> is a software system devoted to supporting research in algebraic geometry and commutative algebra, whose creation has been funded by the National Science Foundation since 1992. </p> <p> To get started, select a tutorial. Click on any highlighted code, Macaulay2 will execute it. The result is displayed on the right. Alternatively, you can use the <b>Input Terminal</b> on the left to write your own commands. Execute a line by positioning your cursor on it and click on the Evaluate button (or type Shift-Enter). You can switch back to the tutorial at any time. </p> <p>The tutorials demonstrate different aspects of Macaulay2. They are meant to be starting points for your own experimentation. Edit the commands in the <b>Input Terminal</b> and run them again. Whenever you're ready to move on, click the Next button.</p>");
    // <code>3+18</code><br>    <code>version</code><br>    <code> exit </code> <br>   <code> R = ZZ/101[vars(0..13)] </code> <br><code> gbTrace=1 </code> <br> <code> time res coker vars R </code> <br>  <code> m1 = genericMatrix(R,a,3,3) </code> <br> <code> m2 = genericMatrix(R,j,3,3) </code> <br> <code> J = ideal(m1*m2-m2*m1) </code> <br> <code> C = res J </code> <br> <code> C.dd_3 </code> <br> 

    $("#selectTutorialLink").live("click", function() {
        //console.log("open tutorial menu");
        extruderMenu.openMbExtruder();
        return false;
    });

    trym2.loadLesson(trym2.lessonNr);
    trym2.maxLesson = $('#tutorial').children().length;
    //console.log("maxLesson: " + trym2.maxLesson);

    $("#next").click(function() {
        trym2.switchLesson(1);
    });
    $("#previous").click(function() {
        trym2.switchLesson(-1);
    });

    $("#next").hide();
    $("#previous").hide();
    $("#showLesson").hide();

    // swipe changed to swipeXXX to remove functionality for testing
    $(function() {
        $("#leftwindow").bind("swipeXXX", function(event, info) {
            if (info.direction === "left") {
                trym2.switchLesson(1);
            } else if (info.direction === "right") {
                trym2.switchLesson(-1);
            } else {
                alert("swiped: huh?");
            }
        });
    });
});


