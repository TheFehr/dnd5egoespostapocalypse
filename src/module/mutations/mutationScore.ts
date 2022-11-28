const setupFinished = ({ actor, mutation }: { actor: Actor; mutation: Item }) => {
  ui.notifications?.info(`Mutation Score Setup complete for ${mutation.name}`);

  const effect = [...actor.effects].find((eff: ActiveEffect) => eff.disabled && eff.label === mutation.name);
  if (effect) {
    actor.updateEmbeddedDocuments('ActiveEffect', [{ _id: effect.id, disabled: false }]);
  }
  // Enable effect on Actor if one exists with equal name of Mutation -> further mutation specific setups.
};

const updateDescription = (mutation: Item, score: number, mod: number) => {
  let newDescription = mutation.system.description.value;
  newDescription = newDescription.replace(
    /Mutation Score = (score|\d+) ?\| ?modifier/,
    `Mutation Score = ${score} | ${mod}`,
  );

  mutation.update({ system: { description: { value: newDescription } } });
};

const calculateModifier = (score: number) => {
  return Math.floor((score - 10) / 2);
};

const automaticSetup = ({ actor, mutation }: { actor: Actor; mutation: Item }) => {
  const scoreRoll = new Roll(`1d20`);
  scoreRoll.evaluate({ async: false });
  scoreRoll.toMessage();

  const score = scoreRoll.total;
  const mod = calculateModifier(score!);
  updateDescription(mutation, score!, mod);
  setupFinished({ actor, mutation });
};

const manualSetModifier = (html: any, { actor, mutation }: { actor: Actor; mutation: Item }) => {
  const score = html.find('input#role').val();
  if (score && score > 0 && score <= 20) {
    const mod = calculateModifier(parseInt(score));

    updateDescription(mutation, score, mod);
    setupFinished({ actor, mutation });
  } else {
    manualDialog({ actor, mutation }, false);
  }
};

const manualDialog = ({ actor, mutation }: { actor: Actor; mutation: Item }, firstTime = true) => {
  const content = `
  <h3>You picked to do it manually.</h3>
  <p>Roll a D20 now and enter your result below.</p>
  <hr>
  <input id="role" type="number" min="0" max="20"/>
  <hr>
  `;

  new Dialog({
    title: 'Mutation with Mutation Score',
    content: content,
    buttons: {
      didThat: {
        label: 'I did that',
        callback: (html) => {
          manualSetModifier(html, { actor, mutation });
        },
        icon: `<i class="fas fa-check"></i>`,
      },
    },
    default: 'didThat',
  }).render(true);
};

const manualOrAutoDialog = ({ actor, mutation }: { actor: Actor; mutation: Item }) => {
  const content = `
    <p>The Mutation you just added needs a Mutations Score</p>
    <p>You can either manually role and add the Mutation Score or it can be done automatically</p>
    <hr>
  `;

  new Dialog({
    title: 'Mutation with Mutation Score',
    content: content,
    buttons: {
      manual: {
        label: 'Manual',
        callback: () => {
          manualDialog({ actor, mutation });
        },
        icon: `<i class="fas fa-wrench"></i>`,
      },
      auto: {
        label: 'Automatically',
        callback: () => {
          automaticSetup({ actor, mutation });
        },
        icon: `<i class="fas fa-robot"></i>`,
      },
    },
    default: 'auto',
  }).render(true);
};

export default manualOrAutoDialog;
