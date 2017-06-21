import ssh2 = require("ssh2");
import fs = require("fs");
import {Instance} from "./instance";

const sshDockerManager = function(OPTIONS) {
  const resources = OPTIONS.perContainerResources;
  const guestInstance = OPTIONS.startInstance;
  const hostConfig = OPTIONS.hostConfig;

  const currentContainers = [];

  const init = function() {
    hostConfig.dockerRunCmd = hostConfig.dockerCmdPrefix + " docker run -d";
    hostConfig.dockerRunCmd += " --cpu-shares " + resources.cpuShares;
    hostConfig.dockerRunCmd += " -m " + resources.memory + "m";
    hostConfig.dockerRunCmd += " --name";
  };

  init();

  const getDockerStartCmd = function(instance : Instance) {
    let result = hostConfig.dockerRunCmd;
    result += " " + instance.containerName;
    result += " -p " + instance.port + ":22";
    result += " " + hostConfig.containerType + " " + hostConfig.sshdCmd;
    return result;
  };

  const connectToHostAndExecCmd = function(cmd, next, errorHandler) {
    const connection = new ssh2.Client();
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
          // console.log('I ended.');
          connection.end();
        });
        stream.on("Error", function(err) {
          console.log("Error in stream: " + err);
        });
        next(stream);
      });
    }).on("error", function(error) {
      console.log("Error while sshing: " + error + "\nTried to do: " + cmd);
      if (errorHandler) {
        errorHandler(error);
      }
    }).connect({
      host: hostConfig.host,
      port: hostConfig.port,
      username: hostConfig.username,
      privateKey: fs.readFileSync(hostConfig.sshKey),
    });
  };

  const removeInstanceFromArray = function(instance : Instance) {
    const position = currentContainers.indexOf(instance);
    currentContainers.splice(position, 1);
  };

  const removeInstance = function(instance : Instance, next) {
    console.log("Removing container: " + instance.containerName);
    if (instance.killNotify) {
      instance.killNotify();
    }
    const removalCommand = hostConfig.dockerCmdPrefix + " docker rm -f " +
        instance.containerName;
    connectToHostAndExecCmd(removalCommand, function(stream) {
      stream.on("data", function() {
      });
      stream.stderr.on("data", function() {
      });
      removeInstanceFromArray(instance);
      if (next) {
        next();
      }
    }, function() {});
  };

  const addInstanceToArray = function(instance : Instance) {
    currentContainers.push(instance);
  };

  const isLegal = function(instance : Instance) {
    const age = Date.now() - instance.lastActiveTime;
    return age > hostConfig.minContainerAge;
  };

  const sortInstancesByAge = function() {
    currentContainers.sort(function(a, b) {
      return a.lastActiveTime - b.lastActiveTime;
    });
  };

  const killOldestContainer = function(next) {
    sortInstancesByAge();
    if (isLegal(currentContainers[0])) {
      removeInstance(currentContainers[0], function() {
        getNewInstance(next);
      });
    } else {
      throw new Error("Too many active users.");
    }
  };

  const checkForSuccessfulContainerStart = function(instance : Instance, next) {
    const getListOfAllContainers = hostConfig.dockerCmdPrefix +
        " docker ps --no-trunc | grep " +
        instance.containerName +
        " | wc -l";
    connectToHostAndExecCmd(getListOfAllContainers, function(stream) {
      stream.on("data", function(dataObject) {
        const data = dataObject.toString();
        if (data === "") {
          getNewInstance(next);
        } else {
          checkForRunningSshd(instance, next);
        }
      });

      stream.stderr.on("data", function() {
      });
    }, next);
  };

  const connectWithSshAndCreateContainer = function(instance : Instance, next) {
    const dockerRunCmd = getDockerStartCmd(instance);
    connectToHostAndExecCmd(dockerRunCmd, function(stream) {
      stream.on("data", function(dataObject) {
        instance.containerId = dataObject.toString();
        checkForSuccessfulContainerStart(instance, next);
      });
      stream.stderr.on("data", function(dataObject) {
        // If we get stderr, there will not come an id, so don't be
        // afraid of data.
        const data = dataObject.toString();
        if (data.match(/ERROR/i)) {
          getNewInstance(next);
          stream.end();
        }
      });
    }, next);
  };

  function getNewInstance(next){
    if (currentContainers.length >= hostConfig.maxContainerNumber) {
      killOldestContainer(next);
    } else {
      const currentInstance = JSON.parse(JSON.stringify(guestInstance));
      guestInstance.port++;
      currentInstance.containerName = "m2Port" + currentInstance.port;
      connectWithSshAndCreateContainer(currentInstance, next);
    }
  }

  process.on("uncaughtException", function(err) {
    console.error("Caught exception in cm process object: " + err);
  });

  function checkForRunningSshd(instance : Instance, next) {
    const getContainerProcesses = hostConfig.dockerCmdPrefix + " docker exec " +
        instance.containerName + " ps aux";
    const filterForSshd = "grep \"" + hostConfig.sshdCmd + "\"";
    const excludeGrepAndWc = "grep -v grep | wc -l";
    const sshdCheckCmd = getContainerProcesses + " | " + filterForSshd + " | " +
        excludeGrepAndWc;
    connectToHostAndExecCmd(sshdCheckCmd, function(stream) {
      stream.on("data", function(dataObject) {
        const data = dataObject.toString();
        if (data === "") {
          checkForRunningSshd(instance, next);
        } else {
          instance.lastActiveTime = Date.now();
          addInstanceToArray(instance);
          next(null, instance);
        }
      });

      stream.stderr.on("data", function() {
      });
    }, next);
  }

  const updateLastActiveTime = function(instance : Instance) {
    instance.lastActiveTime = Date.now();
  };

  return {
    getNewInstance,
    removeInstance,
    updateLastActiveTime,
  };
};

exports.manager = sshDockerManager;
