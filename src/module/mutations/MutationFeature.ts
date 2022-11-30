import constants from '../constants';
import { MutationPoints, mutationPoints_onCreated, mutationPoints_onDeleted } from './MutationPoints';
import { MutationScore, mutationScore_onCreated } from './MutationScore';

export interface MutationFeatureFlags {
  active: boolean;
  mutationPoints: MutationPoints;
  mutationScore: MutationScore;
}

interface MutationFeatureItem {
  flags?: {
    [key: string]: unknown | undefined;
    dnd5egoespostapocalypse?: {
      mutationFeature?: MutationFeatureFlags;
    };
  };
  getChatData: (...arg0: []) => Promise<{ properties: string[] } & unknown>;
}

export class MutationFeature {
  item: Item & MutationFeatureItem;
  readonly: boolean;

  constructor(item: Item, readonly: boolean) {
    this.item = item as Item & MutationFeatureItem;
    this.readonly = readonly;

    this.hackMethods();
  }

  hackMethods() {
    const getChatData = this.item.getChatData;

    this.item.getChatData = async (...args: []) => {
      const flags = await this.flags();
      const { properties, ...parentData } = await getChatData.call(this.item, ...args);

      if (!flags.active) {
        return { properties, ...parentData };
      }
      const mutationProperties = await this.properties();
      mutationProperties.forEach((property) => {
        if (!properties.includes(property)) {
          properties.push(property);
        }
      });
      return { properties, ...parentData };
    };
  }

  async activeModules(): Promise<string[]> {
    const flags = await this.flags();

    return [
      { module: 'mutation', isActive: flags.active },
      { module: 'mutationPoints', isActive: flags.mutationPoints.active },
      { module: 'mutationScore', isActive: flags.mutationScore.active },
    ]
      .filter(({ isActive }) => isActive)
      .map(({ module }) => module);
  }

  async properties(): Promise<string[]> {
    const flags = await this.flags();
    if (!flags.active) {
      return [];
    }

    const properties: string[] = [];
    properties.push('Mutation');

    if (flags.mutationPoints.active) {
      if (flags.mutationPoints.value > 0) {
        properties.push(`${flags.mutationPoints.value} Mutation Points`);
      }
      if (flags.mutationPoints.usage > 0) {
        properties.push(`${flags.mutationPoints.usage} Muation Points / Usage`);
      }
    }

    if (flags.mutationScore.active) {
      if (flags.mutationScore.value > 0) {
        properties.push(`Mutation Score ${flags.mutationScore.value} (${flags.mutationScore.mod})`);
      } else {
        properties.push(`Mutation Score`);
      }
    }

    return properties;
  }

  async flags(reset = false, retry = 0): Promise<MutationFeatureFlags> {
    if (retry >= 3) {
      throw new Error("Can't seem to load / prepare flags!");
    }

    const flags = await this.item.getFlag(constants.MODULE_ID, constants.FLAGS.MUTATION_FEATURE);

    if (flags != undefined && (flags as MutationFeatureFlags)) {
      return flags as MutationFeatureFlags;
    }

    if (this.readonly) {
      return this.readonlyFlags();
    }

    await this.ensureFlags(reset);
    return await this.flags(reset, retry + 1);
  }

  static async itemIsA(item: Item): Promise<boolean> {
    let flags = undefined;

    try {
      if (item.getFlag) {
        flags = await item.getFlag(constants.MODULE_ID, 'mutationFeature');
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        flags = item.flags?.dnd5egoespostapocalypse?.mutationFeature;
      }
    } catch (e) {
    } finally {
      return flags != undefined && (flags as MutationFeatureFlags).active;
    }
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
    await mutationPoints_onCreated(this);
    await mutationScore_onCreated(this);
  }

  async deleted() {
    await mutationPoints_onDeleted(this);
  }

  /* eslint-disable @typescript-eslint/ban-ts-comment */
  private readonlyFlags() {
    const flags = this.item.flags?.dnd5egoespostapocalypse?.mutationFeature || {};

    return {
      // @ts-ignore
      active: flags?.activate || false,
      mutationPoints: {
        // @ts-ignore
        active: flags?.mutationPoints?.active || false,
        // @ts-ignore
        value: flags?.mutationPoints?.value || 0,
        // @ts-ignore
        usage: flags?.mutationPoints?.usage || 0,
      },
      mutationScore: {
        // @ts-ignore
        active: flags?.mutationScore?.active || false,
        // @ts-ignore
        value: flags?.mutationScore?.value || 0,
        // @ts-ignore
        mod: flags?.mutationScore?.mod || 0,
      },
    } as MutationFeatureFlags;
  }
  /* eslint-enable @typescript-eslint/ban-ts-comment */

  private async ensureFlags(reset = false) {
    const flags = await this.item.getFlag(constants.MODULE_ID, constants.FLAGS.MUTATION_FEATURE);
    if (reset || flags == undefined) {
      await this.item.setFlag(constants.MODULE_ID, constants.FLAGS.MUTATION_FEATURE, {
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
