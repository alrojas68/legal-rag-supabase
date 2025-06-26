declare module 'pdf2json' {
  import { EventEmitter } from 'events';

  interface PDFTextRun {
    T: string;
  }

  interface PDFTextItem {
    R: PDFTextRun[];
  }

  interface PDFPage {
    Texts: PDFTextItem[];
  }

  interface PDFData {
    Pages: PDFPage[];
  }

  class PDFParser extends EventEmitter {
    constructor();
    parseBuffer(buffer: Buffer): void;
    on(event: 'pdfParser_dataReady', listener: (pdfData: PDFData) => void): this;
    on(event: 'pdfParser_dataError', listener: (error: any) => void): this;
  }

  export = PDFParser;
} 