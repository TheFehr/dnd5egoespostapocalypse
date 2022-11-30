import { MutationFeature } from './MutationFeature';

export interface MutationPoints {
  active: boolean;
  value: number;
  usage: number;
}

const MUTATION_POINTS_FEATURE = {
  name: 'Mutation Points',
  system: {
    activation: { type: 'special', cost: null, condition: '' },
    uses: { value: 0, max: 0, per: 'lr', recovery: '' },
  },
  type: 'feat',
  img: 'icons/svg/biohazard.svg',
};

export const mutationPoints_onCreated = async (mutation: MutationFeature) => {
  const flags = await mutation.flags();
  if (!flags.active) {
    return;
  }
  const mutationPoints = flags.mutationPoints;
  if (!mutationPoints.active) {
    return;
  }

  let mutationPointsFeature = mutation.item.actor?.items.find((item) => item.name === MUTATION_POINTS_FEATURE.name);
  if (!mutationPointsFeature) {
    const created = await mutation.item.actor?.createEmbeddedDocuments('Item', [
      {
        ...MUTATION_POINTS_FEATURE,
      },
    ]);

    if (created && created[0]) {
      mutationPointsFeature = created[0] as Item;
    }
  }

  if (!mutationPointsFeature) {
    console.error(`${constants.MODULE_ID} | Can't create Feature on Actor: ${mutation.item.actor?.name}`);
    return;
  }

  await mutationPointsFeature.update({
    system: {
      uses: {
        max: (mutationPointsFeature.system.uses.max || 0) + mutationPoints.value,
      },
    },
  });

  if (mutationPoints.usage > 0) {
    await mutation.item.update({
      system: {
        consume: {
          type: 'charges',
          target: mutationPointsFeature.id,
          amount: mutationPoints.usage,
        },
      },
    });
  }
};

export const mutationPoints_onDeleted = async (mutation: MutationFeature) => {
  const flags = await mutation.flags();
  if (!flags.active) {
    return;
  }
  const mutationPoints = flags.mutationPoints;
  if (!mutationPoints.active) {
    return;
  }

  const mutationPointsFeature = mutation.item.actor?.items.find((item) => item.name === MUTATION_POINTS_FEATURE.name);
  if (!mutationPointsFeature) {
    return;
  }

  const otherItems = await Promise.all(
    mutation.item.actor?.items.map(async (item) => {
      const isMutation = await MutationFeature.itemIsA(item);

      return { item, isMutation };
    }) as Promise<{ item: Item; isMutation: boolean }>[],
  );
  const otherMutationFeatures = otherItems.filter(({ isMutation }) => isMutation);

  if ((!otherMutationFeatures || otherMutationFeatures.length === 0) && mutationPointsFeature.id) {
    mutation.item.actor?.deleteEmbeddedDocuments('Item', [mutationPointsFeature.id]);
  } else {
    mutationPointsFeature.update({
      system: {
        uses: {
          max: (mutationPointsFeature.system.uses.max || mutationPoints.value) - mutationPoints.value,
        },
      },
    });
  }
};
