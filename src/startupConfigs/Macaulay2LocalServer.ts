import {InstanceManager} from "../lib/instanceManager";
import {LocalContainerManager} from "../lib/LocalContainerManager";

require("./startup")({
  serverConfig: {
    CONTAINERS(): InstanceManager {
      return new LocalContainerManager();
    },
  },
});
