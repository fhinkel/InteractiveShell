module.exports = function(clients, logExceptOnTest) {
  var exists = function(clientId) {
    if (clientId in clients) {
      logExceptOnTest("Client already exists");
      return true;
    }
    return false;
  };
  return {
    getNewId: function() {
      var clientId;
      do {
        var randomId = Math.random() * 1000000;
        randomId = Math.floor(randomId);
        clientId = "user" + randomId.toString(10);
      } while (exists(clientId));
      logExceptOnTest("New Client ID " + clientId);
      return clientId;
    }
  };
};
