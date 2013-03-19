
console.log('Loading a web page');
var page = require('webpage').create();
//var url = 'http://127.0.0.1/~franzi/tryM2/test.html';
var url = 'http://habanero.math.cornell.edu:3690';
page.open(url, function (status) {
    //Page is loaded!
    page.render('google.png');
    phantom.exit();
});

