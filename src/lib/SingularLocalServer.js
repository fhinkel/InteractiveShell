var SingularServer = require('./index.js').MathServer({
    MATH_PROGRAM: 'Singular',
    MATH_PROGRAM_COMMAND: 'Singular',
    CONTAINERS: './LocalContainerManager.js'
});
SingularServer.listen();

// Local Variables:
// indent-tabs-mode: nil
// tab-width: 4
// End:
