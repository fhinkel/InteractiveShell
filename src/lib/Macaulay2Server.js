var Macaulay2Server = require('./mathServer.js').MathServer({
    SECURE_CONTAINERS: true,
    SECURE_CONTAINERS_USER_NAME: "m2user",
    MATH_PROGRAM: 'Macaulay2',
    MATH_PROGRAM_COMMAND: 'M2 --no-tty'
});
Macaulay2Server.listen();

