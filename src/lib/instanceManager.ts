import {Instance} from "./instance";

interface InstanceManager {
    public getNewInstance(next: any);
    public updateLastActiveTime(instance: Instance);
}

export {InstanceManager};
