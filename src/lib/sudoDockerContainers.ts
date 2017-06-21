import {Instance} from "./instance";

const exec = require("child_process").exec;
let waitForSshd;

const dockerManager = function(OPTIONS) {
  const resources = OPTIONS.perContainerResources;
  const options = OPTIONS.containerConfig;
  const currentInstance = OPTIONS.startInstance;

  const removeInstance = function(instance: Instance) {
    console.log("Removing container: " + instance.containerName);
    const removeDockerContainer = "sudo docker rm -f " + instance.containerName;
    exec(removeDockerContainer, function(error) {
      if (error) {
        console.error("Error removing container " +
            instance.containerName + " with error:" + error);
      }
    });
  };

  const constructDockerRunCommand = function(resources, newInstance) {
    let dockerRunCmd = "sudo docker run -d";
    dockerRunCmd += " -c " + resources.cpuShares;
    dockerRunCmd += " -m " + resources.memory + "m";
    dockerRunCmd += " --name " + newInstance.containerName;
    dockerRunCmd += " -p " + newInstance.port + ":22 ";
    dockerRunCmd += options.containerType + " " + options.sshdCmd;
    return dockerRunCmd;
  };

  const getNewInstance = function(next){
    const newInstance = JSON.parse(JSON.stringify(currentInstance));
    currentInstance.port++;
    newInstance.containerName = "m2Port" + newInstance.port;
    exec(constructDockerRunCommand(resources, newInstance),
      function(error) {
        if (error) {
          const containerAlreadyStarted =
                error.message.match(/Conflict. The name/) ||
                error.message.match(/Conflict. The container name/);
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

  waitForSshd = function(next, instance: Instance) {
    const dockerRunningProcesses = "sudo docker exec " + instance.containerName +
        " ps aux";
    const filterForSshd = "grep \"" + options.sshdCmd + "\"";
    const excludeGrep = "grep -v grep";

    exec(dockerRunningProcesses + " | " + filterForSshd + " | " + excludeGrep,
      function(error, stdout, stderr) {
        if (error) {
          console.error("Error while waiting for sshd: " + error);
        }
        const runningSshDaemons = stdout;

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
    getNewInstance,
    removeInstance,
    updateLastActiveTime() {
    },
  };
};

exports.manager = dockerManager;
