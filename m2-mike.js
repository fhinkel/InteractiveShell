// Next:
// DONE: output cursor: move to end, so that new commands are showing
// get rid of extra newline character so Mike doesn't get offended :( 

// I think these are DONE:
// get text from line highlighted
// send only current line
// print output once it's back instead of hitting enter over and over
// keep history of input


// handle post callback differently. Ajax? Aren't we already doing Ajax?
// make a good keyboard for iPad


// What about our own edit area? 
// 	- scroll bars
//	- use fix width font
// 	- capture key events (shift-enter or F12)
//	- resizing
//  - horizontal scroll bar, so text doesn't wrap
// 	- output scroll to newest results
// 	- incorporate input from tutorial
// 	- communicate the Textarea size to M2 for correct string formatting or set reasonable default at beginning
//	- undo feature	( command Z?)
//	- get selection or line
//	- syntax highlighting
//	- autocompletion on Tab
// 	- save contents (input and output)


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
			("start: "+sel["start"]+"\nend: "+sel["end"]); 
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



  $('#textarea').keypress(function(e) {
	alert('enter!');
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
		//alert ('-' + data + '-');
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
    sel["start"] = 1 + str.lastIndexOf("\n", sel["end"]-1);
	
	var endPos = str.indexOf("\n", sel["start"]);
	if ( endPos != -1) {
		sel["end"] = endPos;
	} else {
		sel["end"] = str.length;
		//alert ("last line");
		
	}
  }

  //alert("start: "+sel["start"]+"\nend: "+sel["end"]);
  myCommand = str.slice(sel["start"],sel["end"]) + "\n";
  //alert("command: \n" + myCommand);

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




