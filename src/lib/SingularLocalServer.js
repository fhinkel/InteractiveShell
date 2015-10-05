GLOBAL.OPTIONS = require('./default.js').get_config({
    server_config: {
        port: 8002,
        MATH_PROGRAM: 'Singular',
        MATH_PROGRAM_COMMAND: 'Singular -v',
        CONTAINERS: './LocalContainerManager.js'
    }
});

console.log(OPTIONS);

var SingularServer = require('./index.js').MathServer();
SingularServer.listen();
