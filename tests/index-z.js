var Browser = require('zombie');
var browser = new Browser({debug: false});
browser.visit('http://localhost/~franzi/tryM2/public/index.html', function(e , b) {
    console.log(b.errors);
    console.log(b.statusCode);
    console.log(b.html());
});



//, function(e, b) {
    //console.log(b.html());
//});

//Browser.visit('http://localhost/~franzi/tryM2/test.html', function(e, browser, status) {
  //  console.log(browser.html());
    //browser.close();
//});
    
    
//    Browser.visit('http://habanero.math.cornell.edu:3690', {runScripts: true, waitFor: 1000, maxWait: 2000}, function(e, browser, status) {
//var browser = new Browser({debug: true});

//browser.visit('http://habanero.math.cornell.edu:3690', {debug: true, runScripts: true, waitFor: 1000, maxWait: 2000}, function(e, browser, status) {

//browser.visit('http://habanero.math.cornell.edu:3690', function(e, browser, status) {
    //browser.wait(function(e, browser) {
        //console.log(browser.html());
    //});
    //browser.close();
//});
