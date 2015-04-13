var SingularServer = require('./mathServer.js').MathServer({
    MATH_PROGRAM: 'Singular',
    MATH_PROGRAM_COMMAND: 'Singular',
    CONTAINERS: './dummy_containers.js'
});
SingularServer.listen();

// Local Variables:
// indent-tabs-mode: nil
// tab-width: 4
// End:
