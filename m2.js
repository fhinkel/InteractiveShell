$(document).ready(function() {
    // generate markup
    $("#header").append("Please rate: ");

    for (var i = 1; i <= 5; i++)
    $("#header").append("<a href='#'>" + i + "</a> ");

    // add markup to container and apply click handlers to anchors
    $("#header a").click(function(e) {
        // stop normal link click
        e.preventDefault();

        $("#M2Out").append($(this).html());


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

