import { papers, notes, highlights, type Paper, type InsertPaper, type UpdatePaper, type Note, type InsertNote, type Highlight, type InsertHighlight } from "@shared/schema";

export interface IStorage {
  // Papers
  getPapers(): Promise<Paper[]>;
  getPaper(id: number): Promise<Paper | undefined>;
  createPaper(paper: InsertPaper): Promise<Paper>;
  updatePaper(id: number, paper: UpdatePaper): Promise<Paper | undefined>;
  deletePaper(id: number): Promise<boolean>;
  
  // Notes
  getNotesByPaper(paperId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  deleteNote(id: number): Promise<boolean>;
  
  // Highlights
  getHighlightsByPaper(paperId: number): Promise<Highlight[]>;
  createHighlight(highlight: InsertHighlight): Promise<Highlight>;
  deleteHighlight(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private papers: Map<number, Paper>;
  private notes: Map<number, Note>;
  private highlights: Map<number, Highlight>;
  private currentPaperId: number;
  private currentNoteId: number;
  private currentHighlightId: number;

  constructor() {
    this.papers = new Map();
    this.notes = new Map();
    this.highlights = new Map();
    this.currentPaperId = 1;
    this.currentNoteId = 1;
    this.currentHighlightId = 1;
  }

  async getPapers(): Promise<Paper[]> {
    return Array.from(this.papers.values()).sort((a, b) => 
      new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
    );
  }

  async getPaper(id: number): Promise<Paper | undefined> {
    return this.papers.get(id);
  }

  async createPaper(insertPaper: InsertPaper): Promise<Paper> {
    const id = this.currentPaperId++;
    const now = new Date();
    const paper: Paper = {
      ...insertPaper,
      id,
      progress: insertPaper.progress ?? 0,
      currentPage: insertPaper.currentPage ?? 1,
      totalPages: insertPaper.totalPages ?? 1,
      tags: insertPaper.tags ?? [],
      notes: insertPaper.notes ?? [],
      highlights: insertPaper.highlights ?? [],
      journal: insertPaper.journal ?? null,
      year: insertPaper.year ?? null,
      doi: insertPaper.doi ?? null,
      thumbnail: insertPaper.thumbnail ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.papers.set(id, paper);
    return paper;
  }

  async updatePaper(id: number, updatePaper: UpdatePaper): Promise<Paper | undefined> {
    const existing = this.papers.get(id);
    if (!existing) return undefined;

    const updated: Paper = {
      ...existing,
      ...updatePaper,
      updatedAt: new Date(),
    };
    this.papers.set(id, updated);
    return updated;
  }

  async deletePaper(id: number): Promise<boolean> {
    const deleted = this.papers.delete(id);
    if (deleted) {
      // Also delete associated notes and highlights
      Array.from(this.notes.values()).forEach(note => {
        if (note.paperId === id) {
          this.notes.delete(note.id);
        }
      });
      Array.from(this.highlights.values()).forEach(highlight => {
        if (highlight.paperId === id) {
          this.highlights.delete(highlight.id);
        }
      });
    }
    return deleted;
  }

  async getNotesByPaper(paperId: number): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter(note => note.paperId === paperId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.currentNoteId++;
    const note: Note = {
      ...insertNote,
      id,
      position: insertNote.position ?? null,
      createdAt: new Date(),
    };
    this.notes.set(id, note);
    return note;
  }

  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }

  async getHighlightsByPaper(paperId: number): Promise<Highlight[]> {
    return Array.from(this.highlights.values())
      .filter(highlight => highlight.paperId === paperId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createHighlight(insertHighlight: InsertHighlight): Promise<Highlight> {
    const id = this.currentHighlightId++;
    const highlight: Highlight = {
      ...insertHighlight,
      id,
      position: insertHighlight.position ?? null,
      color: insertHighlight.color ?? "yellow",
      createdAt: new Date(),
    };
    this.highlights.set(id, highlight);
    return highlight;
  }

  async deleteHighlight(id: number): Promise<boolean> {
    return this.highlights.delete(id);
  }
}

export const storage = new MemStorage();
