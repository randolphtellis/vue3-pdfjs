declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'pdfjs-dist/legacy/build/pdf.worker.entry';
declare module 'pdfjs-dist/legacy/web/pdf_viewer';
