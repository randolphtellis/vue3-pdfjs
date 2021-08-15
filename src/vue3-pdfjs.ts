import { App as Application, Plugin } from 'vue';
import * as components from './components';

const install: Exclude<Plugin['install'], undefined> = (app: Application) => {
  Object.entries(components).forEach(([componentName, component]) => {
    app.component(componentName, component);
  });
};

export default install;

export * from './components';
