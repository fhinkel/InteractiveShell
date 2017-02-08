var help = function(){
    var result = {
        emitHelpUrlToClient:function(client,
                                            viewHelp,
                                            logFunction,
                                            emitDataViaSockets) {
          logFunction("Look at " + viewHelp);
          var url = viewHelp.replace("\"","");
          emitDataViaSockets(client.socketArray, "viewHelp", url);
        },

        isViewHelpEvent : function(eventData) {
          return eventData.match(/Manual/) !== null;
        }
    }
    return result;
}

exports.help = help;

