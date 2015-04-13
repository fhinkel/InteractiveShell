var Macaulay2Server = require('./mathServer.js').MathServer({
    MATH_PROGRAM: 'Macaulay2',
    MATH_PROGRAM_COMMAND: 'export WWWBROWSER=/usr/bin/open; export PATH=/usr/bin:$PATH; M2 --print-width 100',
    CONTAINERS: './sudo_docker_containers.js'
});
Macaulay2Server.listen();
