import {Instance} from "./instance";
import ssh2 = require("ssh2");

export class Client {
    public saneState: boolean;
    public reconnecting: boolean;
    public instance: Instance;
    public socketArray: {[socketID: string]: any; };
    public channel: ssh2.ClientChannel;
    public id: string;
    constructor(newId: string) {
        this.saneState = true;
        this.reconnecting = false;
        this.socketArray = [];
        this.id = newId;
    }
    public nSockets(): number {
        return Object.keys(this.socketArray).length;
    }
}

interface Clients {[clientId: string]: Client; }
export {Clients};
