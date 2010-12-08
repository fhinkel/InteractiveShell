$(document).ready(function() {
    $('#M2In').keypress(function(e){
	if(e.which == 13){
	  $('#M2Out').append("Bravo, you just hit enter!\n");
	  $('#M2Out').append( getSelected());
	}
      });

    $("#send").click(sendCallback);
    $("#reset").click(resetCallback);
    $("#see").click(seeCallback);
});

function resetCallback(e) {
  if (!sendToM2( ">>RESET<<", "We are resetting the current M2 session.\n")) {
    $("#M2Out").val($("#M2Out").val() + "<b>Something Broke! HELP!</b>");
  }
  $("#M2Out").val("");
}

function sendCallback(e) {
  var str = $("#M2in").getSelected();
  alert ('doing send callback --' + str + '-');
  sendToM2( str, "Session initialized successfully! ");
}

function seeCallback(e) {
  var str = $("#M2In")[0].selectionStart + " to " + $("#M2In")[0].selectionEnd;
  alert(str);
  return false;
}

// return false on error
function sendToM2( myCommand, baseString ) {
  alert ('-' + myCommand + '-');
  $.post("sockets/M2Client.php", {cmd: myCommand}, function(data){
      if(data != "0") {
	alert ('-' + data + '-');
	$("#M2Out").val(baseString + data );
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
  return false; // Return false to cancel the default link action
}

/* attempt to find a text selection */
/* NEEDS TO BE WRITTEN */
function getSelected() {
  return "2+7\n"
}

/* Info on selected text:
 * jquery plugin: jquery-fieldselection.js
 * example use: http://laboratorium.0xab.cd/jquery/fieldselection/0.1.0/test.html
 * DOM: selectionStart, selectionEnd
 *  stackoverflow: search for selectionStart
 */
