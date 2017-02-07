var help = function(){
    var result = {
        emitHelpUrlToClient:function(client,
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
          helpPath = "http://www.math.uiuc.edu/Macaulay2/doc/Macaulay2-1.9/" +
              "share/doc/Macaulay2" + helpPath;
          logFunction(helpPath);
          emitDataViaSockets(client.socketArray, "viewHelp", helpPath);
        },

        isViewHelpEvent : function(eventData) {
          return eventData.match(/^file:.*/) !== null;
        }
    }
    return result;
}

exports.help = help;

