let exists = function(clientId: string, clients, logFunction) {
  if (clientId in clients) {
    logFunction("Client already exists");
    return true;
  }
  return false;
};

module.exports = function(clients, logFunction) {
  return {
    getNewId() {
      let clientId: string;
      do {
        let randomId = Math.random() * 1000000;
        randomId = Math.floor(randomId);
        clientId = "user" + randomId.toString(10);
      } while (exists(clientId, clients, logFunction));
      logFunction("New Client ID " + clientId);
      return clientId;
    },
  };
};
