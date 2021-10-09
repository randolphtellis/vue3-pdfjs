import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'
import PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import { DocumentInitParameters, PDFDataRangeTransport, PDFDocumentLoadingTask } from 'pdfjs-dist/types/src/display/api';

export const createLoadingTask = (src: string | URL | Uint8Array | PDFDataRangeTransport | DocumentInitParameters): PDFDocumentLoadingTask => {
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker
  const loadingTask = pdfjsLib.getDocument(src)
  return loadingTask
}