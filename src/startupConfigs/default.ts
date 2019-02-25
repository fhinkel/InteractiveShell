import {AuthOption} from "../lib/enums";

const options = {
  cookieName: "tryM2",
  authentication: AuthOption.none,
  serverConfig: {
    CONTAINERS: "../lib/LocalContainerManager",
    MATH_PROGRAM: "Macaulay2",
    MATH_PROGRAM_COMMAND: "M2",
    port: "8002",
    resumeString: "Type 'listUserSymbols' to print the list of " +
    "existing symbols.\n\ni* : ",
  },
  startInstance: {
    host: "127.0.0.1",
    username: "m2user",
    port: "123",
    sshKey: process.env.HOME + "/InteractiveShell/id_rsa",
    containerName: "",
  },
  perContainerResources: {
    cpuShares: 2,
    memory: 256,
  },
  hostConfig: {
    minContainerAge: 10,
    maxContainerNumber: 1,
    containerType: "m2container",
    sshdCmd: "/usr/sbin/sshd -D",
    dockerCmdPrefix: "sudo ",
    host: "192.168.2.42",
    username: "vagrant",
    port: "22",
    sshKey: process.env.HOME + "/keys/host_key",
  },
  help: require("./HelpMacaulay2").help(),
};

const overrideDefaultOptions = function(overrideOptions, defaultOptions) {
  for (const opt in overrideOptions) {
    if (defaultOptions.hasOwnProperty(opt)) {
      if (defaultOptions[opt] instanceof Function) {
        defaultOptions[opt] = overrideOptions[opt];
      } else if (defaultOptions[opt] instanceof Object) {
        overrideDefaultOptions(overrideOptions[opt], defaultOptions[opt]);
      } else {
        defaultOptions[opt] = overrideOptions[opt];
      }
    } else {
      defaultOptions[opt] = overrideOptions[opt];
    }
  }
};

export {options, overrideDefaultOptions};
