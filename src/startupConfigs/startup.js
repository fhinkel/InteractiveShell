

module.exports = function(overrideOptions){
    GLOBAL.OPTIONS = require('./default.js').getConfig(overrideOptions);
    console.log(GLOBAL.OPTIONS);
    var Macaulay2Server = require('../lib/index.js').mathServer();
    Macaulay2Server.listen();
};

