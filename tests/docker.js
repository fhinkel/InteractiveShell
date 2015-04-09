var assert = require("assert");
var spawn = require('child_process').spawn;


describe('Start docker container', function () {
    it('should show M2 preamble', function (done) {
        var docker = "docker";
        var process = spawn(docker, ["run", "fhinkel/macaulay2", "M2", "-e", "exit 0;"]);
        var encoding = "utf8";
        process.stderr.setEncoding(encoding);
        var result = "";
        process.stderr.on('data', function (data) {
            console.log("Preamble: " + data);
            result += data;
            if (result.match(/Macaulay2, version 1\.\d/)) {
                assert(true);
                done()
            } else if (result.match(/Are you trying to connect to a TLS-enabled daemon without TLS?/)) {
                assert(false, 'Error starting Docker container, is docker installed?');
                done();
            }
        });
        process.on('error', function (error) {
            assert(false, error);
            done();
        });
        process.on('close', function() {
            console.log('on close');
            assert(result.match(/Macaulay2, version 1\.\d/),
                'M2 preamble does not match');
            done();
        });

    });
});



