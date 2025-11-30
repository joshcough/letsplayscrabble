// | BroadcastChannel API bindings
import * as $foreign from "./foreign.js";
import * as Data_Function_Uncurried from "../Data.Function.Uncurried/index.js";

// | Post a message
var postMessage = /* #__PURE__ */ Data_Function_Uncurried.runFn2($foreign.postMessageImpl);

// | Register message listener
var onMessage = /* #__PURE__ */ Data_Function_Uncurried.runFn2($foreign.onMessageImpl);

// | Create a broadcast channel
var create = $foreign.createImpl;

// | Close channel
var close = $foreign.closeImpl;
export {
    createImpl,
    postMessageImpl,
    onMessageImpl,
    closeImpl
} from "./foreign.js";
export {
    create,
    postMessage,
    onMessage,
    close
};
