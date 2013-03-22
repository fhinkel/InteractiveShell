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
    $("#sendBtn").show();
    $("#pageIndex").hide();
    $("#previousBtn").hide();
    $("#nextBtn").hide();
    $("#TOC").hide();
    return false;
};

trym2.loadLesson = function(ell) {
    $("#inputarea").hide();
    var lessonContent = $('[lessonid="' + ell + '"]').html();
    $("#sendBtn").hide();
    $("#previousBtn").show();
    $("#nextBtn").show();    
    $("#pageIndex").button("option", "label", trym2.lessonNr + "/" + trym2.maxLesson).show();
    $("#lesson").html(lessonContent).show();
    $("#TOC").hide();    
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
    $("#menuTutorial").load(tutorialFile, function() {
        var titles = "<h3>" + $("#menuTutorial title").text() + "</h3>";
        titles = titles + "<div> <ul>";
        var i = 1;
        $("#menuTutorial h4").each(function() {
            var title = $(this).text();
            titles = titles + "<li><a class='submenuItem' lessonid='lesson" +
                i + "'>" + title + "</a></li>";
            i = i + 1;
            //console.log("Title in m2.js: " + title);
        });
        titles = titles + "</ul></div>";
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
                //console.log("We got a chat message: ");
                $("#M2Out").val($("#M2Out").val() + msg);
                trym2.scrollDown("#M2Out");
            }

        }
    }
};

trym2.getAllTitles = function(tutorials, next) {
    for(var tutorial in tutorials) {
        trym2.getLessonTitles(tutorials[tutorial],  function(titles) { 
    		$("#accordion").append( titles ); 
    		console.log("Titles: " + titles);
            
    	});
	}	
	next();
};


$(document).ready(function() {
    // send server our client.eventStream
    trym2.startEventSource();
    
    $("button").button();
    $("#previousBtn").button({
        icons: {primary: "ui-icon-arrowthick-1-w" },
        text: false
    });
    $("#nextBtn").button({
        icons: {primary: "ui-icon-arrowthick-1-e" },
        text: false
    });

    $('#M2In').val(
        "Evaluate a line by typing Shift+Enter or by clicking on Evaluate.\nHere are some sample commands:\n---------------\nR = ZZ/101[a,b,c]\nS = ZZ/32003[vars(1..10)]\nQQ[x_1..x_6]\n\nS = ZZ/32003[vars(1..13)]\nres coker vars S\n");

    $(document).on("click", ".submenuItem", function() {
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
        $('#helpBtn').click(trym2.helpScreen);
    }
    $("#sendBtn").click(trym2.sendCallback('#M2In'));
    $('#M2In').keypress(trym2.sendOnEnterCallback('#M2In'));
    $("#resetBtn").click(trym2.postMessage('/restart'));
    $("#interruptBtn").click(trym2.postMessage('/interrupt'));
    $("#terminalBtn").click(trym2.showTerminal);
    $(document).on("click", "#inputTerminalLink", trym2.showTerminal);
    $("#uploadBtn").click(trym2.doUpfileClick);
    $("#upfile").change(trym2.doUpload);

    $("#showLessonBtn").click(function() {
        trym2.loadLesson(trym2.lessonNr);
        //console.log("lesson!");
    });
    
    $("#TOCBtn").click(function(){
        $("#inputarea").hide();
        $("#sendBtn").hide();
        $("#lesson").hide();
        $("#pageIndex").hide();
        $("#previousBtn").hide();
        $("#nextBtn").hide();
        $("#TOC").show();
    });


    $(document).on("click", "code", function() {
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
    $("#TOC").hide();
    $("#sendBtn").hide();
    $("#pageIndex").hide();
    $("#previousBtn").hide();
    $("#nextBtn").hide();

    var tutorials = ["tutorials/welcome.html", "tutorials/Beginning.html", "tutorials/Beginning.html"];
    $("#TOC").append("<div id=\"accordion\"></div>");
    
    trym2.getAllTitles(tutorials, function() {
        console.log("accordion()");
    	$("#accordion").accordion();
    });
    

    

    
    var lessonContent = $('[lessonid="' + trym2.lessonNr + '"]').html();
    $("#lesson").html(lessonContent).show();
    
    
    trym2.maxLesson = $('#tutorial').children().length;
    //console.log("maxLesson: " + trym2.maxLesson);

    $("#nextBtn").click(function() {
        trym2.switchLesson(1);
    });
    $("#previousBtn").click(function() {
        trym2.switchLesson(-1);
    });

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


