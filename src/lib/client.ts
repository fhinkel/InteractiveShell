import {Instance} from "./instance";
import ssh2 = require("ssh2");

export class Client {
    public saneState: boolean;
    public instance: Instance;
    public socketArray: {[socketID: string]: any; };
    public channel: ssh2.ClientChannel;
    public id: string;
    constructor(newId: string) {
        this.saneState = true;
        this.socketArray = [];
        this.id = newId;
    }
    public nSockets(): number {
        return Object.keys(this.socketArray).length;
    }
}

interface IClients {[clientId: string]: Client; }
export {IClients};
