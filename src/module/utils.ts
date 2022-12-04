import constants from './constants.js';

export const log = (force: boolean, ...args: unknown[]) => {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const isDebugging = getGame()?.modules.get('_dev-mode')?.api.getPackageDebugValue(constants.MODULE_ID);

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

export const mapAsync = async <T, U>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<U>,
): Promise<U[]> => {
  return await Promise.all(array.map(callbackfn));
};

export const filterAsync = async <T>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>,
): Promise<T[]> => {
  const filterMap = await mapAsync(array, callbackfn);
  return array.filter((value, index) => filterMap[index]);
};

export const calculateModifier = (score: number) => {
  return Math.floor((score - 10) / 2);
};
