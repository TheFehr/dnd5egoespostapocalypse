const checkCanDoUpdate = ({ actor, effect, mutation }: { actor: Actor; effect: ActiveEffect; mutation: Item }) => {
  const mutationResource = Object.entries(actor.system.resources).find(
    (res: [string, any]) => res[1].label.toLowerCase() === 'mutation points',
  );
  const amount = mutation.system.description.value.match(/Mutation Points = (\d+)/);

  if (mutationResource) {
    if (amount && amount.length === 2) {
      doUpdateResource(effect, mutationResource, amount[1]);
    }
    doUpdateResourceConsumption({ mutation, mutationResource });
  } else {
    tellUserToNameResource({ actor, effect, mutation });
  }
};

const doUpdateResource = (effect: ActiveEffect, mutationResource: [string, any], amount: string) => {
  effect.update({
    changes: [{ key: `system.resources.${mutationResource[0]}.max`, mode: 2, priority: 20, value: amount }],
  });
};

const doUpdateResourceConsumption = ({ mutation, mutationResource }: { mutation: Item; mutationResource: any }) => {
  mutation.update({ system: { consume: { target: `resources.${mutationResource[0]}.value` } } });
};

const tellUserToNameResource = ({
  actor,
  effect,
  mutation,
}: {
  actor: Actor;
  effect: ActiveEffect;
  mutation: Item;
}) => {
  const content = `
      <p>The Mutation you just added interacts with Mutation Points</p>
      <p>But you currently don't have a Actor Resource named 'Mutation Points'</p>
      <p>Please name one of your Actor Resources (Attributes Tab) 'Mutation Points</p>
      `;

  new Dialog({
    title: 'Mutation with Mutation Points',
    content: content,
    buttons: {
      didThat: {
        label: 'I did that',
        callback: () => {
          checkCanDoUpdate({ actor, effect, mutation });
        },
        icon: `<i class="fas fa-check"></i>`,
      },
    },
    close: () => {
      checkCanDoUpdate({ actor, effect, mutation });
    },
    default: 'didThat',
  }).render(true);
};

export default checkCanDoUpdate;
