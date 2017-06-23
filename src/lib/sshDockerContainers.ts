import ssh2 = require("ssh2");
import fs = require("fs");

import {Instance} from "./instance";
import {InstanceManager} from "./instanceManager";

class SshDockerContainersInstanceManager implements InstanceManager {

  updateLastActiveTime(instance: Instance) {
    instance.lastActiveTime = Date.now();
  }

   private removeInstance(instance: Instance, next) {
    console.log("Removing container: " + instance.containerName);
    if (instance.killNotify) {
      instance.killNotify();
    }
    const removalCommand = this.hostConfig.dockerCmdPrefix + " docker rm -f " +
        instance.containerName;
    this.connectToHostAndExecCmd(removalCommand, (function(stream) {
      stream.on("data", function() {
      });
      stream.stderr.on("data", function() {
      });
      this.removeInstanceFromArray(instance);
      if (next) {
        next();
      }
    }).bind(this), function() {});
  }

  getNewInstance(next){
    if (this.currentContainers.length >= this.hostConfig.maxContainerNumber) {
      this.killOldestContainer(next);
    } else {
      const currentInstance = JSON.parse(JSON.stringify(this.guestInstance));
      this.guestInstance.port++;
      currentInstance.containerName = "m2Port" + currentInstance.port;
      this.connectWithSshAndCreateContainer(currentInstance, next);
    }
  }

resources: any;
hostConfig: ssh2.ConnectConfig & {containerType?: string,  maxContainerNumber?: number, dockerRunCmd?: string, dockerCmdPrefix?: string, sshdCmd?: string, sshKey?: string};
guestInstance: any;
currentContainers: any[];

private init = (function() {
    this.hostConfig.dockerRunCmd = this.hostConfig.dockerCmdPrefix + " docker run -d";
    this.hostConfig.dockerRunCmd += " --cpu-shares " + this.resources.cpuShares;
    this.hostConfig.dockerRunCmd += " -m " + this.resources.memory + "m";
    this.hostConfig.dockerRunCmd += " --name";
  }).bind(this);

 constructor(resources: any, options: any, currentInstance: Instance) {
   this.resources = resources;
   this.guestInstance = currentInstance;
   this.hostConfig = options;
   const currentContainers = [];
   this.currentContainers = currentContainers;
   this.init();
}

   private getDockerStartCmd(instance: Instance) {
    let result = this.hostConfig.dockerRunCmd;
    result += " " + instance.containerName;
    result += " -p " + instance.port + ":22";
    result += " " + this.hostConfig.containerType + " " + this.hostConfig.sshdCmd;
    return result;
  }

  private removeInstanceFromArray = function(instance: Instance) {
    const position = this.currentContainers.indexOf(instance);
    this.currentContainers.splice(position, 1);
  };

   private addInstanceToArray = function(instance: Instance) {
    this.currentContainers.push(instance);
  };

   private isLegal = function(instance: Instance) {
    const age = Date.now() - instance.lastActiveTime;
    return age > this.hostConfig.minContainerAge;
  };

   private sortInstancesByAge = function() {
    this.currentContainers.sort(function(a, b) {
      return a.lastActiveTime - b.lastActiveTime;
    });
  };

   private checkForSuccessfulContainerStart = (function(instance: Instance, next) {
    const getListOfAllContainers = this.hostConfig.dockerCmdPrefix +
        " docker ps --no-trunc | grep " +
        instance.containerName +
        " | wc -l";
    this.connectToHostAndExecCmd(getListOfAllContainers, (function(stream) {
      stream.on("data", (function(dataObject) {
        const data = dataObject.toString();
        if (data === "") {
          this.getNewInstance(next);
        } else {
          this.checkForRunningSshd(instance, next);
        }
      }).bind(this));

      stream.stderr.on("data", function() {
      });
    }).bind(this), next);
  }).bind(this);
/*
   process.on("uncaughtException", function(err) {
    console.error("Caught exception in cm process object: " + err);
  });
*/
   private checkForRunningSshd(instance: Instance, next) {
    const getContainerProcesses = this.hostConfig.dockerCmdPrefix + " docker exec " +
        instance.containerName + " ps aux";
    const filterForSshd = "grep \"" + this.hostConfig.sshdCmd + "\"";
    const excludeGrepAndWc = "grep -v grep | wc -l";
    const sshdCheckCmd = getContainerProcesses + " | " + filterForSshd + " | " +
        excludeGrepAndWc;
    this.connectToHostAndExecCmd(sshdCheckCmd, (function(stream) {
      stream.on("data", (function(dataObject) {
        const data = dataObject.toString();
        if (data === "") {
          this.checkForRunningSshd(instance, next);
        } else {
          instance.lastActiveTime = Date.now();
          this.addInstanceToArray(instance);
          next(null, instance);
        }
      }).bind(this));

      stream.stderr.on("data", function() {
      });
    }).bind(this), next);
  }

    connectToHostAndExecCmd(cmd, next, errorHandler) {
    const connection: ssh2.Client = new ssh2.Client();
    connection.on("ready", function() {
      connection.exec(cmd, function(err, stream) {
        if (err) {
          throw err;
        }
        stream.on("close", function() {
          connection.end();
        });
        stream.on("end", function() {
          stream.close();
          connection.end();
        });
        stream.on("Error", function(error) {
          console.log("Error in stream: " + error);
        });
        next(stream);
      });
    }).on("error", function(error) {
      console.log("Error while sshing: " + error + "\nTried to do: " + cmd);
      if (errorHandler) {
        errorHandler(error);
      }
    }).connect({
      host: this.hostConfig.host,
      port: this.hostConfig.port,
      username: this.hostConfig.username,
      privateKey: fs.readFileSync(this.hostConfig.sshKey),
    });
  }
    killOldestContainer = function(next) {
    this.sortInstancesByAge();
    if (this.isLegal(this.currentContainers[0])) {
      this.removeInstance(this.currentContainers[0], function() {
        this.getNewInstance(next);
      });
    } else {
      throw new Error("Too many active users.");
    }
  };

  connectWithSshAndCreateContainer = (function(instance: Instance, next) {
    const dockerRunCmd = this.getDockerStartCmd(instance);
    this.connectToHostAndExecCmd(dockerRunCmd, (function(stream) {
      stream.on("data", (function(dataObject) {
        instance.containerId = dataObject.toString();
        this.checkForSuccessfulContainerStart(instance, next);
      }).bind(this));
      stream.stderr.on("data", (function(dataObject) {
        // If we get stderr, there will not come an id, so don't be
        // afraid of data.
        const data = dataObject.toString();
        if (data.match(/ERROR/i)) {
          this.getNewInstance(next);
          stream.end();
        }
      }).bind(this));
    }).bind(this), next);
  }).bind(this);
}

export {SshDockerContainersInstanceManager as SshDockerContainers};
