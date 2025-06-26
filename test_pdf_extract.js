const fs = require('fs');
const PDFParser = require('pdf2json');

const filePath = 'documents/codigo-civil-para-el-distrito-federal.pdf';

const pdfParser = new PDFParser();

pdfParser.on('pdfParser_dataError', errData => {
  console.error('Error:', errData.parserError);
});

pdfParser.on('pdfParser_dataReady', pdfData => {
  const text = pdfParser.getRawTextContent();
  console.log('=== TEXTO EXTRAÍDO DEL PDF ===');
  console.log(text.slice(0, 5000)); // Muestra los primeros 5000 caracteres
  console.log('\n¿Incluye "artículo 72"?', text.toLowerCase().includes('artículo 72'));
});

fs.readFile(filePath, (err, buffer) => {
  if (err) throw err;
  pdfParser.parseBuffer(buffer);
}); 