import * as $foreign from "./foreign.js";
var observe = function () {
    return $foreign["_observe"];
};
export {
    mutationObserver,
    disconnect,
    takeRecords
} from "./foreign.js";
export {
    observe
};
