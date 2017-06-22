import {InstanceManager} from "../lib/instanceManager";
import {LocalContainerManager} from "../lib/LocalContainerManager";

require("./startup")({
  serverConfig: {
    port: 8002,
    MATH_PROGRAM: "Singular",
    MATH_PROGRAM_COMMAND: "Singular",
    CONTAINERS(LocalContainerManager): InstanceManager {
      return new LocalContainerManager();
    },
  },
});
