// | Socket.IO client FFI bindings
import * as $foreign from "./foreign.js";
import * as Data_Function_Uncurried from "../Data.Function.Uncurried/index.js";
import * as Foreign from "../Foreign/index.js";

// | Listen for event on socket
var on = /* #__PURE__ */ Data_Function_Uncurried.runFn3($foreign.onImpl);

// | Check if socket is connected
var isConnected = $foreign.connectedImpl;

// | Emit event to server
var emit = /* #__PURE__ */ Data_Function_Uncurried.runFn3($foreign.emitImpl);

// | Disconnect from server
var disconnect = $foreign.disconnectImpl;

// | Default socket options
var defaultOptions = {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
};

// | Connect to Socket.IO server
var connect = function (url) {
    return function (opts) {
        return $foreign.connectImpl(url, Foreign.unsafeToForeign(opts));
    };
};
export {
    connectImpl,
    onImpl,
    emitImpl,
    disconnectImpl,
    connectedImpl
} from "./foreign.js";
export {
    defaultOptions,
    connect,
    on,
    emit,
    disconnect,
    isConnected
};
