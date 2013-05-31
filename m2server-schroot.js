 require('child_process').exec('sudo schroot -e --all-sessions', function() {
var m2 = require('./m2server-module.js');
var m2server = m2.M2Server({
    SCHROOT: true
});
m2server.listen();
                });



// Local Variables:
// indent-tabs-mode: nil
// tab-width: 4
// End:
