var SingularServer = require('./mathServer.js').MathServer({
    SECURE_CONTAINERS: true,
    SECURE_CONTAINERS_USER_NAME: "singular_user",
    MATH_PROGRAM: 'Singular'
});
SingularServer.listen();

