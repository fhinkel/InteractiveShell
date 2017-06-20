var help = function() {
  var result = {
    emitHelpUrlToClient: function(client,
                                            viewHelp,
                                            logFunction,
                                            emitDataViaSockets) {
      logFunction("Look at " + viewHelp);
      var url = viewHelp.replace("\"", "");
      emitDataViaSockets(client.socketArray, "viewHelp", url);
    },

    isViewHelpEvent: function(eventData) {
      return eventData.match(/http/) !== null;
    },
    stripSpecialLines: function(data) {
      var result = data.replace(/^.*>>SPECIAL_EVENT_START>>.*<<SPECIAL_EVENT_END<<(>.*$)/mg, '$1');
      result = result.replace(/^.*>>SPECIAL_EVENT_START>>(.*)<<SPECIAL_EVENT_END<<.*$/mg, "");
      return result;
    }
  };
  return result;
};

exports.help = help;

