var SingularServer = require('./mathServer.js').MathServer({
    SECURE_CONTAINERS: true,
    MATH_PROGRAM: 'Singular'
});
SingularServer.listen();

// Local Variables:
// indent-tabs-mode: nil
// tab-width: 4
// End:
