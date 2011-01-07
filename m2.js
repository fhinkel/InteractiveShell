$(document).ready(function() {
    

	$('#M2In').keypress(sendOnEnterCallback('#M2In'));
    $("#send").click(sendCallback( '#M2In' ));

    $("#reset").click(resetCallback);
    $("#see").click(seeCallback);

	$('#signup').hide();

	$("#tutorial").load("tutorial.html", function () {
		$('.lessons').keypress( function(e) {
			sendOnEnter(e, '.lessons');
			if (e.which == 13 && e.shiftKey) {
				e.preventDefault();
				cmd = getSelected( '.lessons' )
				$('#M2In').val( $('#M2In').val() + cmd );
			}
		});
	    $("#sendLesson").click( function() {
			cmd = getSelected( '.lessons' )
			sendToM2( cmd );
			$('#M2In').val( $('#M2In').val() + cmd );
		});
	});
	
   
});


function sendOnEnter( e, inputfield ) {
	if (e.which == 13 && e.shiftKey) {
		e.preventDefault();
		// do not make a line break or remove selected text when sending

		sendToM2(getSelected( inputfield ), "You hit shift-enter!! ");
	}
}


function sendOnEnterCallback( inputfield ) {
	return function(e) {
		if (e.which == 13 && e.shiftKey) {
            e.preventDefault();
            // do not make a line break or remove selected text when sending

            sendToM2(getSelected( inputfield ), "You hit shift-enter!! ");
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
	    sendToM2(str, "");
	    return false;
	}
}

function seeCallback(e) {
    var str = getSelected('#M2In');
    alert(str);
    return false;
}

// return false on error
function sendToM2(myCommand, baseString) {
    $.post("sockets/M2Client.php", {
        cmd: myCommand
    },
    function(data) {
        if (data != "0") {
            $("#M2Out").val(baseString + data);
            scrollDown();
        } else {
            $("#M2Out").val($("#M2Out").val() + "Something Broke! HELP!");
            return false;
        }
    });
    return true;
}

function scrollDown() {
    mySize = $('#M2Out').val().length;
    $('#M2Out').scrollTop(mySize);
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
