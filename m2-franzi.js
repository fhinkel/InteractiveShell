// Next:
// output cursor: move to end, so that new commands are showing
// get rid of extra newline character so Mike doesn't get offended :( 
// print output once it's back instead of hitting enter over and over, global
// event handler? 
// handle post callback differently. Ajax? 
// 



$(document).ready(function() {
  // add markup to container and apply click handlers to anchors
  //$("#header a").click(function(e) {

  //alert($('.subHeader:first').text());

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

    // call to php script
    if (!sendToM2( myCommand, "Session initialized successfully! ")) {
      $("#M2Out").val($("#M2Out").val() + "<b>Something Broke! HELP!</b>");
    }
  });
  
  $("#reset").click(function(e) {
    if (!sendToM2( ">>RESET<<", "We are resetting the current M2 session.\n")) {
      $("#M2Out").val($("#M2Out").val() + "<b>Something Broke! HELP!</b>");
    }
    $("#M2Out").val("");
  });

  $('<input type="button" id="multiToggleButton" value="MultiToggle">').insertAfter('#reset');
  $('<input type="button" id="toggleButton" value="Hide Disclaimer">').insertAfter('#reset');
  // playing with a toggle button
  $('#multiToggleButton').toggle(function() { 
    $(this).val("1 toggle");
  }, function() {
    $(this).val("2 toggle");
  }, function() {
    $(this).val("3 toggle");
  });

  $('#toggleButtonFalse').click(function() { 
    $('#disclaimer').slideToggle('slow');
  });
  
  $('#toggleButton').click(function() { 
    if ($('#disclaimer').is(':visible') ) {
      $('#toggleButton').val("Show Disclaimer");
      $('#disclaimer').fadeOut('slow');
    } else {
      $('#toggleButton').val("Hide Disclaimer");
      $('#disclaimer').fadeIn('slow');
    }
  });

  $('#hideButton').click(function() { 
    $('#disclaimer').fadeOut();
  });

  $('.spoiler').hide(); 
  $('<input class="revealer" type="button" value="Tell me!" />').insertBefore('.spoiler'); 
  $('.revealer').click(function() {
    $(this).hide();
    $(this).next().fadeIn(); 
  });

  // playing with animate
  $('#disclaimer').animate({ 
    padding: '20px', 
    borderBottom: '3px solid #8f8f8f',
    borderRight: '3px solid #bfbfbf' 
  }, 2000);


  // play with navigation bar
  $('<div id="navigation_blob"></div>').css({ 
    width: $('#navigation li:first a').width() + 10, 
    height: $('#navigation li:first a').height() + 10
  }).appendTo('#navigation');

  $('#navigation a').hover(function() { 
    // Mouse over function
    //alert($(this).text());
    $('#navigation_blob').css({
      position: 'absolute'}). animate(
      {width: $(this).width() + 10, 
      left: $(this).position().left},
      {duration: 'slow', easing: 'easeOutElastic', queue: false} );
  }, function() { 
    // Mouse out function 
    $('#navigation_blob')
      .stop(true) 
      .animate(
        {width: 'hide'}, 
        {duration: 'slow', easing: 'easeOutCirc', queue: false}
    ) 
    .animate(
      {left: $('#navigation li:first a').position().left},
      'fast'
    );
  });

  //$("#M2Out").append(window.getSelected());
  //$("#M2Out").val($("#M2Out").val() + "\n");
});

// return false on error
function sendToM2( myCommand, baseString ) {
  $.post("sockets/M2Client.php", {cmd: myCommand}, function(data){
    if(data != "0") {
      $("#M2Out").val(baseString + data );
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




