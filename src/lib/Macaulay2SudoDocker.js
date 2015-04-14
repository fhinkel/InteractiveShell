var Macaulay2Server = require('./index.js').MathServer({
    MATH_PROGRAM: 'Macaulay2',
    MATH_PROGRAM_COMMAND: 'export WWWBROWSER=/usr/bin/open; export PATH=/usr/bin:$PATH; M2 --print-width 100',
    CONTAINERS: './sudoDockerContainers.js'
});
Macaulay2Server.listen();
