var offset=0;
var waitingtime=2500; // in ms.  Each time we poll for data and don't receive it, we wait longer.
var maxwaitingtime=60*1000*10; // 10 minutes
var minwaitingtime=2500;

var lessonNr = 1;
var maxLesson = 1;

var tutorial;

$(document).ready(function() {
    checkForNewData(offset);

	$('#M2In').keypress(sendOnEnterCallback('#M2In'));
    $("#send").click(sendCallback( '#M2In' ));
    $("#reset").click(resetCallback);

    $("#tutorial").hide();
    //$("#tutorial").css("visibility", "hidden");
	
	$("#tutorial").load("tutorial.html", function () {
        $("code").click( function() { 
   		    var code = $(this).html();
    		$("#M2In").val($("#M2In").val() + "\n" + code);
    		scrollDown( "#M2In" );
    		sendToM2(">>SENDCOMMANDS<<\n" + code);
    	});
		maxLesson = $('.lesson').children().length;
    	$('#lessonNr').html(lessonNr);
    	loadLesson(lessonNr);
  	});	
	
	
	$("#next").click( function(){
	    switchLesson(1);
	});
	$("#previous").click( function(){
	    switchLesson(-1);
	});

	$(function(){ $("#leftwindow").bind("swipe",function(event, info) {
        if (info.direction === "left"){
            switchLesson(1);
        } else if (info.direction === "right") {
            switchLesson(-1);
        } else {
            alert("swiped: huh?");
        }
        });
    });
});

function loadLesson(ell)
{
    var selector = ".lesson ."+ell;
    var thehtml = $(selector).html();
    $("#lesson").html(thehtml);
	//$("#leftwindow").html($("#tutorial h3"));
	//$("#leftwindow").css("visibility", "visible");
	//$("#leftwindow").html($("#leftwindow").html() + $("#tutorial.lesson#ell").html())
    //$('#lessonNr').html(ell);
}
	
function switchLesson(incr)
{
    lessonNr = lessonNr + incr;
    if (lessonNr >= 1 && lessonNr <= maxLesson) {
        loadLesson(lessonNr);
    } else if (lessonNr == 0){
        $("#leftwindow").html("<textarea id='M2In' wrap='off'></textarea>");
    }
    else {
        lessonNr = lessonNr - incr;
        alert("lesson with " + lessonNr + "." + incr + " not available");
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
		    waitingtime = 5*minwaitingtime;
		    if (waitingtime > maxwaitingtime)
		    {
		        waitingtime = maxwaitingtime;
		    }
		}

	});

	setTimeout("checkForNewData()",waitingtime);
}



function sendOnEnterCallback( inputfield ) {
	return function(e) {
		if (e.which == 13 && e.shiftKey) {
            e.preventDefault();
            // do not make a line break or remove selected text when sending

            sendToM2(">>SENDCOMMANDS<<\n"+getSelected( inputfield ), "You hit shift-enter!! ");
            waitingtime = minwaitingtime;
            setTimeout("checkForNewData()",waitingtime);
        }
	}
}

function resetCallback(e) {
    if (!sendToM2(">>RESET<<", "We are resetting the current M2 session.\n")) {
        $("#M2Out").val($("#M2Out").val() + "<b>Something Broke! HELP!</b>");
    }
    $("#M2Out").val("");
	waitingtime = minwaitingtime;

}

function sendCallback( inputField ) {
	return function(e) {
    	var str = getSelected( inputField );
	    sendToM2(">>SENDCOMMANDS<<\n"+str, "");
        waitingtime = minwaitingtime;
        setTimeout("checkForNewData()",waitingtime);
	    return false;
	}
}

// return false on error
function sendToM2(myCommand, baseString) {
    $.post("sockets/M2Client.php", {
        cmd: myCommand
    },
    function(data) {
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
