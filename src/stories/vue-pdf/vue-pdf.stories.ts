import { ref } from 'vue'
import '../css/page.scss'
import { Meta } from '@storybook/vue3'
import VuePdf from '../../components/vue-pdf/vue-pdf.vue'
import { templateSourceCode } from '../utilities/template-source'
import { singleSource } from './source-code'

export default {
  title: 'Pdf Viewer',
  component: VuePdf,
  argTypes: {
    pdf: { control: { type: 'text', required: true, default: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf' } },
  },
} as Meta;

export const Default = (args: any, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VuePdf },
  setup() {
    return {
      args
    }
  },
  template: `
  <div>
    <VuePdf v-bind="args" />
  </div>
  `
});

Default.args = {
  pdf: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf'
};


Default.parameters = {
  docs: { source: { code: templateSourceCode(singleSource, Default.args) } },
};
