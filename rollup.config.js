import fs from "fs";
import path from "path";
import vue from "rollup-plugin-vue";
import pkg from "./package.json";
import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import filesize from 'rollup-plugin-filesize';
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import babel from "@rollup/plugin-babel";
import sass from 'node-sass'
import postCss from "rollup-plugin-postcss"
import autoprefixer from 'autoprefixer'
import url from "@rollup/plugin-url"
import { terser } from "rollup-plugin-terser"
import typescript from 'rollup-plugin-typescript2'

const projectRoot = path.resolve(__dirname, ".")

const validPkgName = 'Vue3PDF'

const libBuildFolder = 'dist/lib'

// Get browserslist config and remove ie from es build targets
const esbrowserslist = fs.readFileSync('./.browserslistrc')
  .toString()
  .split('\n')
  .filter((entry) => entry && entry.substring(0, 2) !== 'ie');

let postVueConfig = [
  // Process only `<style module>` blocks.
  postCss({
    modules: {
      generateScopedName: '[local]___[hash:base64:5]',
    },
    include: /&module=.*\.css$/,
    preprocessor: (content, id) => new Promise((resolve, reject) => {
      const result = sass.renderSync({ file: id })
      resolve({ code: result.css.toString() })
    }),
    plugins: [
      autoprefixer
    ],
    extract: true,
    extensions: ['.scss', '.css', '.sass']
  }),
  // Process all `<style>` blocks except `<style module>`.
  postCss({
    include: /(?<!&module=.*)\.css$/,
    preprocessor: (content, id) => new Promise((resolve, reject) => {
      const result = sass.renderSync({ file: id })
      resolve({ code: result.css.toString() })
    }),
    plugins: [
      autoprefixer
    ],
    minimize: true,
    extract: false,
    extensions: ['.scss', '.css', '.sass']
  }),
  url({
      include: [
        '**/*.svg',
        '**/*.png',
        '**/*.gif',
        '**/*.jpg',
        '**/*.jpeg'
      ]
    }),
]

const baseConfig = {
  plugins: {
    preVue: [
      alias({
        entries: [
          {
            find: '@',
            replacement: `${path.resolve(projectRoot, 'src')}`
          }
        ],
        customResolver: resolve({
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue']
        })
      })
    ],
    replace: {
      "process.env.NODE_ENV": JSON.stringify('production'),
      __VUE_OPTIONS_API__: JSON.stringify(true),
      __VUE_PROD_DEVTOOLS__: JSON.stringify(false)
    },
    vue: {
      preprocessStyles: true,
      css: false,
      style: {
        postcssPlugins: [autoprefixer]
      }
    },
    postVue: [
      ...postVueConfig
    ],
    babel: {
      exclude: 'node_modules/**',
      extensions: ['.js', '.jsx', '.vue', '.ts', '.tsx'],
      babelHelpers: 'runtime'
    }
  }
}

// ESM/UMD/IIFE shared settings: externals
// Refer to https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency
const external = [
  // list external dependencies, exactly the way it is written in the import statement.
  // eg. 'jquery'
  'vue',
  'pdfjs-dist/legacy/build/pdf.js',
  'pdfjs-dist/legacy/build/pdf.worker.entry',
  'pdfjs-dist/legacy/web/pdf_viewer',
  'pdfjs-dist/types/src/display/api',
  'pdfjs-dist/legacy/web/pdf_viewer.css'
]

// UMD/IIFE shared settings: output.globals
// Refer to https://rollupjs.org/guide/en#output-globals for details
const globals = {
  // Provide global variable names to replace your external imports
  // eg. jquery: '$'
  vue: 'Vue',
  'pdfjs-dist/legacy/build/pdf.js': 'pdfjsLib',
  'pdfjs-dist/legacy/build/pdf.worker.entry': 'PDFJSWorker',
  'pdfjs-dist/legacy/web/pdf_viewer': 'pdfjsViewer'
}

const baseFolder = './src/'
const componentsFolder = 'components/'

const components = fs
  .readdirSync(baseFolder + componentsFolder)
  .filter(f =>
    fs.statSync(path.join(baseFolder + componentsFolder, f)).isDirectory()
  )

const entriespath = {
  index: './src/vue3-pdfjs.ts',
  ...components.reduce((obj, name) => {
    obj[name] = baseFolder + componentsFolder + name + '/index.ts'
    return obj
  }, {})
}

// Customize configs for individual targets
let buildFormats = []

const esConfig = {
  input: entriespath,
  external: external,
  output: {
    format: 'esm',
    dir: `${libBuildFolder}/esm`, 
    exports: 'named'
  },
  treeshake: false,
  plugins: [
    resolve(),
    typescript(),
    replace({ preventAssignment: false, ...baseConfig.plugins.replace }),
    ...baseConfig.plugins.preVue,
    vue(baseConfig.plugins.vue),
    ...baseConfig.plugins.postVue,
    babel({
      ...baseConfig.plugins.babel,
      presets: [['@babel/preset-env', { targets: esbrowserslist }]]
    }),
    commonjs(),
    filesize()
  ]
}

const merged = {
  input: 'src/vue3-pdfjs.ts',
  external: external,
  output: {
    format: 'esm',
    file: `${libBuildFolder}/${pkg.name}.esm.js`,
    exports: 'named'
  },
  treeshake: false,
  plugins: [
    resolve(),
    typescript({
      tsconfig: path.join(process.cwd(), 'tsconfig.lib.types.json'),
    }),
    replace({
      preventAssignment: false,
      ...baseConfig.plugins.replace,
      'process.env.ES_BUILD': JSON.stringify('true'),
    }),
    ...baseConfig.plugins.preVue,
    vue(baseConfig.plugins.vue),
    ...baseConfig.plugins.postVue,
    babel({
      ...baseConfig.plugins.babel,
      presets: [['@babel/preset-env', { targets: esbrowserslist }]]
    }),
    commonjs(),
    filesize()
  ]
}

buildFormats.push(esConfig)
buildFormats.push(merged)

const unpkgConfig = {
  ...baseConfig,
  input: 'src/vue3-pdfjs.cjs-iife.ts',
  external: external,
  output: {
    compact: true,
    file: `${libBuildFolder}/${pkg.name}-browser.min.js`,
    format: 'iife',
    name: validPkgName,
    exports: 'auto',
    globals
  },
  treeshake: false,
  plugins: [
    resolve(),
    typescript(),
    replace({ preventAssignment: false, ...baseConfig.plugins.replace }),
    ...baseConfig.plugins.preVue,
    vue(baseConfig.plugins.vue),
    ...baseConfig.plugins.postVue,
    babel(baseConfig.plugins.babel),
    commonjs(),
    terser({
      output: {
        ecma: 5
      }
    }),
    filesize()
  ]
}
buildFormats.push(unpkgConfig)

const cjsConfig = {
  ...baseConfig,
  input: 'src/vue3-pdfjs.ts',
  external: external,
  output: {
    compact: true,
    format: 'cjs',
    file: `${libBuildFolder}/cjs/index.js`,
    name: validPkgName,
    exports: 'named',
    globals
  },
  treeshake: false,
  plugins: [
    resolve(),
    typescript(),
    replace({ preventAssignment: false, ...baseConfig.plugins.replace }),
    ...baseConfig.plugins.preVue,
    vue(baseConfig.plugins.vue),
    ...baseConfig.plugins.postVue,
    babel(baseConfig.plugins.babel),
    commonjs(),
    filesize()
  ]
}
buildFormats.push(cjsConfig)

// Export config
export default buildFormats;
