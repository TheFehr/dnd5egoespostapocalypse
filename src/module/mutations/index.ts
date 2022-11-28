import setupMutationScore from './mutationScore.js';
import setupMutationPoints from './mutationPoints.js';

import { getGame } from '../utils';
import { MutationFeatureTab } from './MutationFeatureTab.js';
import { MutationFeature } from './MutationFeature';

export default {
  setupMutationScore: (actor: Actor, mutation: Item) => {
    setupMutationScore({ actor, mutation });
  },

  setupMutationPoints: (actor: Actor, effect: ActiveEffect, mutation: Item) => {
    setupMutationPoints({ actor, effect, mutation });
  },
};

export const mutationHooks = () => {
  Hooks.on('createItem', async (item: Item) => {
    await MutationFeature.potentialEvent('createItem', item);
  });

  Hooks.on('deleteItem', async (item: Item) => {
    await MutationFeature.potentialEvent('deleteItem', item);
  });

  Hooks.on(`renderItemSheet5e`, async (app: unknown, html: JQuery, data: { item: Item; editable: boolean }) => {
    if (!getGame().user?.isGM && getGame().settings.get('magicitems', 'hideFromPlayers')) {
      return;
    }

    await MutationFeatureTab.bind(app, html, data.item, data.editable);
  });
};
