var Macaulay2Server = require('./mathServer.js').MathServer({
    SECURE_CONTAINERS: true,
    MATH_PROGRAM: 'Macaulay2'
});
Macaulay2Server.listen();

