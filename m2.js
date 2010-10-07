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


$(document).ready(function() {
    // generate markup
    //$("#header").append("Please rate: ");

    //for (var i = 1; i <= 5; i++)
    //$("#header").append("<a href='#'>" + i + "</a> ");



    // add markup to container and apply click handlers to anchors
    //$("#header a").click(function(e) {
		$('#M2In').keypress(function(e){
		      if(e.which == 13){
		       $('#M2Out').append("Bravo, you just hit enter!\n");
				$('#M2Out').append( getSelected());
		       }
		      });
	
	$("#submit").click(function(e) {
        // stop normal link click
        e.preventDefault();

        //$("#M2Out").append($(this).html());
 		$("#M2Out").append($("#M2In").val());
		$("#M2Out").append("\n");
		$('#M2Out').append( getSelected());
		//$('#M2Out').append( document.selection.createRange().text);


        // send request
        // $.post("rate.php", {rating: $(this).html()}, function(xml) {
        // format and output result
        // $("#rating").html(
        // "Thanks for rating, current average: " +
        //$("average", xml).text() +
        //", number of votes: " +
        //$("count", xml).text()
        //);
    });
});

// Get user selection text on page
/*function getSelectedText() {
    if (window.getSelection) {
        return window.getSelection();
    }
    else if (document.selection) {
        return document.selection.createRange().text;
    }
    return '';
}*/


