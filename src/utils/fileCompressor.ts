import imageCompression from 'browser-image-compression';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Use CDN for the worker to avoid Vite build issues with standard pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function compressImage(file: File, maxSizeKB: number = 150): Promise<File> {
  const options = {
    maxSizeMB: maxSizeKB / 1024,
    maxWidthOrHeight: 1600, 
    useWebWorker: true,
  };
  
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Image compression error:', error);
    return file; 
  }
}

export async function compressPdf(file: File, maxSizeKB: number = 150): Promise<File> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4'
    });
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // @ts-ignore - TS types mismatch for canvasContext vs canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Determine quality based on target size (rough estimate)
      // If we have many pages, we need to compress heavily to stay under 150KB
      let quality = 0.6;
      if (numPages > 5) quality = 0.3;
      if (numPages > 10) quality = 0.1;
      
      const imgData = canvas.toDataURL('image/jpeg', quality);
      
      if (i > 1) {
        doc.addPage([viewport.width, viewport.height]);
        doc.setPage(i);
      } else {
        // Set first page dimensions
        doc.deletePage(1); // delete default A4 page
        doc.addPage([viewport.width, viewport.height]);
        doc.setPage(1);
      }
      
      doc.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height);
    }
    
    const pdfBlob = doc.output('blob');
    return new File([pdfBlob], file.name, { type: 'application/pdf' });
  } catch (error) {
    console.error('PDF compression error:', error);
    return file; 
  }
}

export async function compressFile(file: File, maxSizeKB: number = 150): Promise<File> {
  if (file.type.startsWith('image/')) {
    return await compressImage(file, maxSizeKB);
  } else if (file.type === 'application/pdf') {
    return await compressPdf(file, maxSizeKB);
  }
  return file;
}
