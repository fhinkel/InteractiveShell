import {Instance} from "./instance";

interface InstanceManager {
    getNewInstance(next: any);
    removeInstance(instance: Instance, next?: any);
    updateLastActiveTime(instance: Instance);
}

export {InstanceManager};
