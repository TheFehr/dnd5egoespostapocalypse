import { getGame } from '../utils';
import { AppProps, MutationFeatureTab } from './MutationFeatureTab.js';
import { MutationFeature } from './MutationFeature';
import { actorSheet_onRender } from './MutationActor';

export const mutationHooks = () => {
  Hooks.on(`renderItemSheet5e`, async (app: AppProps, html: JQuery, data: { item: Item; editable: boolean }) => {
    if (!getGame().user?.isGM && getGame().settings.get('magicitems', 'hideFromPlayers')) {
      return;
    }

    await MutationFeatureTab.bind(app, html, data.item, data.editable);
  });

  Hooks.on(`renderActorSheet5eCharacter`, actorSheet_onRender);
  Hooks.on(`renderActorSheet5eNPC`, actorSheet_onRender);

  Hooks.on('createItem', async (item: Item) => {
    await MutationFeature.potentialEvent('createItem', item);
  });

  Hooks.on('deleteItem', async (item: Item) => {
    await MutationFeature.potentialEvent('deleteItem', item);
  });
};
