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


var shellTextArea = require('shell-emulator');


// this global variable changes the content on the left as the users
// naviges between home, tutorial, and input
// tabs are hard coded as home, tutorial, and input
// the controller assures that always exactly one tab from the tabs list is active. 
trym2.navBar = function () {
    var Tab = function (elements, btn, showFunction) {
        this.elements = elements;
        this.btn = btn;
        this.show = showFunction;
    };

    var homeTab = new Tab(["#home"],
        "#homeBtn",
        function () {
            console.log("home.show()");
        }
    );

    var tutorialTab = new Tab(["#lesson", "#previousBtn", "#nextBtn", "#pageIndex"],
        "#tutorialBtn",
        function () {
            console.log("tutorial.show()");
            var maxLesson = trym2.tutorials[trym2.tutorialNr].lessons.length;
            $("#pageIndex").button("option", "label", (trym2.lessonNr + 1) + "/" +
                maxLesson).show().unbind().css('cursor', 'default');
        }
    );

    var inputTab = new Tab(["#inputarea", "#sendBtn"],
        "#inputBtn",
        function () {
            console.log("input.show()");
        }
    );
    this.tabs = {
        "home": homeTab,
        "tutorial": tutorialTab,
        "input": inputTab
    };
    return this;
}();


///////////////////
// Tutorial code //
///////////////////


trym2.tutorials = [];

trym2.accordionCssClasses = {
    titleSymbol: "ui-icon ui-accordion-header-icon ui-icon-triangle-1-e",
    title: "ui-accordion-header ui-helper-reset ui-state-default ui-corner-all ui-accordion-icons",
    titleHover: "ui-state-hover",
    titleToggleClass: "ui-accordion-header-active ui-state-active ui-corner-all ui-corner-top",
    titleSymbolToggleClass: "ui-icon-triangle-1-e ui-icon-triangle-1-s",
    content: "ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom"
};

trym2.appendTutorialToAccordion = function (title, lessons, index) {
    title.wrapInner("<a href='#' class='menuTitle' tutorialid=" + index + "/>")
        .addClass(trym2.accordionCssClasses.title)
        .prepend(
            '<span class="' + trym2.accordionCssClasses.titleSymbol + '"></span>')
        .hover(function () {
            $(this).toggleClass(trym2.accordionCssClasses.titleHover);
        })
        .click(function () {
            $(this).toggleClass(trym2.accordionCssClasses.titleToggleClass)
                .find("> .ui-icon").toggleClass(
                trym2.accordionCssClasses.titleSymbolToggleClass).end()
                .next().slideToggle(trym2.scrollDownUntilTutorialVisible);
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
            trym2.accordionCssClasses.content)
            .hide();
    } else {
        // Expand the first tutorial:
        title.toggleClass(
            trym2.accordionCssClasses.titleToggleClass)
            .find("> .ui-icon").toggleClass(
            trym2.accordionCssClasses.titleSymbolToggleClass);
        div.append(content).addClass(
            trym2.accordionCssClasses.content);
    }
    $("#loadTutorialMenu").before(title);
    $("#loadTutorialMenu").before(div);
};

trym2.appendLoadTutorialMenuToAccordion = function () {
    trym2.appendLoadTutorialTitleToAccordion();
    trym2.appendInstructionsToAccordion();
    trym2.addExpandLoadTutorialInstructionsButton();
    trym2.addLoadTutorialButton();
};

trym2.addLoadTutorialButton = function () {
    console.log("Adding buttons.");
    var loadTutorialButton = $("<a>");
    loadTutorialButton.prop("id", "loadTutorialButton");
    loadTutorialButton.html("Load Tutorial");
    $("#loadTutorialMenu").append(loadTutorialButton);
    $("#loadTutorialButton").click(trym2.doUptutorialClick);
};

trym2.addExpandLoadTutorialInstructionsButton = function () {
    var expandButton = $("<span>");
    expandButton.addClass(trym2.accordionCssClasses.titleSymbol);
    expandButton.click(function () {
        var title = $("#loadTutorialMenu");
        var instructions = $("#loadTutorialInstructions");
        expandButton.toggleClass(trym2.accordionCssClasses.titleSymbolToggleClass);
        title.toggleClass(
            trym2.accordionCssClasses.titleToggleClass);
        instructions.slideToggle(trym2.scrollDownUntilTutorialVisible);
    });
    $("#loadTutorialMenu").append(expandButton);

};

trym2.scrollDownUntilTutorialVisible = function(){
    var y = $(this).position().top;
    var height = parseInt($("#home").css('height'), 10);
    var total_height = parseInt($(this).css('height'), 10) + 50;
    if (height - y < total_height) {
        var scroll = total_height - height + y;
        $("#home").animate({
            scrollTop: ($("#home").scrollTop() + scroll)
        }, 400);
    }
};

trym2.appendLoadTutorialTitleToAccordion = function () {
    console.log("Adding Title.");
    var title = $("<h3>");
    title.prop("id", "loadTutorialMenu");
    title.addClass(
        trym2.accordionCssClasses.title);
    $("#accordion").append(title);
};

trym2.appendInstructionsToAccordion = function () {
    console.log("Adding Instructions.");
    var instructions = $("<div>");
    $.get("uploadTutorialHelp.txt", function (content) {
        instructions.append(content);
    });
    instructions.prop("id", "loadTutorialInstructions");
    instructions.addClass(
        trym2.accordionCssClasses.content).hide();
    $("#accordion").append(instructions);
};

trym2.makeAccordion = function (tutorials) {
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

trym2.showLesson = function (e) {
    var lessonId,
        lessonIdNr,
        tutorialId = $(this).attr('tutorialid'),
        tutorialIdNr = parseInt(tutorialId.match(/\d/g), 10);
    if (e.data && e.data.lessonIdNr) {
        lessonIdNr = parseInt(e.data.lessonIdNr, 10);
    } else { // Get number from link attribute
        lessonId = $(this).attr('lessonid'),
            lessonIdNr = parseInt(lessonId.match(/\d/g), 10);
    }
    //console.log("LessonID: " + lessonId);
    //console.log("You clicked a submenuItem: " + $(this).html());
    trym2.loadLesson(tutorialIdNr, lessonIdNr);

    $(".mdl-layout__tab:eq(1) span").click ();
    return false;
};

trym2.loadLesson = function (tutorialid, lessonid) {
    console.log(this.tutorialNr + "==" + tutorialid + " or " + this.lessonNr + "==" +
        lessonid);
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
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, "#lesson"])
    }
};

trym2.switchLesson = function (incr) {
    //console.log("Current lessonNr " + trym2.lessonNr);
    this.loadLesson(this.tutorialNr, this.lessonNr + incr);
    $(".mdl-layout__tab:eq(1) span").click ();

};


trym2.inspect = function (obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            console.log("inspect: " + prop + " : " + obj.prop);
        }
    }
};


trym2.postMessage = function (msg, notrack) {
    console.log("Posting msg " + msg);
    trym2.socket.emit('input', msg);
    if (!notrack) {
// Closure to capture the file information.
        $("#M2Out").trigger("track", msg);
        console.log("Tracking.");
    }
    return true;
};

trym2.sendCallback = function (id) {
    return function () {
        var str = trym2.getSelected(id);
        trym2.postMessage(str);
        return false;
    };
};

trym2.sendOnEnterCallback = function (id) {
    return function (e) {
        if (e.which === 13 && e.shiftKey) {
            e.preventDefault();
            // do not make a line break or remove selected text when sending
            trym2.postMessage(trym2.getSelected(id));
        }
    };
};

trym2.doUptutorialClick = function () {
    $("#uptutorial").val("");
    console.log("Click tutorial: " + typeof($("#uptutorial")));
    $("#uptutorial").click();
};


trym2.saveInteractions = function () {
    var input = $("#M2In");
    var output = $("#M2Out");
    var inputParagraph = $("<p>");
    var downloadLink = require('create-download-link');
    inputParagraph.append(downloadLink({
        data: input.val(),
        title: "Content of input window",
        filename: mathProgramName + "In.txt"
    }));
    var outputParagraph = $("<p>");
    outputParagraph.append(downloadLink({
        data: output.val(),
        title: "Content of terminal",
        filename: mathProgramName + "Out.txt"
    }));
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

trym2.uploadTutorial = function () {
    var obj = this;
    var files = this.files;
    console.log("number of files in upload tutorial: " + files.length);
    file = files[0];
    var fileName = file.name;
    console.log("Process file for tutorial upload:" + fileName);

    var reader = new FileReader();

    reader.readAsText(file);
    reader.onload = function (event) {
        var resultHtml = event.target.result;
        console.log(resultHtml);
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
$(document).ready(function () {

    trym2.getSelected = require('get-selected-text');

    trym2.socket = io();


    trym2.socket.on('result', function (msg) {
        if (msg !== "") {
            $("#M2Out").trigger("onmessage", msg);
        }
    });

    trym2.socket.on('serverDisconnect', function (msg) {
        console.log("We got disconnected. " + msg);
        $("#M2Out").trigger("onmessage", " Sorry, your session was disconnected by the server.\n\n");
        trym2.serverDisconnect = true;
    });
    trym2.socket.oldEmit = trym2.socket.emit;
    trym2.socket.emit = function (event, msg) {
        if (trym2.serverDisconnect) {
            var events = ['reset', 'input'];
            console.log("We are disconnected.");
            if (events.indexOf(event) != -1) {
                // console.log("Will not reconnect for " + event);
                trym2.socket.connect();
                trym2.serverDisconnect = false;
                trym2.socket.oldEmit(event, msg);
            } else {
            }
        } else {
            trym2.socket.oldEmit(event, msg);
        }
    };


    trym2.socket.on('image', function (imageUrl) {
        if (imageUrl) {
            console.log("We received an image: " + imageUrl);
            var graphBtn = $('<a href="#">').html(imageUrl.split('/').pop())
                .button({
                    icons: {
                        primary: "ui-icon-document"
                    }
                }).on('click', function () {
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

    trym2.socket.on('viewHelp', function (helpUrl) {
        if (helpUrl) {
            console.log("We got a viewHelp! " + helpUrl);
            window.open(helpUrl, "M2 Help");
        }
    });

    // Init procedures for right hand side.
    $("#M2Out").val("");

    var shellFunctions = {
        postMessage: trym2.postMessage,
        interrupt: function () {
            trym2.postMessage(ctrlc, true)
        }
    };
    shellTextArea.create($("#M2Out"), $("#M2In"), shellFunctions);

    $("#navigation").children("input").attr("name", "navbutton");
    $("#navigation").buttonset();
    $(".buttonset").buttonset();

    $("button").button();
    $("#previousBtn").button({
        icons: {primary: "ui-icon-arrowthick-1-w"},
        text: false
    }).click(function () {
        trym2.switchLesson(-1);
        $(this).removeClass("ui-state-focus");
    });

    $("#nextBtn").button({
        icons: {primary: "ui-icon-arrowthick-1-e"},
        text: false
    }).click(function () {
        trym2.switchLesson(1);
        $(this).removeClass("ui-state-focus");
    });


    $('#M2In').val(DefaultText);
    $("#sendBtn").click(trym2.sendCallback('M2In'));
    $('#M2In').keypress(trym2.sendOnEnterCallback('M2In'));
    $("#resetBtn").click(function () {
        $("#M2Out").trigger("reset");
        trym2.socket.emit('reset')
    });
    $("#interruptBtn").click(function () {
        trym2.postMessage(ctrlc, true)
    });
    $("#inputBtn").click(function () {
        $(".mdl-layout__tab:eq(2) span").click ();
    });
    $("#saveBtn").click(trym2.saveInteractions);

    var siofu = new SocketIOFileUpload(trym2.socket);

    document.getElementById("uploadBtn").addEventListener('click', siofu.prompt, false);

    siofu.addEventListener("complete", function (event) {
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

    siofu.addEventListener("complete", function (event) {
        console.log('we uploaded the file: ' + event.success);
        console.log(event.file);
    });

    $("#uptutorial").on('change', trym2.uploadTutorial);

    $("#tutorialBtn").click(function () {
        trym2.loadLesson(trym2.tutorialNr, trym2.lessonNr);
        $(".mdl-layout__tab:eq(1) span").click ();
    });

    $("#homeBtn").click(function () {
        $(".mdl-layout__tab:eq(0) span").click ();
    });

    $(document).on("click", ".submenuItem", trym2.showLesson);

    $(document).on("click", "code", function () {
        $(this).effect("highlight", {
            color: 'red'
        }, 300);
        var code = $(this).text();
        code = code + "\n";
        $("#M2In").val($("#M2In").val() + code);
        require('scroll-down')($("#M2In"));
        trym2.postMessage(code);
    });

    $(document).on("click", "code2", function () {
        $(this).effect("highlight", {
            color: 'red'
        }, 300);
        var code = $(this).text();
        code = code + "\n";
        $("#M2In").val($("#M2In").val() + code);
        require('scroll-down')($("#M2In"));
        trym2.postMessage(code);
    });

    trym2.importTutorials();
});
