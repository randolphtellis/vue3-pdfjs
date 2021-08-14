import { App as Application } from 'vue';
import * as components from './components';

const install = (app: Application) => {
  Object.entries(components).forEach(([componentName, component]) => {
    app.component(componentName, component);
  });
};

export default install;

export * from './components';
