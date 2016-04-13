GLOBAL.OPTIONS = require('./default.js').get_config({
  server_config: {
    port: 8002,
    MATH_PROGRAM_COMMAND: 'export WWWBROWSER=/usr/bin/open; export PATH=/usr/bin:$PATH; M2 --print-width 100',
    CONTAINERS: './sudoDockerContainers.js'
  }
});

console.log(OPTIONS);

var Macaulay2Server = require('./index.js').MathServer();
Macaulay2Server.listen();
