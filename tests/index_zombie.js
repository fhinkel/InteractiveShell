
var Browser = require("zombie");
//var assert = require("assert");

// Load the page from localhost
browser = new Browser();
browser.visit("http://tryruby.org/levels/1/challenges/0",{runScripts: true, waitFor: 5000, maxWait: 10000}, function () {
   
//   browser.pressButton(browser.button("reset"));
   //var item = browser.document.getElementById("tutorial");
   //console.log(item.html);
   //console.log(item.attributes);   
   //console.log(item.value);
   //console.log(browser.body);
      // Form submitted, new page loaded.
   //console.log(browser.text("title"));
   console.log(browser.html("html"));
   //console.log(browser.html("#selectTutorialLink"));
   //console.log(browser.text("M2Out"));

});/*
browser.wait(5000, function() {
   var item = browser.document.getElementById("M2In");
   console.log(item);
   console.log(item.attributes);
   console.log(item.value);
      // Form submitted, new page loaded.
   console.log(browser.text("title"));
   console.log(browser.text("html"));
   console.log(browser.text("M2Out"));


});*/
