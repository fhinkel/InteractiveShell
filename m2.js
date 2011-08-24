var offset=0;

$(document).ready(function() {
    checkForNewData(offset);

	$('#M2In').keypress(sendOnEnterCallback('#M2In'));
    $("#send").click(sendCallback( '#M2In' ));
    $("#reset").click(resetCallback);

	var lessonNr = 1;
	var maxLesson = 1;
	$("#lesson").load("tutorial.html", function () {
		maxLesson = $('.lesson').length;
	});
	
	$('#lessonNr').html(lessonNr);
	loadLesson(lessonNr);

	
	

	
	$("#next").click( function(){
		if( lessonNr < maxLesson ) {
			lessonNr = lessonNr + 1;
			loadLesson(lessonNr);
			$('#lessonNr').html(lessonNr);
		} else {
			alert("No next lesson available.");
		}
	});
	$("#previous").click( function(){
		if( lessonNr > 1 ) {
			lessonNr = lessonNr - 1;
			loadLesson(lessonNr);
			$('#lessonNr').html(lessonNr);
		} else {
			alert("No previous lesson available.");
			
		}
	});
});

function loadLesson(lessonNr)
{
	$("#lesson").load("tutorial.html .lesson#" + lessonNr, function () {
		$("code").click( function() { 
			var code = $(this).html();
			$("#M2In").val($("#M2In").val() + "\n" + code);
			scrollDown( "#M2In" );
			sendToM2(">>SENDCOMMANDS<<\n" + code);
		});
	
	});
	

}
	
function checkForNewData()
{
	$.post("getResults.php", 'offset='+ offset, function(data){

		if(data != "")
		{
			$("#M2Out").val($("#M2Out").val() + data); 
            scrollDown( "#M2Out" );
			offset = offset + data.length;
		} 

	});
	setTimeout("checkForNewData()",250);
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
