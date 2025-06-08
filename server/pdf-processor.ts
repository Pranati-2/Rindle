import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createCanvas } from 'canvas';

interface ProcessedPDFData {
  title: string;
  authors: string;
  // content field is now a JSONB array of objects, e.g. [{type: 'image', value: 'base64_string'}]
  content: Array<{ type: string; value: string }>;
  totalPages: number;
  thumbnail: string;
  metadata: {
    journal?: string;
    year?: number;
    doi?: string;
    // Add other relevant metadata fields if needed
    rawInfo?: any; // To store the raw PDF metadata info
  };
}

// Helper function to convert stream to buffer (if needed, pdfjsLib.getDocument also accepts Uint8Array)
// For this implementation, we assume `buffer` is already a Buffer or Uint8Array

export async function processPDF(buffer: Buffer, originalFilename?: string): Promise<ProcessedPDFData> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;

    let title = originalFilename?.replace(/\.pdf$/i, '') || 'Untitled';
    let authors = 'Unknown';
    let rawInfo: any = null;
    let journal: string | undefined;
    let year: number | undefined;
    let doi: string | undefined;

    try {
      const metadata = await pdf.getMetadata();
      rawInfo = metadata.info;
      if (rawInfo?.Title) {
        title = rawInfo.Title;
      }
      if (rawInfo?.Author) {
        authors = rawInfo.Author;
      }
      // You can extract more metadata if available, e.g. Subject for journal, Keywords for tags
      // For year, it might be in CreationDate or ModDate, need parsing:
      // e.g. rawInfo.CreationDate (D:20230315...) -> 2023
      if (rawInfo?.CreationDate && typeof rawInfo.CreationDate === 'string' && rawInfo.CreationDate.startsWith('D:')) {
        const yearStr = rawInfo.CreationDate.substring(2, 6);
        const parsedYear = parseInt(yearStr, 10);
        if (!isNaN(parsedYear)) {
          year = parsedYear;
        }
      }
      // DOI is not a standard PDF metadata field, might need to search in text or leave for manual input

    } catch (metaError) {
      console.warn('Could not parse PDF metadata:', metaError);
    }

    // 1. Thumbnail Generation (first page, small scale)
    const firstPage = await pdf.getPage(1);
    const thumbViewport = firstPage.getViewport({ scale: 0.2 }); // Scale down for thumbnail
    const thumbCanvas = createCanvas(thumbViewport.width, thumbViewport.height);
    const thumbContext = thumbCanvas.getContext('2d');
    await firstPage.render({ canvasContext: thumbContext, viewport: thumbViewport }).promise;
    const thumbnail = thumbCanvas.toDataURL('image/png');

    // 2. Content Extraction (render each page as an image)
    const structuredContent: Array<{ type: string; value: string }> = [];
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      // Render page at a reasonable scale for viewing, e.g., width 800px
      // Adjust scale to fit a target width, e.g., 800px
      const desiredWidth = 800;
      const viewport = page.getViewport({ scale: 1 });
      const scale = desiredWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const pageCanvas = createCanvas(scaledViewport.width, scaledViewport.height);
      const pageContext = pageCanvas.getContext('2d');

      await page.render({ canvasContext: pageContext, viewport: scaledViewport }).promise;
      const pageImageBase64 = pageCanvas.toDataURL('image/png');
      structuredContent.push({ type: 'image', value: pageImageBase64 });
    }

    return {
      title,
      authors,
      content: structuredContent,
      totalPages,
      thumbnail,
      metadata: {
        journal,
        year,
        doi,
        rawInfo, // Store raw metadata for potential future use or display
      },
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    // Check if the error is from pdfjs-dist and provide more specific feedback
    if (error.name === 'InvalidPDFException' || error.name === 'MissingPDFException' || error.name === 'UnexpectedResponseException') {
        throw new Error(`Failed to process PDF: ${error.message}`);
    }
    throw new Error('Failed to process PDF file due to an unexpected error.');
  }
}