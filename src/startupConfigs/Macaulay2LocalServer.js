GLOBAL.OPTIONS = require('./default.js').getConfig();

var Macaulay2Server = require('../lib/index.js').mathServer();
Macaulay2Server.listen();

