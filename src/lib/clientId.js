module.exports = function(clients, logExceptOnTest) {
  var exists = function(clientId) {
    if (clients[clientId] == null) {
      return false;
    }
    logExceptOnTest(clientId, "Client already exists");
    return true;
  };
  return {
    getNewId: function() {
      clients.totalUsers += 1;
      do {
        var clientId = Math.random() * 1000000;
        clientId = Math.floor(clientId);
      } while (exists(clientId));
      clientId = "user" + clientId.toString(10);
      logExceptOnTest("New Client ID " + clientId);
      return clientId;
    }
  };
};
