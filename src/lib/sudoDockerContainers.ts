import {Instance} from "./instance";
import {InstanceManager} from "./instanceManager";

import child_process = require("child_process");
const exec = child_process.exec;

class SudoDockerContainersInstanceManager implements InstanceManager {
  private resources: any;
  private options: any;
  private currentInstance: any;

  constructor(resources: any, options: any, currentInstance: Instance) {
    this.resources = resources;
    this.options = options;
    this.currentInstance = currentInstance;
  }

  public getNewInstance(next) {
    const newInstance = JSON.parse(JSON.stringify(this.currentInstance));
    this.currentInstance.port++;
    newInstance.containerName = "m2Port" + newInstance.port;
    exec(this.constructDockerRunCommand(this.resources, newInstance),
      (function(error) {
        if (error) {
          const containerAlreadyStarted =
                error.message.match(/Conflict. The name/) ||
                error.message.match(/Conflict. The container name/);
          if (containerAlreadyStarted) {
            this.getNewInstance(next);
          } else {
            console.error("Error starting the docker container: " +
                  error.message);
            throw error;
          }
        } else {
          this.waitForSshd(next, newInstance);
        }
      }).bind(this));
  }

  public updateLastActiveTime() {
    //
  }

  private removeInstance(instance: Instance) {
    console.log("Removing container: " + instance.containerName);
    const removeDockerContainer = "sudo docker rm -f " + instance.containerName;
    exec(removeDockerContainer, function(error) {
      if (error) {
        console.error("Error removing container " +
            instance.containerName + " with error:" + error);
      }
    });
  }

  private constructDockerRunCommand(resources, newInstance: Instance) {
    let dockerRunCmd = "sudo docker run -d";
    dockerRunCmd += " -c " + resources.cpuShares;
    dockerRunCmd += " -m " + resources.memory + "m";
    dockerRunCmd += " --name " + newInstance.containerName;
    dockerRunCmd += " -p " + newInstance.port + ":22 ";
    dockerRunCmd += this.options.containerType + " " + this.options.sshdCmd;
    return dockerRunCmd;
  }

  private waitForSshd(next, instance: Instance) {
    const dockerRunningProcesses = "sudo docker exec " + instance.containerName +
        " ps aux";
    const filterForSshd = "grep \"" + this.options.sshdCmd + "\"";
    const excludeGrep = "grep -v grep";

    const self = this;
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
          self.waitForSshd(next, instance);
        }
      });
  }
}

export {SudoDockerContainersInstanceManager as SudoDockerContainers};
