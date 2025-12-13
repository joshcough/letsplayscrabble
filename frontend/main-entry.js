// Import PureScript's isLoggingEnabled function
import { isLoggingEnabled } from './output/Utils.Logger/index.js';

// Check if logging is enabled (this is an Effect, so we need to call it)
const loggingEnabled = isLoggingEnabled();

// Only log if logging is enabled via ?logging=true URL param
if (loggingEnabled) {
  console.log('[ENTRY] Starting main-entry.js at', new Date().toISOString());
}

import { main } from './output/Main/index.js';

if (loggingEnabled) {
  console.log('[ENTRY] Imported main, calling it now');
}

main();

if (loggingEnabled) {
  console.log('[ENTRY] main() called');
}
