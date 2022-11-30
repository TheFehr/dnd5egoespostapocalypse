import { filterAsync } from '../utils';
import { MutationFeature } from './MutationFeature';
import { AppProps } from './MutationFeatureTab';

export interface ActorApp {
  object: {
    items: {
      get: (id: string) => Item;
    };
  };
}

export const actorSheet_onRender = async (
  app: AppProps & ActorApp,
  html: JQuery,
  data: { actor: Actor; editable: boolean },
) => {
  const mutationItems = await filterAsync<Item>([...data.actor.items], async (item: Item) => {
    const isAMutation = await MutationFeature.itemIsA(item);
    return isAMutation;
  });
  (mutationItems as (Item & { _id: string })[]).forEach((item) => {
    if (item._id) new MutationFeature(app.object.items.get(item._id), true);
  });
};
