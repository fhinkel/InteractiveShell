/* global OPTIONS */
var ssh2 = require('ssh2');
var fs = require('fs');

var sshDockerManager = function() {
  var resources = OPTIONS.perContainerResources;
  var guestInstance = OPTIONS.startInstance;
  var hostConfig = OPTIONS.hostConfig;

  var currentContainers = [];

  var init = function() {
    hostConfig.dockerRunCmd = hostConfig.dockerCmdPrefix + ' docker run -d';
    hostConfig.dockerRunCmd += ' --cpu-shares ' + resources.cpuShares;
    hostConfig.dockerRunCmd += ' -m ' + resources.memory + 'm';
    hostConfig.dockerRunCmd += ' --name';
  };

  init();

  var getDockerStartCmd = function(instance) {
    var result = hostConfig.dockerRunCmd;
    result += ' ' + instance.containerName;
    result += ' -p ' + instance.port + ":22";
    result += ' ' + hostConfig.containerType + " " + hostConfig.sshdCmd;
    return result;
  };

  var connectToHostAndExecCmd = function(cmd, next, errorHandler) {
    var connection = new ssh2.Client();
    connection.on('ready', function() {
      connection.exec(cmd, function(err, stream) {
        if (err) {
          throw err;
        }
        stream.on('close', function() {
          connection.end();
        });
        stream.on('end', function() {
          stream.close();
          // console.log('I ended.');
          connection.end();
        });
        stream.on('Error', function(err) {
          console.log("Error in stream: " + err);
        });
        next(stream);
      });
    }).on('error', function(error) {
      console.log("Error while sshing: " + error + "\nTried to do: " + cmd);
      if (errorHandler) {
        errorHandler(error);
      }
    }).connect({
      host: hostConfig.host,
      port: hostConfig.port,
      username: hostConfig.username,
      privateKey: fs.readFileSync(hostConfig.sshKey)
    });
  };

  var removeInstanceFromArray = function(instance) {
    var position = currentContainers.indexOf(instance);
    currentContainers.splice(position, 1);
  };

  var removeInstance = function(instance, next) {
    console.log("Removing container: " + instance.containerName);
    if (instance.killNotify) {
      instance.killNotify();
    }
    var removalCommand = hostConfig.dockerCmdPrefix + " docker rm -f " +
        instance.containerName;
    connectToHostAndExecCmd(removalCommand, function(stream) {
      stream.on('data', function() {
      });
      stream.stderr.on('data', function() {
      });
      removeInstanceFromArray(instance);
      if (next) {
        next();
      }
    });
  };

  var addInstanceToArray = function(instance) {
    currentContainers.push(instance);
  };

  var isLegal = function(instance) {
    var age = Date.now() - instance.lastActiveTime;
    return age > hostConfig.minContainerAge;
  };

  var sortInstancesByAge = function() {
    currentContainers.sort(function(a, b) {
      return a.lastActiveTime - b.lastActiveTime;
    });
  };

  var killOldestContainer = function(next) {
    sortInstancesByAge();
    if (isLegal(currentContainers[0])) {
      removeInstance(currentContainers[0], function() {
        getNewInstance(next);
      });
    } else {
      throw new Error("Too many active users.");
    }
  };

  var checkForSuccessfulContainerStart = function(instance, next) {
    var getListOfAllContainers = hostConfig.dockerCmdPrefix +
        ' docker ps --no-trunc | grep ' +
        instance.containerName +
        ' | wc -l';
    connectToHostAndExecCmd(getListOfAllContainers, function(stream) {
      stream.on('data', function(dataObject) {
        var data = dataObject.toString();
        if (data === "") {
          getNewInstance(next);
        } else {
          checkForRunningSshd(instance, next);
        }
      });

      stream.stderr.on('data', function() {
      });
    }, next);
  };

  var connectWithSshAndCreateContainer = function(instance, next) {
    var dockerRunCmd = getDockerStartCmd(instance);
    connectToHostAndExecCmd(dockerRunCmd, function(stream) {
      stream.on('data', function(dataObject) {
        instance.containerId = dataObject.toString();
        checkForSuccessfulContainerStart(instance, next);
      });
      stream.stderr.on('data', function(dataObject) {
        // If we get stderr, there will not come an id, so don't be
        // afraid of data.
        var data = dataObject.toString();
        if (data.match(/ERROR/i)) {
          getNewInstance(next);
          stream.end();
        }
      });
    }, next);
  };

  function getNewInstance(next) {
    if (currentContainers.length >= hostConfig.maxContainerNumber) {
      killOldestContainer(next);
    } else {
      var currentInstance = JSON.parse(JSON.stringify(guestInstance));
      guestInstance.port++;
      currentInstance.containerName = "m2Port" + currentInstance.port;
      connectWithSshAndCreateContainer(currentInstance, next);
    }
  }

  process.on('uncaughtException', function(err) {
    console.error('Caught exception in cm process object: ' + err);
  });

  function checkForRunningSshd(instance, next) {
    var getContainerProcesses = hostConfig.dockerCmdPrefix + " docker exec " +
        instance.containerName + " ps aux";
    var filterForSshd = "grep \"" + hostConfig.sshdCmd + "\"";
    var excludeGrepAndWc = "grep -v grep | wc -l";
    var sshdCheckCmd = getContainerProcesses + " | " + filterForSshd + " | " +
        excludeGrepAndWc;
    connectToHostAndExecCmd(sshdCheckCmd, function(stream) {
      stream.on('data', function(dataObject) {
        var data = dataObject.toString();
        if (data === "") {
          checkForRunningSshd(instance, next);
        } else {
          instance.lastActiveTime = Date.now();
          addInstanceToArray(instance);
          next(null, instance);
        }
      });

      stream.stderr.on('data', function() {
      });
    }, next);
  }

  var updateLastActiveTime = function(instance) {
    instance.lastActiveTime = Date.now();
  };

  return {
    getNewInstance: getNewInstance,
    removeInstance: removeInstance,
    updateLastActiveTime: updateLastActiveTime
  };
};

exports.manager = sshDockerManager;
