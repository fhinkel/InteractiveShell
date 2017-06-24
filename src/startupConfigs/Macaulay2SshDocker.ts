import {InstanceManager} from "../lib/instanceManager";
import {SshDockerContainers} from "../lib/sshDockerContainers";

const options = {
  serverConfig: {
    port: 8002,
    MATH_PROGRAM: "Macaulay2",
    MATH_PROGRAM_COMMAND: "export WWWBROWSER=/usr/bin/open; " +
    "export PATH=/usr/bin:$PATH; " +
    "M2 --print-width 100",
    CONTAINERS(resources, hostConfig, guestInstance): InstanceManager {
      return new SshDockerContainers(resources, hostConfig, guestInstance);
    },
  },
  startInstance: {
    host: "192.168.2.42",
    username: "m2user",
    port: "5000",
    sshKey: "/home/ubuntu/keys/docker_key",
    containerName: "",
    lastActiveTime: 0,
  },
};

export {options};
