import {Instance} from "./instance";
import {InstanceManager} from "./instanceManager";

class LocalContainerManager implements InstanceManager {
exec = require("child_process").exec;
options: any;

constructor() {
  const options = {
    credentials: {
      host: "127.0.0.1",
      port: "22",
      username: undefined,
      sshKey: undefined,
    },
  };
  this.exec("whoami", function(error, username) {
    options.credentials.username = username.trim();
  });

  this.exec("echo $HOME", function(error, homedir) {
    options.credentials.sshKey = homedir.trim() + "/.ssh/id_rsa";
  });

  this.options = options;
}
removeInstance = function() {};

getNewInstance = function(next) {
    next(false, this.options.credentials);
  };

updateLastActiveTime() {}
}

export {LocalContainerManager as LocalContainerManager};
