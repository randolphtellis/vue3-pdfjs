<div align="center">

[![Build Status](https://travis-ci.com/randolphtellis/vue3-pdfjs.svg?token=hXpsA9tqveCqkXWMHjxp&branch=main)](https://travis-ci.com/randolphtellis/vue3-pdfjs) [![npm bundle size](https://img.shields.io/bundlephobia/minzip/vue3-pdfjs)](https://bundlephobia.com/result?p=vue3-pdfjs@latest) ![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/vue3-pdfjs) ![npm](https://img.shields.io/npm/dt/vue3-pdfjs)

![vue supported version](https://img.shields.io/badge/vue-3.x-brightgreen) [![npm](https://img.shields.io/npm/v/vue3-pdfjs)](https://www.npmjs.com/package/vue3-pdfjs/v/latest) [![NPM](https://img.shields.io/npm/l/vue3-pdfjs)](https://github.com/randolphtellis/vue3-pdfjs/blob/main/LICENSE.md)

#### <a target="_blank" href="https://randolphtellis.github.io/vue3-pdfjs">DEMO</a>

</div>

## Install

```bash
npm i vue3-pdfjs
or
yarn add vue3-pdfjs
```

## Usage

##### Demo code can be found under the docs section <a href="https://randolphtellis.github.io/vue3-pdfjs/?path=/docs/pdf-viewer--default">here</a>.

### Import globally
```ts
import { createApp } from 'vue'
import App from './App.vue'
import VuePdf from 'vue3-pdfjs'

const app = createApp(App)
app.use(VuePdf)
app.mount('#app')
```



### Tree Shaking
#### Import components from the `esm` folder to enable tree shaking.
```ts
<script>
import { defineComponent } from 'vue'
import { VuePdf } from 'vue3-pdfjs/esm'

export default defineComponent({
  components: { VuePdf }
})
</script>
```
