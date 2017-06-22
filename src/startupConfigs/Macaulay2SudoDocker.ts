import {SudoDockerContainers} from "../lib/sudoDockerContainers";

require("./startup")({
  serverConfig: {
    port: 8002,
    MATH_PROGRAM_COMMAND: "export WWWBROWSER=/usr/bin/open; " +
    "export PATH=/usr/bin:$PATH; " +
    "M2 --print-width 100",
    CONTAINERS(resources, hostConfig, guestInstance) {
      return new SudoDockerContainers(resources, hostConfig, guestInstance);
    },
  },
});
