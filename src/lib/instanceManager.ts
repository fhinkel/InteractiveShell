import {Instance} from "./instance";

interface InstanceManager {
    getNewInstance(next: any);
    updateLastActiveTime(instance: Instance);
}

export {InstanceManager};
