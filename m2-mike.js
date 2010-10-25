// Next:
// DONE: output cursor: move to end, so that new commands are showing
// get rid of extra newline character so Mike doesn't get offended :( 

// get text from line highlihted -> read code
// send only current line
// send on Shift Enter
 
// resize text area (happens automatically? in Safari) -> set textWidth to width of textarea, whenever user resizes the area (and in the beginning)
// horizontal scroll bar, so text doesn't wrap
// only send current line from text input
// keep history of input
// print output once it's back instead of hitting enter over and over, global
// event handler? 
// handle post callback differently. Ajax? 
// make a good keyboard for iPad



$(document).ready(function() {

		// initialisation
		editAreaLoader.init({
			id: "M2In"	// id of the textarea to transform		
			,start_highlight: true	// if start with highlight
			,allow_resize: "both"
			,allow_toggle: false
			,word_wrap: false
			,language: "en"
			,syntax: "php"	
		});
		
		editAreaLoader.init({
			id: "M2Out"	// id of the textarea to transform		
			,start_highlight: true	// if start with highlight
			,allow_resize: "both"
			,allow_toggle: false
			,word_wrap: false
			,language: "en"
			,syntax: "php"	
		});
		
		// callback functions
		
		function test_setSelectionRange(id){
			editAreaLoader.setSelectionRange(id, 100, 150);
		}
		
		function test_getSelectionRange(id){
			var sel =editAreaLoader.getSelectionRange(id);
			alert("start: "+sel["start"]+"\nend: "+sel["end"]); 
		}
		
		function test_setSelectedText(id){
			text= "[REPLACED SELECTION]"; 
			editAreaLoader.setSelectedText(id, text);
		}
		
		function test_getSelectedText(id){
			alert(editAreaLoader.getSelectedText(id)); 
		}
		
		function toogle_editable(id)
		{
			editAreaLoader.execCommand(id, 'set_editable', !editAreaLoader.execCommand(id, 'is_editable'));
		}
	
  // add markup to container and apply click handlers to anchors
  //$("#header a").click(function(e) {


  $('#M2In').keypress(function(e) {
    if(e.which == 13){
      submitNow();
    }
  });


	
  $("#button1").click(submitNow);
  
  $("#reset").click(function(e) {
    if (!sendToM2( ">>RESET<<", "We are resetting the current M2 session.\n")) {
      $("#M2Out").val($("#M2Out").val() + "<b>Something Broke! HELP!</b>");
    }
    $("#M2Out").val("");
  });


  //$("#M2Out").append(window.getSelected());
  //$("#M2Out").val($("#M2Out").val() + "\n");
});

// return false on error
function sendToM2( myCommand, baseString ) {
  $.post("sockets/M2Client.php", {cmd: myCommand}, function(data){
    if(data != "0") {
		editAreaLoader.setValue("M2Out", baseString + data)
    //  $("#M2Out").val(baseString + data );
		scrollDown();
      $("#M2In").val("");
    } else {
      return false;
    }
  });
  return true;
}

/* attempt to find a text selection */
function getSelected() {
  if(window.getSelection) { $('#M2Out').append("Get Selected! option1\n --" + window.getSelection() + "--"); return window.getSelection();  }

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

function scrollDown() { 
	mySize = $('#M2Out').val().length;
	//$t.animate({ scrollTop: mySize}, 1000);
	//$("#M2Out").val($("#M2Out").val() + "\nSize: " + mySize);
	$('#M2Out').scrollTop(mySize);
	//animate({scrollTop: 0},'slow'); 
	return false; // Return false to cancel the default link action
}

function submitNow(e) {
  var myCommand;
  var sel = editAreaLoader.getSelectionRange("M2In");
  var str = editAreaLoader.getValue("M2In");
  if (sel["start"] == sel["end"]) {
    // grab the current line
    sel["start"] = 1 + str.lastIndexOf("\n", sel["end"]);
  }

  alert("start: "+sel["start"]+"\nend: "+sel["end"]);
  myCommand = str.slice(sel["start"],sel["end"]) + "\n";
  alert("command: \n" + myCommand);

  //alert('position is ' + position);
  // this should be current line
  //myCommand = editAreaLoader.getSelectedText("M2In");
  // call to php script
  if (!sendToM2( myCommand, "Session initialized successfully! ")) {
    $("#M2Out").val($("#M2Out").val() + "<b>Something Broke! HELP!</b>");
  }
}

/* create sniffer */
/*$(document).ready(function() {
  $('#content-area').mouseup(function() {
  var selection = getSelected();
  if(selection && (selection = new String(selection).replace(/^\s+|\s+$/g,''))) {
  $.ajax({
type: 'post',
url: 'ajax-selection-copy.php',
data: 'selection=' + encodeURI(selection)
});
}
});
});*/




