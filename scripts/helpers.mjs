import constants from "./constants.mjs" 

export const log = ({ force, ...args }) => {
    try {
        const isDebugging = game.modules.get('_dev-mode').api.getPackageDebugValue(constants.MODULE_ID);

        if (force || isDebugging) {
            console.log(constants.MODULE_ID, '|', args);
        }
    } catch (e) {}
}