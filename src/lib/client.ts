import {Instance} from "./instance";

export class Client {
    saneState: boolean;
    reconnecting: boolean;
    instance: Instance;
    socketArray: {[socketID: string]: any; };
    socket: any;
    mathProgramInstance: any;
    //clientId: string;
    constructor() {
        this.saneState = true;
        this.reconnecting = false;
        this.socketArray = [];
    }
    nSockets(): number{
      return Object.keys(this.socketArray).length;
    }
}

interface Clients {[clientId: string]: Client; }
export {Clients};
