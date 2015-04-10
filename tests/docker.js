var assert = require("assert");
var spawn = require('child_process').spawn;


describe('Start docker container', function () {
    it('should show M2 version', function (next) {
        var process = spawn("docker", ["run", "-t", "fhinkel/macaulay2", "M2", "--version"]);
        process.stdout.setEncoding("utf8");
        process.stderr.setEncoding("utf8");
        var result= '';
        process.stdout.on('data', function (data) {
            result += data;
            console.log('Version: ' + result);
        });
        process.stderr.on('data', function (data) {
            result += data;
            console.log('Version: ' + result);
        });
        process.on('error', function (error) {
            console.log('on error');
        });
        process.on('exit', function (error) {
            console.log('EXIT for -t version');
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
        process.on('close', function() {
            console.log('on close in version' + result);
        });
    });
    it('should show M2 version without -t', function (next) {
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
        process.on('exit', function() {
            console.log('on exit in version without -t' + result);
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
        process.on('disconnected', function (error) {
            console.log('DISCONNECTED for preamble');
        });
        process.on('error', function (error) {
            console.log('on error');
        });
        process.on('exit', function() {
            console.log('on exit in echo');
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

    it('should show M2 preamble', function (next) {
        var process = spawn("docker", ["run", "fhinkel/macaulay2", "M2", "-e",  "exit 0;"]);
        process.stderr.setEncoding("utf8");
        process.stdout.setEncoding("utf8");
        var result = '';
        process.stdout.on('data', function (data) {
            result += data;
            console.log('first try out: ' + data);
        });
        process.stderr.on('data', function (data) {
            result += data;
            console.log('first try err: ' + data);
            process.kill('SIGKILL');
        });
        process.on('error', function (error) {
            console.log('on error');
        });
        process.on('exit', function() {
            console.log('In exit in preamble');
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
        process.on('close', function() {
            console.log('Close in preamble');
            if (result.match(/Macaulay2, version 1\.\d/)) {
                assert(true);
            } else if (result.match(/no such file or directory. Are you trying to connect to a TLS-enabled daemon without TLS/)) {
                assert(false, 'Error starting Docker container, is docker installed?\n' + result);
            } else if (result.match(/\/run\/docker.sock: permission denied/)) {
                assert(false, 'Error starting Docker container, permission denied. Maybe run test as root?\n' + result);
            }
            else {
                assert(false, 'M2 preamble did not match: ' + result);
            }
        });
    });
});



