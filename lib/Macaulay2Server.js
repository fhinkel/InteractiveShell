var Macaulay2Server = require('./mathServer.js').MathServer({
    SECURE_CONTAINERS: true,
    SECURE_CONTAINERS_USER_NAME: "m2user",
    MATH_PROGRAM: 'Macaulay2'
});
Macaulay2Server.listen();

