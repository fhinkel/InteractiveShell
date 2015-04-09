var assert = require("assert");
var spawn = require('child_process').spawn;


describe('Start docker container', function () {
    it('should show M2 preamble', function (next) {
        var process = spawn("docker", ["run", "fhinkel/macaulay2", "M2", "-e", "exit\ 0;"]);
        process.stderr.setEncoding("utf8");
        var result = '';
        setTimeout(next(), 7000);
        process.stderr.on('data', function (data) {
            result += data;
            console.log('first try: ' + data);
        });
        process.on('error', function (error) {
            console.log('on error');
        });
        process.on('close', function() {
            console.log('Close in preamble');
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

    it('should show M2 version', function (next) {
        var process = spawn("docker", ["run", "fhinkel/macaulay2", "M2", "--version"]);
        process.stdout.setEncoding("utf8");
        var result= '';
        process.stdout.on('data', function (data) {
            result += data;
            console.log('Version: ' + result);
        });
        process.on('error', function (error) {
            console.log('on error');
        });
        process.on('close', function() {
            console.log('on close in version');
            if (result.match(/1\.\d/)) {
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
                assert(false, 'M2 version: ' + result);
                next();
            }
        });
    });

    it('should return after echo', function (next) {
        var process = spawn("docker", ["run", "fhinkel/macaulay2", "/bin/echo", "hello"]);
        process.stdout.setEncoding("utf8");
        var result;
        process.stdout.on('data', function (data) {
            result += data;
        });
        process.on('error', function (error) {
            console.log('on error');
        });
        process.on('close', function() {
            console.log('on close in echo');
            if (result.match(/hello/)) {
                assert(true);
                next()
            }
            else {
                assert(false, 'echo hello failed: ' + result);
                next();
            }
        });
    });
});



