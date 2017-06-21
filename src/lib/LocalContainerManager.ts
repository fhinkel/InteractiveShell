let localContainerManager = function() {
  const exec = require("child_process").exec;

  const options = {
    credentials: {
      host: "127.0.0.1",
      port: "22",
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

  const removeInstance = function() {
    return;
  };

  const getNewInstance = function(next) {
    next(false, options.credentials);
  };

  return {
    getNewInstance,
    removeInstance,
    updateLastActiveTime() {},
  };
};

exports.manager = localContainerManager;
