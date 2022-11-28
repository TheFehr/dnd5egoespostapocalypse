import constants, { Constants } from './constants.js';

export const log = (force: boolean, ...args: any[]) => {
  try {
    const isDebugging = game.modules.get('_dev-mode').api.getPackageDebugValue(constants.MODULE_ID);

    if (force || isDebugging) {
      console.log(constants.MODULE_ID, '|', args);
    }
  } catch (e) {}
};

export const silentLog = (...args: any[]) => {
  log(false, ...args);
};
