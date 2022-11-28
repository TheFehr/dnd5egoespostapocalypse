import constants from './constants.js';

export const log = (force: boolean, ...args: unknown[]) => {
  try {
    const isDebugging = game.modules.get('_dev-mode').api.getPackageDebugValue(constants.MODULE_ID);

    if (force || isDebugging) {
      console.log(constants.MODULE_ID, '|', ...args);
    }
  } catch (e) {}
};

export const silentLog = (...args: unknown[]) => {
  log(false, ...args);
};

export const getGame = (): Game => {
  if (!(game instanceof Game)) {
    throw new Error('game is not initialized yet!');
  }
  return game;
};
