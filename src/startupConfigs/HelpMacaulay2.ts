var help = function() {
  var result = {
    emitHelpUrlToClient: function(client,
      viewHelp,
      logFunction,
      emitDataViaSockets) {
      logFunction("Look at " + viewHelp);
      var helpPath = viewHelp.match(/(\/Macaulay2Doc.*)$/);
      if (helpPath) {
        helpPath = helpPath[0];
      } else {
        return;
      }
      helpPath = "http://www.math.uiuc.edu/Macaulay2/doc/Macaulay2-1.10/" +
              "share/doc/Macaulay2" + helpPath;
      logFunction(helpPath);
      emitDataViaSockets(client.socketArray, "viewHelp", helpPath);
    },

    isViewHelpEvent: function(eventData) {
      return eventData.match(/^file:.*/) !== null;
    },
    stripSpecialLines: function(data) {
      var result = data.replace(
        /^.*>>SPECIAL_EVENT_START>>(.*)<<SPECIAL_EVENT_END<<.*$/mg, "");
      return result;
    }
  };
  return result;
};

exports.help = help;

