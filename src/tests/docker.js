var assert = require("assert");
var spawn = require('child_process').spawn;


describe.skip('Start docker container', function() {
  before(function() {
    console.testLog = function() {
    };
  });
  it('should show M2 version', function(next) {
    var process = spawn("docker", ["run", "-t", "--rm=true", "fhinkel/macaulay2", "/bin/bash", "/usr/bin/M2", "--version"]);
    process.stdout.setEncoding("utf8");
    process.stderr.setEncoding("utf8");
    var result = '';
    process.stdout.on('data', function(data) {
      result += data;
      console.testLog('Version: ' + result);
      process.kill('SIGKILL');
    });
    process.stderr.on('data', function(data) {
      result += data;
      console.testLog('Version: ' + result);
      process.kill('SIGKILL');
    });
    process.on('error', function(error) {
      console.testLog('on error');
    });
    console.testLog('Is connected: ' + process.connected);
    process.on('exit', function(error) {
      console.testLog('EXIT for -t version');
      if (result.match(/1\.\d/)) {
        assert(true);
      } else if (result.match(/no such file or directory. Are you trying to connect to a TLS-enabled daemon without TLS/)) {
          assert(false, 'Error starting Docker container, is docker installed?\n' + result);
        } else if (result.match(/\/run\/docker.sock: permission denied/)) {
            assert(false, 'Error starting Docker container, permission denied. Maybe run test as root?\n' + result);
          }
            else {
            assert(false, 'M2 version: ' + result);
          }
    });
    process.on('close', function() {
      console.testLog('on close in version' + result);
      next();
    });
  });
  it('should show M2 version without -t', function(next) {
    var process = spawn("docker", ["run", "--rm=true", "fhinkel/macaulay2", "/bin/bash", "/usr/bin/M2", "--version"]);
    process.stdout.setEncoding("utf8");
    process.stderr.setEncoding("utf8");
    var result = '';
    process.stdout.on('data', function(data) {
      result += data;
      console.testLog('***Version: ' + result);
      process.kill('SIGKILL');
    });
    process.stderr.on('data', function(data) {
      result += data;
      console.testLog('***Version: ' + result);
      process.kill('SIGKILL');
    });
    process.on('error', function(error) {
      console.testLog('***on error');
    });
    process.on('close', function() {
      console.testLog('*** in close');
      next();
    });
    process.on('disconnect', function() {
      console.testLog('*** in disconnect');
    });
    console.testLog('Is connected: ' + process.connected);
    process.on('exit', function() {
      console.testLog('***on exit in version without -t' + result);
      if (result.match(/1\.\d/)) {
        assert(true);
      } else if (result.match(/no such file or directory. Are you trying to connect to a TLS-enabled daemon without TLS/)) {
          assert(false, 'Error starting Docker container, is docker installed?\n' + result);
        } else if (result.match(/\/run\/docker.sock: permission denied/)) {
            assert(false, 'Error starting Docker container, permission denied. Maybe run test as root?\n' + result);
          }
            else {
            assert(false, '***M2 version: ' + result);
          }
    });
  });

  it('should return after echo', function(next) {
    var process = spawn("docker", ["run", "fhinkel/macaulay2", "/bin/echo", "hello"]);
    process.stdout.setEncoding("utf8");
    var result;
    process.stdout.on('data', function(data) {
      result += data;
      process.kill('SIGKILL');
    });
    process.on('disconnected', function(error) {
      console.testLog('DISCONNECTED for preamble');
    });
    process.on('error', function(error) {
      console.testLog('on error');
    });
    console.testLog('Is connected: ' + process.connected);
    process.on('exit', function() {
      console.testLog('on exit in echo');
      if (result.match(/hello/)) {
        assert(true);
        next();
      }
      else {
        assert(false, 'echo hello failed: ' + result);
        next();
      }
    });
  });

  it('should show M2 preamble', function(next) {
    var process = spawn("docker", ["run", "fhinkel/macaulay2", "/bin/bash", "/usr/bin/M2", "-e", "exit 0;", "\n"]);
    process.stderr.setEncoding("utf8");
    process.stdout.setEncoding("utf8");
    var result = '';
    process.stdout.on('data', function(data) {
      result += data;
      console.testLog('first try out: ' + data);
      process.kill('SIGKILL');
    });
    process.stderr.on('data', function(data) {
      result += data;
      console.testLog('first try err: ' + data);
      process.kill('SIGKILL');
    });
    process.on('error', function(error) {
      console.testLog('on error');
    });
    console.testLog('Is connected: ' + process.connected);
    process.on('exit', function() {
      console.testLog('In exit in preamble');
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
    process.on('close', function() {
      console.testLog('Close in preamble');
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
      next();
    });
  });

  it('should show M2 preamble and exit', function(next) {
    var process = spawn("docker", ["run", "fhinkel/macaulay2", "/bin/bash", "-c", "echo\ \"exit\ 0;\"|M2"]);
    process.stderr.setEncoding("utf8");
    process.stdout.setEncoding("utf8");
    var result = '';
    process.stdout.on('data', function(data) {
      result += data;
      console.testLog('first try out: ' + data);
      process.kill('SIGKILL');
    });
    process.stderr.on('data', function(data) {
      result += data;
      console.testLog('first try err: ' + data);
      require('child_process').exec('docker ps -a', function(error, stdout, stderr) {
        console.testLog("error:***" + error);
        console.testLog("stdout: ***" + stdout);
        console.testLog("stderr: ***" + stderr);
      });
      process.kill('SIGKILL');
    });
    process.on('error', function(error) {
      console.testLog('on error');
    });
    console.testLog('Is connected: ' + process.connected);
    process.on('exit', function() {
      console.testLog('In exit in preamble');
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
    process.on('disconnected', function(error) {
      console.testLog('DISCONNECTED for preamble');
    });
    process.on('close', function() {
      console.testLog('Close in preamble');
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
      next();
    });
  });
});


