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
        scrollDown: trym2.scrollDown,
        postMessage: trym2.postMessage,
        interrupt: function(){trym2.postMessage(ctrlc, true)}
    };
    
    shellObject($("#M2Out"), $("#M2In"), shellFunctions);

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
