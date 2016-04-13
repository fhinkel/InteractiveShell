GLOBAL.OPTIONS = require('./default.js').getConfig();

var Macaulay2Server = require('./index.js').mathServer();
Macaulay2Server.listen();

