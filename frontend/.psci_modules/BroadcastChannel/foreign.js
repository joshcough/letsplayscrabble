// BroadcastChannel FFI implementation

export const createImpl = function(name) {
  return function() {
    return new BroadcastChannel(name);
  };
};

export const postMessageImpl = function(channel, message) {
  return function() {
    channel.postMessage(message);
  };
};

export const onMessageImpl = function(channel, callback) {
  return function() {
    channel.onmessage = function(event) {
      callback(event.data)();
    };
  };
};

export const closeImpl = function(channel) {
  return function() {
    channel.close();
  };
};
