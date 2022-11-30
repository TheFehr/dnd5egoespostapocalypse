import constants, { Constants } from './constants';
import { registerSettings } from './settings';
import { preloadTemplates } from './preloadTemplates';

import { mutationHooks } from './mutations';
import { getGame, log } from './utils';

interface DND5EGPA {
  constants: Constants;
}

declare global {
  interface Window {
    DND5EGPA: DND5EGPA;
  }
}

// Initialize module
Handlebars.registerHelper(`localizeDND5EGPA`, function (value: string) {
  const prefix = value.startsWith(constants.MODULE_NAME_SHORT) ? '' : `${constants.MODULE_NAME_SHORT}.`;
  return getGame().i18n.localize(`${prefix}${value}`);
});

Hooks.once('init', async () => {
  log(true, 'Initializing dnd5egoespostapocalypse');

  // Assign custom classes and constants here

  // Register custom module settings
  registerSettings();

  // Preload Handlebars templates
  await preloadTemplates();

  // Register custom sheets (if any)
});

// Setup module
Hooks.once('setup', async () => {
  // Do anything after initialization but before
  // ready
});

// When ready
Hooks.once('ready', async () => {
  // Do anything once the module is ready
});

// Add any additional hooks if necessary

// When dev mode ready
Hooks.once('devModeReady', ({ registerPackageDebugFlag }: { registerPackageDebugFlag: (moduleId: string) => void }) => {
  registerPackageDebugFlag(constants.MODULE_ID);
});

mutationHooks();

window.DND5EGPA = {
  constants,
};
