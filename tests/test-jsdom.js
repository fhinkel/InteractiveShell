var fs = require('fs');
var jsdom = require('jsdom');
var doc   = jsdom.jsdom(fs.readFileSync("test.html"), null, {
          features: {
            FetchExternalResources   : ['script'],
            ProcessExternalResources : ['script'],
            MutationEvents           : '2.0',
        }
    });
console.log("hello :( )");
var window = doc.createWindow();
jsdom.jQueryify(window, function() {
    console.log("wupp");
    console.log(window.document.innerHTML);
    //console.log(window.$().jquery); //jquery version
    console.log("wupp");
});
console.log("tschuess :( )");
/*
var jsdom = require("jsdom");
var window = jsdom.jsdom().createWindow();

jsdom.jQueryify(window, "http://habanero.math.cornell.edu:3690/", function () {
  window.$("body").append('<div class="testing">Hello World, It works</div>');

  console.log(window.document.body.innerHTML);
});


var jsdom = require("jsdom").jsdom;



jsdom.env("http://habanero.math.cornell.edu:3690/", ["http://code.jquery.com/jquery.min.js"], function(err, window) {
    // jQuery is at window.$
//   console.log(window);
   console.log(window.document.title);
   console.log(window.document.body.onload);
   console.log(window.document.body.innerHTML);
   //console.log("contents of M2Out:", window.$("M2Out"));
});*/

