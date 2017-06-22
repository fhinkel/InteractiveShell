import {InstanceManager} from "../lib/instanceManager";
import {LocalContainerManager} from "../lib/LocalContainerManager";

require("./startup")({
  serverConfig: {
    CONTAINERS(LocalContainerManager): InstanceManager {
      return new LocalContainerManager();
    },
  },
});
