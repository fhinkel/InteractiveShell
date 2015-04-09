var assert = require("assert");
var spawn = require('child_process').spawn;


describe('Start docker container', function () {
    it('should show M2 preamble', function (next) {
        var process = spawn("docker", ["run", "fhinkel/macaulay2", "M2", "-e", "'exit 0;'"]);
        process.stderr.setEncoding("utf8");
        var result;
        process.stderr.on('data', function (data) {
            result += data;
        });
        process.on('error', function (error) {
            console.log('on error');
        });
        process.on('close', function() {
            if (result.match(/Macaulay2, version 1\.\d/)) {
                assert(true);
                next()
            } else if (result.match(/no such file or directory. Are you trying to connect to a TLS-enabled daemon without TLS/)) {
                assert(false, 'Error starting Docker container, is docker installed?\n' + result);
                next();
            } else if (result.match(/\/run\/docker.sock: permission denied/)) {
                assert(false, 'Error starting Docker container, permission denied. Maybe run test as root?\n' + result);
                next();
            }
            else {
                assert(false, 'M2 preamble did not match: ' + result);
                next();
            }
        });
    });
});



