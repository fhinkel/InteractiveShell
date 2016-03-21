// create link to download content from textarea as file
downloadTextArea = function(textarea, title, filename){
    var msg = textarea.val();
    //console.log("Download textarea: " + msg);
    var anchor = downloadTextAsFile(msg, filename);
    anchor.text(title);
    return anchor;
};

// create link to download text as file
downloadTextAsFile = function(text, filename) {
    var link = 'data:application/octet-stream,' + encodeURIComponent(text);
    var anchor = $("<a>");
    anchor.attr('href', link);
    anchor.attr('download', filename + ".txt");
    return anchor;
};

/* get selected text, or current line, in the textarea #M2In */
getSelected = function(inputField) {
    var str = $(inputField).val(),
        start = $(inputField)[0].selectionStart,
        end = $(inputField)[0].selectionEnd,
        endPos;
    if (start === end) {
        // grab the current line
        if (end != 0) {
            start = 1 + str.lastIndexOf("\n", end - 1);
        } else {
            start = 0;
        }
        endPos = str.indexOf("\n", start);
        if (endPos !== -1) {
            end = endPos;
        } else {
            str = $(inputField).val() + "\n";
            $(inputField).val(str);
            end = str.length - 1; // position of last \n 
        }
        // move cursor to beginning of line below 
        this.setCaretPosition($(inputField), end + 1);
    }
    return str.slice(start, end) + "\n";
};


setCaretPosition = function(inputField, caretPos) {
    if (inputField != null) {
        if (inputField[0].createTextRange) {
            var range = inputField[0].createTextRange();
            range.move('character', caretPos);
            range.select();
        } else {
            if (inputField[0].selectionStart || $(inputField)[0].selectionStart ===
                0) {
                inputField[0].focus();
                inputField[0].setSelectionRange(caretPos, caretPos);
            } else {
                inputField[0].focus();
            }
        }
    }
};

