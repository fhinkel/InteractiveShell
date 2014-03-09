var SingularServer = require('./mathServer.js').MathServer({
    SECURE_CONTAINERS: true,
    MATH_PROGRAM: 'Singular'
});
SingularServer.listen();

