import { Parameters } from '@storybook/vue3';
import { themes } from '@storybook/theming';

// This adds a component that can be used globally in stories
// app.component('GlobalButton', Button);

export const parameters: Parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: { expanded: true },
  previewTabs: {
    docs: {
      hidden: false,
      theme: themes.dark,
    }
  },
};
