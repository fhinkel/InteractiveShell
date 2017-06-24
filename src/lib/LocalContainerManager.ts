import {Instance} from "./instance";
import {InstanceManager} from "./instanceManager";

import child_process = require("child_process");
const exec = child_process.exec;

class LocalContainerManager implements InstanceManager {
options: any;

constructor() {
  const options = {
    credentials: {
      host: "127.0.0.1",
      port: 22,
      username: undefined,
      sshKey: undefined,
    },
  };
  exec("whoami", function(error, username) {
    options.credentials.username = username.trim();
  });

  exec("echo $HOME", function(error, homedir) {
    options.credentials.sshKey = homedir.trim() + "/.ssh/id_rsa";
  });

  this.options = options;
}
removeInstance = function(instance: Instance, next?: any) {
  //
};

getNewInstance = function(next: any) {
    next(false, this.options.credentials);
  };

updateLastActiveTime(instance: Instance) {
  //
}
}

export {LocalContainerManager as LocalContainerManager};
