var Macaulay2Server = require('./mathServer.js').MathServer({
    MATH_PROGRAM: 'Macaulay2'
});
Macaulay2Server.listen();