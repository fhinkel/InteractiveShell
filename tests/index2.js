var tobi = require('tobi')
  , browser = tobi.createBrowser(3690, 'habanero.math.cornell.edu');

browser.get('/', function(res, $){
    res.should.have.status(200);
    //console.log("my title is " + $('title').text());
    $('title').should.have.text('\n\t\t\tMacaulay2\n\t\t');
    $('title').should.have.text(/Macaulay2/);
    
});