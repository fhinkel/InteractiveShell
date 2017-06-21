import {SocketEvent} from "../lib/enums";

const help = function() {
  const result = {
    emitHelpUrlToClient(client,
                        viewHelp,
                        logFunction,
                        emitDataViaSockets) {
      logFunction("Look at " + viewHelp);
      const url = viewHelp.replace("\"", "");
      emitDataViaSockets(client.socketArray, SocketEvent.viewHelp, url);
    },

    isViewHelpEvent(eventData) {
      return eventData.match(/http/) !== null;
    },
    stripSpecialLines(data) {
      let result = data.replace(
        /^.*>>SPECIAL_EVENT_START>>.*<<SPECIAL_EVENT_END<<(>.*$)/mg, "$1");
      result = result.replace(
        /^.*>>SPECIAL_EVENT_START>>(.*)<<SPECIAL_EVENT_END<<.*$/mg, "");
      return result;
    },
  };
  return result;
};

exports.help = help;
