import setupMutationScore from './mutation_score.mjs';
import setupMutationPoints from './mutation_points.mjs';

import { log } from '../helpers.mjs';

export default {
  setupMutationScore: (actor, mutation) => {
    setupMutationScore({ actor, mutation });
  },

  setupMutationPoints: (actor, effect, mutation) => {
    setupMutationPoints({ actor, effect, mutation });
  }
}

export const mutationHooks = () => {
  Hooks.on('createItem', item => {
    if (!item.type === 'feat') return;
    if (!item.actor) return;
    const matches = item.system.description.value.match(/(Mutation Score|Mutation Points)+/);

    if (matches && matches.length >= 1) {
      if (matches.includes('Mutation Score')) {
        setupMutationScore({ actor: item.actor, mutation: item });
      } else if (matches.includes('Mutation Points')) {
        log({ item, matches });
        // setupMutationPoints({  })
      }
    }
  });
} 