import constants from '../constants';
import { MutationFeature } from './MutationFeature';

export interface MutationScore {
  active: boolean;
  value: number;
  mod: number;
}

export const mutationScore_onCreated = async (mutation: MutationFeature) => {
  if (!mutation.item.actor) {
    return;
  }
  const flags = await mutation.flags();
  if (!flags.active) {
    return;
  }
  const mutationScore = flags.mutationScore;
  if (!mutationScore.active) {
    return;
  }

  manualOrAutoDialog({ actor: mutation.item.actor, mutation: mutation.item });
};

const setupFinished = async ({ mutation }: { actor: Actor; mutation: Item }) => {
  ui.notifications?.info(`Mutation Score Setup complete for ${mutation.name}`);
};

const updateItem = async (mutation: Item, score: number, mod: number) => {
  await mutation.setFlag(constants.MODULE_ID, constants.FLAGS.MUTATION_FEATURE, {
    mutationScore: {
      value: score,
      mod,
    },
  });
};

const calculateModifier = (score: number) => {
  return Math.floor((score - 10) / 2);
};

const automaticSetup = async ({ actor, mutation }: { actor: Actor; mutation: Item }, retry = 0) => {
  if (retry > 3) {
    console.error(`${constants.MODULE_ID} | Roll returns undefined`);
    return;
  }

  const scoreRoll = new Roll(`1d20`);
  scoreRoll.evaluate({ async: false });
  scoreRoll.toMessage();

  const score = scoreRoll.total;
  if (score) {
    const mod = calculateModifier(score);
    await updateItem(mutation, score, mod);
    await setupFinished({ actor, mutation });
  } else {
    await automaticSetup({ actor, mutation }, retry + 1);
  }
};

const manualSetModifier = async (html: JQuery, { actor, mutation }: { actor: Actor; mutation: Item }) => {
  const score = Number(html.find('input#role').val());
  if (score && score > 0 && score <= 20) {
    const mod = calculateModifier(score);

    await updateItem(mutation, score, mod);
    await setupFinished({ actor, mutation });
  } else {
    await manualDialog({ actor, mutation }, false);
  }
};

const manualDialog = async ({ actor, mutation }: { actor: Actor; mutation: Item }, firstTime = true) => {
  const firstTimeMessage = `
    <h4>Please enter a valid number between 1 and 20</h4>
  `;
  const content = `
  <h3>You picked to do it manually.</h3>
  ${!firstTime ? firstTimeMessage : ''}
  <p>Roll a D20 now and enter your result below.</p>
  <hr>
  <input id="role" type="number" min="0" max="20"/>
  <hr>
  `;

  const html = await new Promise<JQuery>((res) => {
    new Dialog({
      title: 'Mutation with Mutation Score',
      content: content,
      buttons: {
        didThat: {
          label: 'I did that',
          callback: (html) => {
            res($(html));
          },
          icon: `<i class="fas fa-check"></i>`,
        },
      },
      default: 'didThat',
    }).render(true);
  });

  await manualSetModifier(html, { actor, mutation });
};

const manualOrAutoDialog = async ({ actor, mutation }: { actor: Actor; mutation: Item }) => {
  const content = `
    <p>The Mutation you just added needs a Mutations Score</p>
    <p>You can either manually role and add the Mutation Score or it can be done automatically</p>
    <hr>
  `;

  const choice = await new Promise<'manual' | 'auto'>((res) => {
    new Dialog({
      title: 'Mutation with Mutation Score',
      content: content,
      buttons: {
        manual: {
          label: 'Manual',
          callback: () => {
            res('manual');
          },
          icon: `<i class="fas fa-wrench"></i>`,
        },
        auto: {
          label: 'Automatically',
          callback: () => {
            res('auto');
          },
          icon: `<i class="fas fa-robot"></i>`,
        },
      },
      default: 'auto',
    }).render(true);
  });

  switch (choice) {
    case 'manual':
      await manualDialog({ actor, mutation });
      break;

    default:
      await automaticSetup({ actor, mutation });
      break;
  }
};
