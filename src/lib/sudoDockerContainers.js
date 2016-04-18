/* global OPTIONS */

var exec = require('child_process').exec;
var waitForSshd;

var dockerManager = function() {
  var resources = OPTIONS.perContainerResources;
  var options = OPTIONS.containerConfig;
  var currentInstance = OPTIONS.startInstance;

  var removeInstance = function(instance) {
    console.log("Removing container: " + instance.containerName);
    var removeDockerContainer = 'sudo docker rm -f ' + instance.containerName;
    exec(removeDockerContainer, function(error) {
      if (error) {
        console.error("Error removing container " +
            instance.containerName + ' with error:' + error);
      }
    });
  };

  var constructDockerRunCommand = function(resources, newInstance) {
    var dockerRunCmd = 'sudo docker run -d';
    dockerRunCmd += ' -c ' + resources.cpuShares;
    dockerRunCmd += ' -m ' + resources.memory + 'm';
    dockerRunCmd += ' --name ' + newInstance.containerName;
    dockerRunCmd += ' -p ' + newInstance.port + ':22 ';
    dockerRunCmd += options.containerType + ' ' + options.sshdCmd;
    return dockerRunCmd;
  };

  var getNewInstance = function(next) {
    var newInstance = JSON.parse(JSON.stringify(currentInstance));
    currentInstance.port++;
    newInstance.containerName = "m2Port" + newInstance.port;
    exec(constructDockerRunCommand(resources, newInstance),
        function(error) {
          if (error) {
            var containerAlreadyStarted =
                error.message.match(/Conflict. The name/);
            if (containerAlreadyStarted) {
              getNewInstance(next);
            } else {
              console.error("Error starting the docker container: " +
                  error.message);
              throw error;
            }
          } else {
            waitForSshd(next, newInstance);
          }
        });
  };

  waitForSshd = function(next, instance) {
    var dockerRunningProcesses = "sudo docker exec " + instance.containerName +
        " ps aux";
    var filterForSshd = "grep \"" + options.sshdCmd + "\"";
    var excludeGrep = "grep -v grep";

    exec(dockerRunningProcesses + " | " + filterForSshd + " | " + excludeGrep,
        function(error, stdout, stderr) {
          if (error) {
            console.error("Error while waiting for sshd: " + error);
          }
          var runningSshDaemons = stdout;

          console.log("Looking for sshd. OUT: " + stdout + " ERR: " + stderr);

          if (runningSshDaemons) {
            console.log("sshd is ready.");
            next(null, instance);
          } else {
            console.log("sshd not ready yet.");
            waitForSshd(next, instance);
          }
        });
  };

  return {
    getNewInstance: getNewInstance,
    removeInstance: removeInstance,
    updateLastActiveTime: function() {
    }
  };
};

exports.manager = dockerManager;
