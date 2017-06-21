var exists = function(clientId : string, clients, logFunction) {
  if (clientId in clients) {
    logFunction("Client already exists");
    return true;
  }
  return false;
};

module.exports = function(clients, logFunction) {
  return {
    getNewId: function() {
      var clientId : string;
      do {
        var randomId = Math.random() * 1000000;
        randomId = Math.floor(randomId);
        clientId = "user" + randomId.toString(10);
      } while (exists(clientId, clients, logFunction));
      logFunction("New Client ID " + clientId);
      return clientId;
    }
  };
};
