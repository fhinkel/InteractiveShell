var SingularServer = require('./mathServer.js').MathServer({
    MATH_PROGRAM: 'Singular',
    MATH_PROGRAM_COMMAND: 'Singular'
});
SingularServer.listen();

// Local Variables:
// indent-tabs-mode: nil
// tab-width: 4
// End:
