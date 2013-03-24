/*global $, alert, console, document, trym2, window */

var trym2 = {
    lessonNr: 1,
    tutorialNr: 0,
    tutorialScrollTop: 0,  // this value is where we set the scrollTop of "#lesson" so we can reset it back
                           // when we navigate back (from Input or Index views).
    tutorials: [],
    maxLesson: 1
};

///////////////////
// Tutorial code //
///////////////////

trym2.tutorials = [];

trym2.makeTutorial = function(theUrl, theHtml) {
    // populate a Tutorial element, and return it
    var theLessons = [];
    var tutorial = $("<div>").html(theHtml);
    $("div", tutorial).each(function() {
        theLessons.push({title: $("h4", $(this)).text(),
                             html: $(this)});
    });
    return { // class Tutorial
        url: theUrl,
        title: $("<h3>").append($("title",tutorial).text()),
        current: 0,
        lessons: theLessons
    };
};

trym2.makeAccordion = function(tutorials) {
    for (var i=0; i<tutorials.length; i++) {
        var title = tutorials[i].title;
        title = $("<div><a href='#'>").html(title);
        console.log("title: " + title.text());
        title.addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-all ui-accordion-icons")
        .prepend('<span class="ui-icon ui-accordion-header-icon ui-icon-triangle-1-e"></span>')
        .hover(function() {$(this).toggleClass("ui-state-hover");})
        .click(function() {
            $(this)
            .toggleClass("ui-accordion-header-active ui-state-active ui-corner-all ui-corner-top")
            .find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
            .next().slideToggle();
            return false;
        })
       .next();

       var div = $("<div>");
       var content = '<ul>';
       var lessons = tutorials[i].lessons;
       for (var j=0; j<lessons.length; j++) {
           content = content + '<li><a href="#" class="submenuItem" tutorialid=' + i +
               ' lessonid=' + j + '>  ' + lessons[j].title + '</a></li>';
       };
       content = content + '</ul>';
       div.append(content).addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom").hide();
        $("#accordion").append(title).append(div);

    };
    $("#accordion").addClass("ui-accordion ui-widget ui-helper-reset");
};

trym2.submenuItemCallback = function() {
    var lessonId = $(this).attr('lessonid'),
        tutorialId = $(this).attr('tutorialid'),
        lessonIdNr = parseInt(lessonId.match(/\d/g), 10),
        tutorialIdNr = parseInt(tutorialId.match(/\d/g), 10);
    //console.log("You clicked a submenuItem: " + $(this).html());
    trym2.loadLesson(tutorialIdNr, lessonIdNr);
    $("#tutorialBtn").prop("checked", true).button("refresh");
    return false;
};

trym2.loadLesson = function(tutorialid, lessonid) {
    var changedLesson = (trym2.tutorialNr != tutorialid || trym2.lessonIdNr != lessonid);

    if (tutorialid >= 0 && tutorialid < trym2.tutorials.length) {
        trym2.tutorialNr = tutorialid;
    };
    if (lessonid >= 0 && lessonid < trym2.tutorials[trym2.tutorialNr].lessons.length) {
        trym2.lessonNr = lessonid;
    };
    var maxLesson = trym2.tutorials[trym2.tutorialNr].lessons.length;
    var lessonContent = trym2.tutorials[trym2.tutorialNr].lessons[trym2.lessonNr].html;
    $("#inputarea").hide();
    $("#sendBtn").hide();
    $("#previousBtn").show();
    $("#nextBtn").show();    
    $("#pageIndex").button("option", "label", (trym2.lessonNr+1) + "/" + maxLesson).show().unbind().css('cursor', 'default');;
    if (changedLesson) {
        $("#lesson").html(lessonContent).show();
        $("#lesson").scrollTop(0);
    };
    $("#TOC").hide();    
};

trym2.switchLesson = function(incr) {
    //console.log("Current lessonNr " + trym2.lessonNr);
    //console.log("maxlesson " + trym2.maxLesson);
    trym2.loadLesson(trym2.tutorialNr, trym2.lessonNr + incr);
};

trym2.getTutorials = function(i, tutorialNames, whenDone) {
    if (i < tutorialNames.length) {
        $.get(tutorialNames[i], function(resultHtml) {
            trym2.tutorials[i] = trym2.makeTutorial(tutorialNames[i], resultHtml);
            console.log(trym2.tutorials[i].title);
            trym2.getTutorials(i+1, tutorialNames, whenDone);
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
            titles = titles + "<li><a href='#' class='submenuItem' lessonid='lesson" +
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
    if ( i < tutorials.length) {
        trym2.getLessonTitles(tutorials[i],  function(titles) { 
    		$("#accordion").append( titles ); 
    		console.log("Titles: " + titles);
    		trym2.getAllTitles(i+1, tutorials, next);
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
    $(area).scrollTop($(area)[0].scrollHeight);
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
    trym2.tutorialScrollTop = $("#lesson").scrollTop();
    $("#lesson").hide();
    $("#inputarea").show();
    $("#sendBtn").show();
    $("#pageIndex").hide();
    $("#previousBtn").hide();
    $("#nextBtn").hide();
    $("#TOC").hide();
    return false;
};

trym2.showTOC = function(){
    trym2.tutorialScrollTop = $("#lesson").scrollTop();
    $("#inputarea").hide();
    $("#sendBtn").hide();
    $("#lesson").hide();
    $("#pageIndex").hide();
    $("#previousBtn").hide();
    $("#nextBtn").hide();
    $("#TOC").show();
    return false;
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

trym2.saveFiles = function(filenames) {
   $("<div></div>").html('<p><a href="' + filenames.input + '" target="_blank">Input</a>')
        .append('<p><a href="' + filenames.output + '" target="_blank">Output</a>')
        .append("<span autofocus='autofocus'></span>")
        .dialog({title: "Download" }).attr('id', 'save-dialog');
    $("#save-dialog a").button({
        icons: {primary: "ui-icon-document" }
    });
};

trym2.doUpfileClick = function () {
    $("#upfile").click();
};

trym2.saveInteractions = function() {
    var xhr = new XMLHttpRequest(); // Create a new XHR
    //console.log( "URL: " + url);
    var msg = { input: $("#M2In").val(),
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

trym2.doUpload = function () {
    var obj = this;
    var file = obj.files[0];
    var fileName = obj.value.split("\\");
    var formData = new FormData();
    formData.append('file', file);
    console.log("process form " + file );
    console.log(file.size);      
    if (file.size > trym2.MAXFILESIZE) {
        $("<div><span class='ui-icon ui-icon-alert ' style='float: left; margin-right: .3em;'></span>Your file is too big to upload.  Sorry!</div>").dialog({
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
                $("<div><span class='ui-icon ui-icon-alert ' style='float: left; margin-right: .3em;'>Uploading failed.</div>").dialog({dialogClass: 'alert' });
            }
        },
        success: function(data) {
            console.log("File uploaded successfully!" + data);
            $("<div class='smallFont'>" + fileName +
                  " has been uploaded and you can use it by loading it into your Macaulay2 session (use the input terminal).</div>")
                  .dialog({  dialogClass: ' alert', title: 'File uploaded' });
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
                var graphBtn = $('<a href="#">').html(imageUrl.split('/').pop()).button({
                    icons: {primary: "ui-icon-document" }
                }).on('click',  function() {
                        window.open(imageUrl, '_blank', 'height=200,width=200,toolbar=0,location=0,menubar=0');
                        $(".graph-dialog").dialog("close");
                        return false;
                    });
                $("<div></div>").html(graphBtn).dialog({title: 'Image', dialogClass: 'alert'}).addClass('graph-dialog');
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


$(document).ready(function() {
    // send server our client.eventStream
    trym2.startEventSource();
  
    // Restarting the EventSource after pressing 'esc':
      $(document).keyup(function(e) {
        console.log("Got a key:"+e.keyCode);
        if (e.keyCode == 27) { 
         trym2.startEventSource();
          }   // esc
      }); 
    
    $("#navigation").children("input").attr("name", "navbutton");
    $("#navigation").buttonset();
    $(".buttonset").buttonset();

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
    $("#inputBtn").click(trym2.showTerminal);
    $("#saveBtn").click(trym2.saveInteractions);
    $("#uploadBtn").click(trym2.doUpfileClick);
    $("#upfile").change(trym2.doUpload);

    $("#tutorialBtn").click(function() {
        trym2.loadLesson(trym2.tutorialNr, trym2.lessonNr);
        if (trym2.tutorialScrollTop != 0) 
            $("#lesson").scrollTop(trym2.tutorialScrollTop);
        trym2.tutorialScrollTop = 0;
        //console.log("lesson!");
    });
    
    $("#homeBtn").click(trym2.showTOC);

    $(document).on("click", ".submenuItem", trym2.submenuItemCallback);

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

    var tutorialNames = ["tutorials/welcome2.html", "tutorials/Beginning.html", "tutorials/Beginning.html"];
    $("#TOC").append("<div id=\"accordion\"></div>");
    
    trym2.getTutorials(0, tutorialNames, function() {
        trym2.makeAccordion(trym2.tutorials);
        // Do we actually need this line?
        trym2.loadLesson(0, 0); // welcome tutorial
        // The before line loaded the tutorial.
        // To get out 'home' page we have to click the corresponding button.
        // Instead one could also call the corrsponding method, but this
        // really doesn't make any difference.
        $("#homeBtn").click();
    });


    $("#nextBtn").click(function() {
        trym2.switchLesson(1);
        $(this).removeClass("ui-state-focus");
    });
    $("#previousBtn").click(function() {
        trym2.switchLesson(-1);
        $(this).removeClass("ui-state-focus");
    });
    
    $(document).on("click", "#selectTutorialLink", function() {
        $("#homeBtn").trigger("click");
        $("#homeBtn").prop("checked", true).button("refresh");
        return false;
    });
    $(document).on("click", "#inputTerminalLink", function() {
        //$("#inputBtn").trigger("click");
        $("#inputBtn").trigger("click");
        $("#inputBtn").prop("checked", true).button("refresh");
        return false;
    });
    
    
});


