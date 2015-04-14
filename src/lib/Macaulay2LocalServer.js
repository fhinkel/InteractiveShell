var Macaulay2Server = require('./index.js').MathServer({
    MATH_PROGRAM: 'Macaulay2',
    MATH_PROGRAM_COMMAND: 'M2',
    CONTAINERS: './LocalContainerManager.js'
});
Macaulay2Server.listen();
