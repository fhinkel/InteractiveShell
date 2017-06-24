import {InstanceManager} from "../lib/instanceManager";
import {LocalContainerManager} from "../lib/LocalContainerManager";

const options = {
  serverConfig: {
    CONTAINERS(): InstanceManager {
      return new LocalContainerManager();
    },
  },
};

export {options};
