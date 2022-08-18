import { DocumentInitParameters, PDFDataRangeTransport } from 'pdfjs-dist/types/src/display/api';

export interface VuePdfPropsType {
  src: string | URL | Uint8Array | PDFDataRangeTransport | DocumentInitParameters;
  page?: number;
  scale?: number;
  enableTextSelection?: boolean;
  enableAnnotations?: boolean;
  wrapperIdPrefix?: string;
}
