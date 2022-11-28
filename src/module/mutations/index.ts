import setupMutationScore from './mutationScore.js';
import setupMutationPoints from './mutationPoints.js';

import { silentLog } from '../utils';

export default {
  setupMutationScore: (actor: Actor, mutation: Item) => {
    setupMutationScore({ actor, mutation });
  },

  setupMutationPoints: (actor: Actor, effect: ActiveEffect, mutation: Item) => {
    setupMutationPoints({ actor, effect, mutation });
  },
};

export const mutationHooks = () => {
  Hooks.on('createItem', (item: Item) => {
    if (item.type !== 'feat') return;
    if (!item.actor) return;
    const matches = item.system.description.value.match(/(Mutation Score|Mutation Points)+/);

    if (matches && matches.length >= 1) {
      if (matches.includes('Mutation Score')) {
        setupMutationScore({ actor: item.actor, mutation: item });
      } else if (matches.includes('Mutation Points')) {
        silentLog(item, matches);
        // setupMutationPoints({  })
      }
    }
  });
};
