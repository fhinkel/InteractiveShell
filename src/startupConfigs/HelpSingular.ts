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
      let stripped = data.replace(
        /^.*>>SPECIAL_EVENT_START>>.*<<SPECIAL_EVENT_END<<(>.*$)/mg, "$1");
      stripped = stripped.replace(
        /^.*>>SPECIAL_EVENT_START>>(.*)<<SPECIAL_EVENT_END<<.*$/mg, "");
      return stripped;
    },
  };
  return result;
};

exports.help = help;
