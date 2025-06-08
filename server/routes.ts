import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPaperSchema, updatePaperSchema, insertNoteSchema, insertHighlightSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";
import { processPDF } from "./pdf-processor";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all papers
  app.get("/api/papers", async (req, res) => {
    try {
      const papers = await storage.getPapers();
      res.json(papers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch papers" });
    }
  });

  // Get single paper
  app.get("/api/papers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid paper ID" });
      }

      const paper = await storage.getPaper(id);
      if (!paper) {
        return res.status(404).json({ message: "Paper not found" });
      }

      res.json(paper);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch paper" });
    }
  });

  // Upload and create paper
  app.post("/api/papers/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { originalname, buffer, mimetype } = req.file;
      
      // Validate file type
      if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(mimetype)) {
        return res.status(400).json({ message: "Only PDF and DOCX files are supported" });
      }

      let paperData;
      
      if (mimetype === "application/pdf") {
        // Process PDF file
        const pdfData = await processPDF(buffer);
        paperData = {
          title: pdfData.title,
          authors: pdfData.authors,
          filename: originalname,
          content: pdfData.content,
          thumbnail: pdfData.thumbnail,
          totalPages: pdfData.totalPages,
          journal: pdfData.metadata.journal || null,
          year: pdfData.metadata.year || null,
          doi: pdfData.metadata.doi || null,
          progress: 0,
          currentPage: 1,
          tags: [],
          notes: [],
          highlights: []
        };
      } else {
        // For DOCX files, use basic processing for now
        const title = originalname.replace(/\.(pdf|docx)$/i, '');
        paperData = {
          title,
          authors: "Unknown",
          filename: originalname,
          content: "DOCX content extraction not implemented yet",
          thumbnail: null,
          totalPages: 1,
          journal: null,
          year: null,
          doi: null,
          progress: 0,
          currentPage: 1,
          tags: [],
          notes: [],
          highlights: []
        };
      }

      const validatedData = insertPaperSchema.parse(paperData);
      const paper = await storage.createPaper(validatedData);
      
      res.status(201).json(paper);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid paper data", errors: error.errors });
      }
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload paper" });
    }
  });

  // Update paper
  app.patch("/api/papers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid paper ID" });
      }

      const validatedData = updatePaperSchema.parse(req.body);
      const paper = await storage.updatePaper(id, validatedData);
      
      if (!paper) {
        return res.status(404).json({ message: "Paper not found" });
      }

      res.json(paper);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid paper data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update paper" });
    }
  });

  // Delete paper
  app.delete("/api/papers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid paper ID" });
      }

      const deleted = await storage.deletePaper(id);
      if (!deleted) {
        return res.status(404).json({ message: "Paper not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete paper" });
    }
  });

  // Get notes for a paper
  app.get("/api/papers/:id/notes", async (req, res) => {
    try {
      const paperId = parseInt(req.params.id);
      if (isNaN(paperId)) {
        return res.status(400).json({ message: "Invalid paper ID" });
      }

      const notes = await storage.getNotesByPaper(paperId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  // Create note
  app.post("/api/papers/:id/notes", async (req, res) => {
    try {
      const paperId = parseInt(req.params.id);
      if (isNaN(paperId)) {
        return res.status(400).json({ message: "Invalid paper ID" });
      }

      const noteData = { ...req.body, paperId };
      const validatedData = insertNoteSchema.parse(noteData);
      const note = await storage.createNote(validatedData);
      
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  // Delete note
  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid note ID" });
      }

      const deleted = await storage.deleteNote(id);
      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Get highlights for a paper
  app.get("/api/papers/:id/highlights", async (req, res) => {
    try {
      const paperId = parseInt(req.params.id);
      if (isNaN(paperId)) {
        return res.status(400).json({ message: "Invalid paper ID" });
      }

      const highlights = await storage.getHighlightsByPaper(paperId);
      res.json(highlights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch highlights" });
    }
  });

  // Create highlight
  app.post("/api/papers/:id/highlights", async (req, res) => {
    try {
      const paperId = parseInt(req.params.id);
      if (isNaN(paperId)) {
        return res.status(400).json({ message: "Invalid paper ID" });
      }

      const highlightData = { ...req.body, paperId };
      const validatedData = insertHighlightSchema.parse(highlightData);
      const highlight = await storage.createHighlight(validatedData);
      
      res.status(201).json(highlight);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid highlight data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create highlight" });
    }
  });

  // Delete highlight
  app.delete("/api/highlights/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid highlight ID" });
      }

      const deleted = await storage.deleteHighlight(id);
      if (!deleted) {
        return res.status(404).json({ message: "Highlight not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete highlight" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
