var offset=0;
var waitingtime=2500; // in ms.  Each time we poll for data and don't receive it, we wait longer.
var maxwaitingtime=60*1000*10; // 10 minutes
var minwaitingtime=100; // 250;

var lessonNr = 1;
var maxLesson = 1;

var tutorial;
var timerobject;

jQuery.fn.toggleNext = function() {
    this.toggleClass("arrow-down").next().slideToggle("fast");
    return this;
};

$(document).ready(function() {
	
/*	$('.franzi').live("click", function(){
		//alert("lesson in tutorial was just clicked");
		$("#tmp").load('tutorial.html h4');
		//console.log( $("#tmp").html() );
		//alert( $("#tmp").text()  );
	})*/
	
	$('#help-dialog').dialog({
			height: 340,
			width: 460,
			modal: true,
			autoOpen: false
		});
	$('#help').click(helpScreen );
	
	
    SyntaxHighlighter.all();
	$('ul').menu({
			content: $('#myContent').html(),		
			maxHeight: 180,
			positionOpts: { offsetX: 10, offsetY: 20 },
			showSpeed: 300
		});
		
    checkForNewData(offset);

	$('#M2In').keypress(sendOnEnterCallback('#M2In'));
    $("#send").click(sendCallback( '#M2In' ));
    $("#reset").click(resetCallback);

    $("code").live("click", function() { 
       $(this).effect("highlight", {color: 'red'}, 800);
	    var code = $(this).html();
	    //var origcolor = $(this).css('background-color');
	    //$(this).css('background-color', '#7700aa');
		$("#M2In").val($("#M2In").val() + "\n" + code);
		scrollDown( "#M2In" );
		sendToM2(">>SENDCOMMANDS<<\n" + code);
		//$(this).css('background-color', origcolor);
	});
    $("#tutorial").hide();
    $("#inputarea").hide();
    $("#send").hide();
    $("#pageIndex").hide();
    

	$("#tutorial").load("tutorial.html", function () {
 		maxLesson = $('.lesson').children().length;
		//createMenu();
//    	$('#lessonNr').html(lessonNr);
    	loadLesson(lessonNr);

	    $('<div id="page-contents"></div>')
	    .prepend('<a class="toggler" href="#">Page Contents</a>')
	    .append('<div></div>')
	    .prependTo('#toc');

		createMenu2();
        
  	});	
	
	
	$("#next").click( function(){
	    switchLesson(1);
	});
	$("#previous").click( function(){
	    switchLesson(-1);
	});

	// swipe changed to swipeXXX to remove functionality for testing
	$(function(){ $("#leftwindow").bind("swipeXXX",function(event, info) {
        if (info.direction === "left"){
            switchLesson(1);
        } else if (info.direction === "right") {
            switchLesson(-1);
        } else {
            alert("swiped: huh?");
        }
        });
    });
    
	$(function(){   	 
		$("#extruderTop").buildMbExtruder({
	                position:"top",
	                width:350,
	                extruderOpacity:1,
	                onExtOpen:function(){},
	                onExtContentLoad:function(){},
	                onExtClose:function(){}
	         });
	    });

    
    
    $('#page-contents > a.toggler').click( function() {
        $(this).toggleNext();
        return false;
    });
    
    //updateOrientation();
});

function helpScreen()  {
	console.log("Display Help.");
	$("#help-dialog").dialog('open') 

}

function updateOrientation()
{
    var orient ="";
    switch(window.orientation) {
        case 0:
        case 180:
            orient = "show_portrait";
            break;
        case -90:
        case 90:
            orient = "show_landscape";
            break;
        default:
            orient = "show_landscape";
    }
    $("body").attr("class", orient);
	$("#rightwindow").attr('class', orient);
	$("#leftwindow").attr('class', orient);
}

function loadLesson(ell)
{
    if (ell == 0){
        $("#lesson").hide();
        $("#inputarea").show();
        $("#send").show();
        $("#pageIndex").hide();
        
    } else {
        $("#inputarea").hide();
        var selector = ".lesson ."+ell;
        var thehtml = $(selector).html();
        $("#send").hide();
        $("#pageIndex").text( "Lesson " + lessonNr + "/" + maxLesson).show();
        $("#lesson").html(thehtml).show();
    }
}

function createMenu()
{
	var i = 1;
	$("#tutorial h4").each( function() {
		var title = $(this).text();
		$("#menu").append(
			"<li class='arrow'><a href='#M2' lessonid='lesson" + i +"'>Lesson " + i +": " + title + "</a></li>");
		i = i + 1;
	} );

	$('[lessonid]').click(function(){
		var lessonId = $(this).attr('lessonid');
		lessonNr = parseInt( lessonId.match(/\d/g ));
		loadLesson(lessonNr);
	});

}
	
function createMenu2()
{
	//alert ("appending");
	$("#tutorial h4").each( function(i) {
		var title = $(this).text();
		var chapterId = 'chapter-' + (i+1);
		$(this).attr('id', chapterId)
		$('<a></a>')
		 .text(title)
		 .attr('title',title)
		 .attr('href','#' + chapterId)
		 .attr('lessonid', "lesson"+(i+1))
		 .appendTo('#page-contents div');
		
		//alert ("appending");
		$("#menu").append(
			"<li class='arrow'><a href='#M2' lessonid='lesson" + (i+1) +"'>Lesson " + (i+1) +": " + title + "</a></li>");
	} );

	$('[lessonid]').click(function(){
		var lessonId = $(this).attr('lessonid');
		lessonNr = parseInt( lessonId.match(/\d/g ));
		loadLesson(lessonNr);
		$(this).parent().slideToggle("fast");
		return false;
	});

}

function switchLesson(incr)
{
    lessonNr = lessonNr + incr;
    if (lessonNr >= 0 && lessonNr <= maxLesson) {
        loadLesson(lessonNr);
    } else {
        lessonNr = lessonNr - incr;
        //alert("lesson with " + lessonNr + "." + incr + " not available");
    }
}

function checkForNewData()
{
	$.post("getResults.php", 'offset='+ offset, function(data){

		if(data != "")
		{
			$("#M2Out").val($("#M2Out").val() + data); 
            scrollDown( "#M2Out" );
			offset = offset + data.length;
			waitingtime = minwaitingtime;
		} 
		else
		{
		    waitingtime = 2*waitingtime;
		    if (waitingtime > maxwaitingtime)
		    {
		        waitingtime = maxwaitingtime;
		    }
		}
        $("#waittime").text("waiting time: " + waitingtime);
    	timerobject = setTimeout("checkForNewData()",waitingtime);
	});

}



function sendOnEnterCallback( inputfield ) {
	return function(e) {
		if (e.which == 13 && e.shiftKey) {
            e.preventDefault();
            // do not make a line break or remove selected text when sending

            sendToM2(">>SENDCOMMANDS<<\n"+getSelected( inputfield ), "You hit shift-enter!! ");
        }
	}
}

function resetCallback(e) {
    if (!sendToM2(">>RESET<<", "We are resetting the current M2 session.\n")) {
        $("#M2Out").val($("#M2Out").val() + "<b>Something Broke! HELP!</b>");
    }
    $("#M2Out").val("");
}

function sendCallback( inputField ) {
	return function(e) {
    	var str = getSelected( inputField );
	    sendToM2(">>SENDCOMMANDS<<\n"+str, "");
	    return false;
	}
}

// return false on error
function sendToM2(myCommand, baseString) {
    clearTimeout(timerobject);
    waitingtime = minwaitingtime;
    $("#waittime").text("waiting time: " + waitingtime);
    timerobject = setTimeout("checkForNewData()",waitingtime);
    
    $.post("sockets/M2Client.php", {
        cmd: myCommand
    },
    function(data) {
		console.log("Here is the data: " + data);
        if (data != "0") { 
            $("#M2Out").val($("#M2Out").val() + "Something Broke! HELP!");
            return false;
        }
    });
    return true;
}

function scrollDown( area ) {
    mySize = $(area).val().length;
    $(area).scrollTop(mySize);
    return false;
    // Return false to cancel the default link action
}

/* get selected text, or current line, in the textarea #M2In */
function getSelected( inputField) {
    var str = $(inputField).val();
    var start = $(inputField)[0].selectionStart;
    var end = $(inputField)[0].selectionEnd;
    if (start == end) {
        // grab the current line
        start = 1 + str.lastIndexOf("\n", end - 1);
        var endPos = str.indexOf("\n", start);
        if (endPos != -1) {
            end = endPos;
        } else {
            end = str.length;
        }
    }
    return str.slice(start, end) + "\n";
}



/* Info on selected text:
 * jquery plugin: jquery-fieldselection.js
 * example use: http://laboratorium.0xab.cd/jquery/fieldselection/0.1.0/test.html
 * DOM: selectionStart, selectionEnd
 *  stackoverflow: search for selectionStart
 */
