// File processing utilities for PDF and DOCX files
// In a production environment, this would include:
// - PDF.js for PDF text extraction
// - Mammoth.js for DOCX processing
// - Metadata extraction
// - Content parsing and formatting

export interface ProcessedDocument {
  title: string;
  authors: string;
  content: string;
  metadata: {
    pageCount: number;
    journal?: string;
    year?: number;
    doi?: string;
  };
}

export async function processPDF(file: File): Promise<ProcessedDocument> {
  // In a real implementation, this would use PDF.js
  // For now, return basic metadata extracted from filename
  const title = file.name.replace(/\.pdf$/i, '');
  
  return {
    title,
    authors: "Unknown",
    content: "PDF content would be extracted here using PDF.js",
    metadata: {
      pageCount: 1,
    }
  };
}

export async function processDOCX(file: File): Promise<ProcessedDocument> {
  // In a real implementation, this would use Mammoth.js
  // For now, return basic metadata extracted from filename
  const title = file.name.replace(/\.docx$/i, '');
  
  return {
    title,
    authors: "Unknown", 
    content: "DOCX content would be extracted here using Mammoth.js",
    metadata: {
      pageCount: 1,
    }
  };
}

export async function processDocument(file: File): Promise<ProcessedDocument> {
  const fileType = file.type;
  
  if (fileType === "application/pdf") {
    return processPDF(file);
  } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return processDOCX(file);
  } else {
    throw new Error("Unsupported file type");
  }
}

export function extractMetadataFromText(content: string): Partial<ProcessedDocument['metadata']> {
  // Simple regex patterns to extract common academic paper metadata
  const patterns = {
    doi: /DOI:\s*([^\s]+)/i,
    year: /(?:19|20)\d{2}/g,
    // Add more patterns as needed
  };
  
  const metadata: Partial<ProcessedDocument['metadata']> = {};
  
  const doiMatch = content.match(patterns.doi);
  if (doiMatch) {
    metadata.doi = doiMatch[1];
  }
  
  const yearMatches = content.match(patterns.year);
  if (yearMatches) {
    // Get the most recent year that's not in the future
    const currentYear = new Date().getFullYear();
    const validYears = yearMatches
      .map(y => parseInt(y))
      .filter(y => y <= currentYear)
      .sort((a, b) => b - a);
    
    if (validYears.length > 0) {
      metadata.year = validYears[0];
    }
  }
  
  return metadata;
}
