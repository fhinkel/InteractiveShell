import {InstanceManager} from "../lib/instanceManager";
import {SudoDockerContainers} from "../lib/sudoDockerContainers";

const options = {
  serverConfig: {
    port: 8002,
    MATH_PROGRAM: "Singular",
    MATH_PROGRAM_COMMAND: "Singular",
    CONTAINERS(resources, hostConfig, guestInstance): InstanceManager {
      return new SudoDockerContainers(resources, hostConfig, guestInstance);
    },
    resumeString: "Type 'listvar();' to print the list of " +
    "existing variables.\n" +
    "Type 'basering;' to print the currently active ring.\n> ",
  },
  hostConfig: {
    containerType: "singular_container",
  },
  startInstance: {
    host: "127.0.0.1",
    sshKey: "/home/ubuntu/InteractiveShell/setups/Singular/id_rsa",
    username: "singularUser",
  },
  help: require("./HelpSingular").help(),
};

export {options};
