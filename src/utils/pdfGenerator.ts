import { jsPDF } from 'jspdf';
import { ColoringBook } from '../data/presets';

// Helper to convert an SVG or image data URL to a raster PNG data URL using an HTML canvas
async function rasterizeToPng(dataUrl: string, width = 1200, height = 1500): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png', 0.95));
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

export async function exportBookToPdf(
  book: ColoringBook,
  onProgress?: (step: number, total: number, message: string) => void
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  const totalPages = book.pages.length;

  for (let i = 0; i < totalPages; i++) {
    const page = book.pages[i];
    if (onProgress) {
      onProgress(i + 1, totalPages, `Preparing Page ${page.pageNumber}: ${page.title}...`);
    }

    if (i > 0) {
      doc.addPage();
    }

    // Determine the source image (user colored layer merged or original outline)
    const activeImageData = page.userDrawingDataUrl || page.imageDataUrl;

    try {
      const pngData = await rasterizeToPng(activeImageData);

      // Add page border & header
      doc.setDrawColor(20, 20, 30);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin, margin, contentWidth, contentHeight, 4, 4);

      // Page Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text(page.title, pageWidth / 2, margin + 10, { align: 'center' });

      // Main Coloring Image area
      const imgY = margin + 15;
      const imgHeight = contentHeight - 40;
      doc.addImage(pngData, 'PNG', margin + 4, imgY, contentWidth - 8, imgHeight, undefined, 'FAST');

      // Footer: Story Caption and Page Number
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);

      if (page.storyCaption) {
        const splitText = doc.splitTextToSize(page.storyCaption, contentWidth - 30);
        doc.text(splitText, pageWidth / 2, pageHeight - margin - 12, { align: 'center' });
      }

      // Page numbering & brand watermark
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`ColorSprout Book • Page ${page.pageNumber} of ${totalPages}`, margin + 6, pageHeight - margin - 4);
      doc.text(`Artist: ${book.childName}`, pageWidth - margin - 6, pageHeight - margin - 4, { align: 'right' });

      // If Cover Page, add extra personalized greeting
      if (page.pageType === 'cover' && book.dedication) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text(book.dedication, pageWidth / 2, pageHeight - margin - 18, {
          align: 'center',
          maxWidth: contentWidth - 20,
        });
      }
    } catch (err) {
      console.error('Failed to add page image to PDF:', err);
    }
  }

  return doc.output('blob');
}
