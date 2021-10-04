import '../css/page.scss'
import { Meta } from '@storybook/vue3'
import VuePdf from '../../components/vue-pdf/vue-pdf.vue'
import { templateSourceCode } from '../utilities/template-source'
import { singleSource } from './source-code'
import { actions } from '@storybook/addon-actions'

export default {
  title: 'Pdf Viewer',
  component: VuePdf,
  argTypes: {
    src: { control: { type: 'text', required: true, default: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf' } },
  },
} as Meta;

export const Default = (args: any, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VuePdf },
  setup() {
    const action = actions('totalPages', 'pdfLoaded', 'textContent', 'pageLoaded')
    return {
      args,
      action
    }
  },
  template: `
  <div style="width:90%;margin:0 auto;">
    <VuePdf v-bind="args" v-on="action" />
  </div>
  `
});

Default.args = {
  src: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf'
};


Default.parameters = {
  docs: { source: { code: templateSourceCode(singleSource, Default.args) } },
};
