import {LocalContainerManager} from "../lib/LocalContainerManager";

require("./startup")({
  serverConfig: {
    CONTAINERS(LocalContainerManager) {
      return new LocalContainerManager();
    },
  },
});
