var tobi = require('tobi')
  , browser = tobi.createBrowser(80, "localhost");

browser.get('/~franzi/tryM2/test.html', function(res, $){
    res.should.have.status(200);
    
    console.log("my title is " + $('title').text());
    setTimeout( function(){
        console.log($('h1').text());
        console.log(res.window.document.getElementById("myHeader").innerHTML);
    }, 1000);

});


