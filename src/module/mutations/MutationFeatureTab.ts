import constants from '../constants';
import { MutationFeature } from './MutationFeature';

const mutationFeatureTabs: {
  [key: string]: MutationFeatureTab;
} = {};

interface AreaVisibilityTrigger {
  module: string;
  area: string;
  parent?: string;
}

const triggerValuesToAreas: AreaVisibilityTrigger[] = [
  {
    module: 'mutation',
    area: '.mutation-config',
  },
  {
    module: 'mutationPoints',
    area: '.mutation-points-config',
    parent: 'mutation',
  },
  {
    module: 'mutationScore',
    area: '.mutation-score-config',
    parent: 'mutation',
  },
];

export interface AppProps {
  id: string;
  _tabs: { activate: (arg0: string) => void }[];
  setPosition: () => void;
}

export class MutationFeatureTab {
  app: AppProps;
  activate: boolean;
  html: JQuery<HTMLElement>;
  editable: boolean;
  mutationFeature: MutationFeature;

  static async bind(app: AppProps, html: JQuery, item: Item, editable: boolean) {
    if (item.type === 'feat') {
      let tab = mutationFeatureTabs[app.id];
      if (!tab) {
        tab = new MutationFeatureTab(app, html, item, editable);
        mutationFeatureTabs[app.id] = tab;
      }

      await tab.init(html, item, editable);
    }
  }

  constructor(app: AppProps, html: JQuery, item: Item, editable: boolean) {
    this.app = app;
    this.html = html;

    this.editable = editable;
    this.mutationFeature = new MutationFeature(item, !this.editable);

    this.activate = false;
  }

  async init(html: JQuery, item: Item, editable: boolean) {
    this.editable = editable;
    this.mutationFeature = new MutationFeature(item, !this.editable);

    if (html[0].localName !== 'div') {
      html = $(html[0]).parent().parent();
    }
    this.html = html;

    const tabs = html.find(`form nav.sheet-navigation.tabs`);
    if (tabs.find('a[data-tab=mutationfeature]').length > 0) {
      return; // already initialized, duplication bug!
    }

    tabs.append($('<a class="item" data-tab="mutationfeature">Mutation</a>'));

    $(html.find(`.sheet-body`)).append(
      $('<div class="tab mutation-feature" data-group="primary" data-tab="mutationfeature"></div>'),
    );

    await this.render();
  }

  async render() {
    const flags = await this.mutationFeature.flags(this.editable);
    const enabled = flags?.active || false;

    await this.renderProperties();

    const template = await renderTemplate(`modules/${constants.MODULE_ID}/templates/mutation-feature-tab.hbs`, {
      flags,
      constants,
    });

    let el = this.html.find(`#mutation-feature-content`);
    if (el.length === 1) {
      el.replaceWith(template);
    } else {
      this.html.find('.tab.mutation-feature').append(template);
    }
    el = this.html.find(`#mutation-feature-content`);

    if (this.activate) {
      this.app._tabs[0].activate('mutationfeature');
      this.activate = false;
    }

    if (!enabled || !this.editable) {
      this.html.find('#mutation-feature-content input').prop('disabled', true);
      this.html.find('#mutation-feature-content select').prop('disabled', true);
    }

    if (!enabled && this.editable) {
      this.html
        .find(`#mutation-feature-content input[name="flags.${constants.MODULE_ID}.mutationFeature.active"]`)
        .prop('disabled', false);

      await this.mutationFeature.flags(true);
    }

    const activeModules = await this.mutationFeature.activeModules();
    triggerValuesToAreas.forEach((triggerArea) => {
      if (
        activeModules.includes(triggerArea.module) &&
        ((triggerArea.parent && activeModules.includes(triggerArea.parent)) || !triggerArea.parent)
      ) {
        this.html.find(triggerArea.area).show();
      } else {
        this.html.find(triggerArea.area).hide();
      }
    });

    this.app.setPosition();

    el.find('input[type=text]').on('change', () => {
      this.activate = true;
    });
    el.find('input[type=number]').on('change', () => {
      this.activate = true;
    });
    el.find('input[type=checkbox]').on('change', () => {
      this.activate = true;
    });
    el.find('select').on('change', () => {
      this.activate = true;
    });
  }

  async renderProperties() {
    const html = this.html;
    const propertiesList = html.find('.item-properties .properties-list');

    const props = await this.mutationFeature.properties();
    propertiesList.prepend(props.map((prop) => $(`<li>${prop}</li>`)));
  }

  isActive() {
    return $(this.html).find('a.item[data-tab="mutationfeature"]').hasClass('active');
  }
}
