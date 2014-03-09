var SingularServer = require('./mathServer.js').MathServer();
SingularServer.listen({
    MATH_PROGRAM: 'Singular'
});

// Local Variables:
// indent-tabs-mode: nil
// tab-width: 4
// End:
