// Socket.IO FFI implementation
import { io } from 'socket.io-client';

export const connectImpl = function(url, options) {
  return function() {
    return io(url, options);
  };
};

export const onImpl = function(socket, eventName, callback) {
  return function() {
    socket.on(eventName, function(data) {
      callback(data)();
    });
  };
};

export const emitImpl = function(socket, eventName, data) {
  return function() {
    socket.emit(eventName, data);
  };
};

export const disconnectImpl = function(socket) {
  return function() {
    socket.disconnect();
  };
};

export const connectedImpl = function(socket) {
  return function() {
    return socket.connected;
  };
};
