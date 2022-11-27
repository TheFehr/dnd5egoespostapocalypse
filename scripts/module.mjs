import constants from './constants.mjs';
import mutations, { mutationHooks } from './mutations/mutations.mjs';

Hooks.once("init", async function () {
  
});

Hooks.once("ready", async function () {
  
});

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(constants.MODULE_ID);
});

mutationHooks();

window.DND5EGPA = {
  constants,

  mutations,
};
