var assert = require("assert");
var spawn = require('child_process').spawn;


describe('Start docker container', function () {
    it('should show M2 preamble', function (done) {
        // ssh localhost

        var docker = "docker";
        var process = spawn(docker, ["run", "fhinkel/macaulay2", "M2"]);
        var encoding = "utf8";
        process.stderr.setEncoding(encoding);
        var preamble = '';
        process.stderr.on('data', function (data) {
            assert(data.match(/Macaulay2, version 1\.\d/),
                'M2 preamble does not match');
            process.kill();
            done();
        });
        process.on('error', function (error) {
            assert(false, error);
            next();
        })

    });
});



