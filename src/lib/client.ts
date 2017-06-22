import {Instance} from "./instance";
import ssh2 = require("ssh2");

export class Client {
    saneState: boolean;
    reconnecting: boolean;
    instance: Instance;
    socketArray: {[socketID: string]: any; };
    mathProgramInstance: ssh2.ClientChannel;
    id: string;
    constructor(newId: string) {
        this.saneState = true;
        this.reconnecting = false;
        this.socketArray = [];
        this.id = newId;
    }
    nSockets(): number{
      return Object.keys(this.socketArray).length;
    }
}

interface Clients {[clientId: string]: Client; }
export {Clients};
