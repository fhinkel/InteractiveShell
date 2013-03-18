
var Browser = require("zombie");
var assert = require("assert");

// Load the page from localhost
browser = new Browser()
browser.visit("http://habanero.math.cornell.edu:3690/",{runScripts: true, waitFor: 10000, maxWait: 30000}, function () {
   
//   browser.pressButton(browser.button("reset"));
   var item = browser.document.getElementById("M2In");
   console.log(item);
   console.log(item.attributes);   
   console.log(item.value);   
      // Form submitted, new page loaded.
   console.log(browser.text("title"));
   console.log(browser.text("html"));
   console.log(browser.text("M2Out"));

})
browser.wait(20000, function() {
   var item = browser.document.getElementById("M2Out");
   console.log(item);
   console.log(item.attributes);
   console.log(item.value);
      // Form submitted, new page loaded.
   console.log(browser.text("title"));
   console.log(browser.text("html"));
   console.log(browser.text("M2Out"));


});
