var SingularServer = require('./index.js').MathServer({
    SECURE_CONTAINERS: true,
    SECURE_CONTAINERS_USER_NAME: "singular_user",
    MATH_PROGRAM: 'Singular',
    MATH_PROGRAM_COMMAND: 'Singular'
});
SingularServer.listen();

