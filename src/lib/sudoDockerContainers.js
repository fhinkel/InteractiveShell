var exec = require('child_process').exec;
var waitForSshd;

var dockerManager = function() {
  var resources = OPTIONS.per_container_resources;
  var options = OPTIONS.container_config;

  var removeInstance = function(instance) {
    console.log("Removing container: " + instance.containerName);
    var removeDockerContainer = 'sudo docker rm -f ' + instance.containerName;
    exec(removeDockerContainer, function(error) {
      if (error) {
        console.error("Error removing container " + instance.containerName + ' with error:' + error);
      }
    });
  };

  var constructDockerRunCommand = function(resources, currentInstance) {
    var dockerRunCmd = 'sudo docker run -d';
    dockerRunCmd += ' -c ' + resources.cpuShares;
    dockerRunCmd += ' -m ' + resources.memory + 'm';
    dockerRunCmd += ' --name ' + currentInstance.containerName;
    dockerRunCmd += ' -p ' + currentInstance.port + ':22 ';
    dockerRunCmd += options.containerType + ' ' + options.sshdCmd;
    return dockerRunCmd;
  };

  var getNewInstance = function(next) {
    var currentInstance = JSON.parse(JSON.stringify(options.instance));
    options.instance.port++;
    currentInstance.containerName = "m2Port" + currentInstance.port;
    exec(constructDockerRunCommand(resources, currentInstance), function(error) {
      if (error) {
        var containerAlreadyStarted = error.message.match(/Conflict. The name/);
        if (containerAlreadyStarted) {
          getNewInstance(next);
        } else {
          console.error("There was an error starting the docker container: " + error.message);
          throw error;
        }
      } else {
        waitForSshd(next, currentInstance);
      }
    });
  };

  waitForSshd = function(next, instance) {
    var dockerRunningProcesses = "sudo docker exec " + instance.containerName + " ps aux";
    var filterForSshd = "grep \"" + options.sshdCmd + "\"";
    var excludeGrep = "grep -v grep";

    exec(dockerRunningProcesses + " | " + filterForSshd + " | " + excludeGrep, function(error, stdout, stderr) {
      if (error) {
        console.error("There was an error while waiting for sshd: " + error);
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
