GLOBAL.OPTIONS = require('./default.js').get_config();

var Macaulay2Server = require('./index.js').mathServer();
Macaulay2Server.listen();

