import constants from '../constants';

const MUTATION_POINTS_FEATURE = {
  name: 'Mutation Points',
  system: {
    activation: { type: 'special', cost: null, condition: '' },
    uses: { value: 0, max: 0, per: 'lr', recovery: '' },
  },
  type: 'feat',
  img: 'icons/svg/biohazard.svg',
};

export interface MutationFeatureFlags {
  active: boolean;
  mutationPoints: MutationPoints;
  mutationScore: MutationScore;
}

export interface MutationPoints {
  active: boolean;
  value: number;
  usage: number;
}

export interface MutationScore {
  active: boolean;
  value: number;
  mod: number;
}

export class MutationFeature {
  item: Item;
  readonly: boolean;

  constructor(item: Item, readonly: boolean) {
    this.item = item;
    this.readonly = readonly;
  }

  async activeModules(): Promise<string[]> {
    const flags = await this.flags();

    return [
      { module: 'mutation', isActive: flags.active },
      { module: 'mutationPoints', isActive: flags.mutationPoints.active },
    ]
      .filter(({ isActive }) => isActive)
      .map(({ module }) => module);
  }

  async flags(reset = false, retry = 0): Promise<MutationFeatureFlags> {
    if (retry >= 3) {
      throw new Error("Can't seem to load / prepare flags!");
    }

    const flags = await this.item.getFlag(constants.MODULE_ID, 'mutationFeature');

    if (flags != undefined && (flags as MutationFeatureFlags)) {
      return flags as MutationFeatureFlags;
    }

    if (this.readonly) {
      return {
        active: flags?.activate || false,
        mutationPoints: {
          active: flags?.mutationPoints?.active || false,
          value: flags?.mutationPoints?.value || 0,
          usage: flags?.mutationPoints?.usage || 0,
        },
        mutationScore: {
          active: flags?.mutationScore?.active || false,
          value: flags?.mutationScore?.value || 0,
          mod: flags?.mutationScore?.mod || 0,
        },
      } as MutationFeatureFlags;
    }

    await this.ensureFlags(reset);
    return await this.flags(reset, retry + 1);
  }

  async enabled(): Promise<boolean> {
    return (await this.flags()).active;
  }

  async mutationPoints(): Promise<MutationPoints> {
    return (await this.flags()).mutationPoints;
  }

  static async itemIsA(item: Item): Promise<boolean> {
    const flags = await item.getFlag(constants.MODULE_ID, 'mutationFeature');

    return flags != undefined && (flags as MutationFeatureFlags).active;
  }

  static async potentialEvent(event: 'createItem' | 'deleteItem', item: Item) {
    if (item.type !== 'feat') return;
    if (!item.actor) return;
    if (!this.itemIsA(item)) return;

    const mutationFeature = new MutationFeature(item, false);

    switch (event) {
      case 'createItem': {
        await mutationFeature.created();
        break;
      }
      case 'deleteItem': {
        await mutationFeature.deleted();
        break;
      }
    }
  }

  async created() {
    if (await this.enabled()) {
      await this.mutationPoints_onCreated();
    }
  }

  async deleted() {
    if (await this.enabled()) {
      await this.mutationPoints_onDeleted();
    }
  }

  async mutationPoints_onCreated() {
    const mutationPoints = await this.mutationPoints();
    let mutationPointsFeature = this.item.actor?.items.find((item) => item.name === MUTATION_POINTS_FEATURE.name);

    if (!mutationPointsFeature) {
      const created = await this.item.actor?.createEmbeddedDocuments('Item', [
        {
          ...MUTATION_POINTS_FEATURE,
        },
      ]);

      if (created && created[0]) {
        mutationPointsFeature = created[0] as Item;
      }
    }

    if (!mutationPointsFeature) {
      console.error(`${constants.MODULE_ID} | Can't create Feature on Actor: ${this.item.actor?.name}`);
      return;
    }

    await mutationPointsFeature.update({
      system: {
        uses: {
          max: (mutationPointsFeature.system.uses.max || 0) + mutationPoints.value,
        },
      },
    });

    await this.item.update({
      system: {
        consume: {
          type: 'charges',
          target: mutationPointsFeature.id,
          amount: 1,
        },
      },
    });
  }

  async mutationPoints_onDeleted() {
    const mutationPoints = await this.mutationPoints();
    const mutationPointsFeature = this.item.actor?.items.find((item) => item.name === MUTATION_POINTS_FEATURE.name);

    if (!mutationPointsFeature) {
      return;
    }

    const otherItems = await Promise.all(
      this.item.actor?.items.map(async (item) => {
        const isMutation = await MutationFeature.itemIsA(item);

        return { item, isMutation };
      }) as Promise<{ item: Item; isMutation: boolean }>[],
    );
    const otherMutationFeatures = otherItems.filter(({ isMutation }) => isMutation);

    if ((!otherMutationFeatures || otherMutationFeatures.length === 0) && mutationPointsFeature.id) {
      this.item.actor?.deleteEmbeddedDocuments('Item', [mutationPointsFeature.id]);
    } else {
      mutationPointsFeature.update({
        system: {
          uses: {
            max: (mutationPointsFeature.system.uses.max || 0) - mutationPoints.value,
          },
        },
      });
    }
  }

  private async ensureFlags(reset = false) {
    const flags = await this.item.getFlag(constants.MODULE_ID, 'mutationFeature');
    if (reset || flags == undefined) {
      await this.item.setFlag(constants.MODULE_ID, 'mutationFeature', {
        active: false,
        mutationPoints: {
          active: false,
          value: undefined,
          usage: undefined,
        },
        mutationScore: {
          active: false,
          value: undefined,
          mod: undefined,
        },
      });
    }
  }
}
