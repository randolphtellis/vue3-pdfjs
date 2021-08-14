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
    name: { control: { type: 'text', required: true, default: 'Default name' } },
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
  name: 'Default name'
};


Default.parameters = {
  docs: { source: { code: templateSourceCode(singleSource, Default.args) } },
};
