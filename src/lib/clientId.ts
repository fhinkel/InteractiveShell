import {Clients} from "./client";

const exists = function(clientId: string, clients: Clients, logFunction) {
  if (clientId in clients) {
    logFunction("Client already exists");
    return true;
  }
  return false;
};

export default function clientIdHelper(clients: Clients, logFunction) {
  return {
    getNewId() {
      let clientId: string;
      do {
        let randomId: number = Math.random() * 1000000;
        randomId = Math.floor(randomId);
        clientId = "user" + randomId.toString(10);
      } while (exists(clientId, clients, logFunction));
      logFunction("New Client ID " + clientId);
      return clientId;
    },
  };
}
