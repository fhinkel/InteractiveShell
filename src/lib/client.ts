import {Instance} from "./instance";

export class Client {
    saneState: boolean;
    reconnecting: boolean;
    instance: Instance;
    socketArray: any;
    socket: any;
    mathProgramInstance: any;
    //clientId: string;
    constructor() {
        this.saneState = true;
        this.reconnecting = false;
    }
}

interface Clients {[clientId: string]: Client; }
export {Clients};
