import {SocketEvent} from "../lib/enums";
const help = function() {
  const result = {
    emitHelpUrlToClient(client,
                        viewHelp,
                        logFunction,
                        emitDataViaSockets) {
      logFunction("Look at " + viewHelp);
      let helpPath = viewHelp.match(/(\/Macaulay2Doc.*)$/);
      if (helpPath) {
        helpPath = helpPath[0];
      } else {
        return;
      }
      helpPath = "http://www.math.uiuc.edu/Macaulay2/doc/Macaulay2-1.10/" +
              "share/doc/Macaulay2" + helpPath;
      logFunction(helpPath);
      emitDataViaSockets(client.socketArray, SocketEvent.viewHelp, helpPath);
    },

    isViewHelpEvent(eventData) {
      return eventData.match(/^file:.*/) !== null;
    },
    stripSpecialLines(data) {
      const result = data.replace(
        /^.*>>SPECIAL_EVENT_START>>(.*)<<SPECIAL_EVENT_END<<.*$/mg, "");
      return result;
    },
  };
  return result;
};

exports.help = help;
