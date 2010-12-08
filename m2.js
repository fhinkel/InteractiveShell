$(document).ready(function() {
    $('#M2In').keypress(function(e){
	if(e.which == 13){
	  $('#M2Out').append("Bravo, you just hit enter!\n");
	  $('#M2Out').append( getSelected());
	}
      });

    $("#send").click(submitNow);
    
    $("#reset").click(function(e) {
        e.preventDefault();
	if (!sendToM2( ">>RESET<<", "We are resetting the current M2 session.\n")) {
	  $("#M2Out").val($("#M2Out").val() + "<b>Something Broke! HELP!</b>");
	}
	$("#M2Out").val("");
      });

    $("#M2Out").append($("#M2In").val());
    $("#M2Out").append("\n");
    $('#M2Out').append( getSelected());
    });
});

// return false on error
function sendToM2( myCommand, baseString ) {
  alert ('-' + myCommand + '-');
  $.post("sockets/M2Client.php", {cmd: myCommand}, function(data){
      if(data != "0") {
	alert ('-' + data + '-');
	$("#M2Out").val(baseString + data );
	scrollDown();
      } else {
	return false;
      }
    });
  return true;
}

function scrollDown() { 
  mySize = $('#M2Out').val().length;
  $('#M2Out').scrollTop(mySize);
  return false; // Return false to cancel the default link action
}

/* attempt to find a text selection */
function getSelected() {
	if(window.getSelection) { $('#M2Out').append("option1\n --" + window.getSelection() + "--"); return window.getSelection();  }
	
	else if(document.getSelection) { $('#M2Out').append("option2");return document.getSelection(); }
	else {
		var selection = document.selection && document.selection.createRange();
		if(selection.text) { $('#M2Out').append("option3"); return selection.text; }
		$('#M2Out').append("option4");
		return false;
	}
	$('#M2Out').append("option never");
	return false;
}


