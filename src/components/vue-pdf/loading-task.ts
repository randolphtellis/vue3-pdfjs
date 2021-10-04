import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'
import PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import * as pdfjsApi from 'pdfjs-dist/types/display/api'

export const createLoadingTask = (src: string | URL | pdfjsApi.TypedArray | pdfjsApi.PDFDataRangeTransport | pdfjsApi.DocumentInitParameters): pdfjsApi.PDFDocumentLoadingTask => {
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker
  const loadingTask = pdfjsLib.getDocument(src)
  return loadingTask
}