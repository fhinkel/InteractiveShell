$(document).ready(function() {
  // add markup to container and apply click handlers to anchors
  //$("#header a").click(function(e) {
  $('#M2In').keypress(function(e) {
    if(e.which == 13){
      $('#M2Out').append("Bravo, you just hit enter!\n");
      $('#M2Out').append( getSelected());
    }
  });

  $("#button1").click(function(e) {
    myCommand = $("#M2In").val()
    $("#M2Out").append( myCommand);
    $("#M2Out").append("\n");
    $("#M2Out").append("Button clicked! Send to PHP script:\n");

    // call to php script
    $.post("sockets/M2Client.php", {cmd: myCommand}, function(data){
      if(data != "0") {
        $("#container").html("<b>Session initialized successfully!"+ data + "</b>");
        $("#cmd").val("");
      } else {
        $("#container").html("<b>Something Broke! HELP!</b>");
      }
    });
  });

  $("#M2Out").append(window.getSelected());
  $("#M2Out").append("\n");
});


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




