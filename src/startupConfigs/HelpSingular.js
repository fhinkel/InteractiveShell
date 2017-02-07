var help = function(){
    var result = {
        emitHelpUrlToClient:function(client,
                                            viewHelp,
                                            logFunction,
                                            emitDataViaSockets) {
          logFunction("Look at " + viewHelp);
          emitDataViaSockets(client.socketArray, "viewHelp", viewHelp);
        },

        isViewHelpEvent : function(eventData) {
          return true;
        }
    }
    return result;
}

exports.help = help;

