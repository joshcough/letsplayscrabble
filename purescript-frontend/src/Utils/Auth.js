// FFI implementation for Auth module
import * as Data_Maybe from "../Data.Maybe/index.js";

export const readInt = function(radix) {
  return function(str) {
    const parsed = parseInt(str, radix);
    if (isNaN(parsed)) {
      return Data_Maybe.Nothing.value;
    }
    return new Data_Maybe.Just(parsed);
  };
};
