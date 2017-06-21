var exists = function(clientId, clients, logFunction) {
  if (clientId in clients) {
    logFunction("Client already exists");
    return true;
  }
  return false;
};

module.exports = function(clients, logExceptOnTest) {
  return {
    getNewId: function() {
      var clientId;
      do {
        var randomId = Math.random() * 1000000;
        randomId = Math.floor(randomId);
        clientId = "user" + randomId.toString(10);
      } while (exists(clientId, clients, logExceptOnTest));
      logExceptOnTest("New Client ID " + clientId);
      return clientId;
    }
  };
};
