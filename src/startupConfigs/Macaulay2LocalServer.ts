import {InstanceManager} from "../lib/instanceManager";
import {LocalContainerManager} from "../lib/LocalContainerManager";
import {startup} from "./startup";

startup({
  serverConfig: {
    CONTAINERS(): InstanceManager {
      return new LocalContainerManager();
    },
  },
});
