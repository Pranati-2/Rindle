import { pgTable, text, serial, integer, jsonb, timestamp, sql } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const papers = pgTable("papers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  authors: text("authors").notNull(),
  journal: text("journal"),
  year: integer("year"),
  doi: text("doi"),
  filename: text("filename").notNull(),
  content: jsonb("content").notNull().default(sql`'[]'::jsonb`),
  thumbnail: text("thumbnail"), // Base64 encoded first page image
  progress: integer("progress").default(0),
  totalPages: integer("total_pages").default(1),
  currentPage: integer("current_page").default(1),
  tags: text("tags").array().default([]),
  notes: jsonb("notes").default([]),
  highlights: jsonb("highlights").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaperSchema = createInsertSchema(papers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePaperSchema = createInsertSchema(papers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type InsertPaper = z.infer<typeof insertPaperSchema>;
export type UpdatePaper = z.infer<typeof updatePaperSchema>;
export type Paper = typeof papers.$inferSelect;

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id").notNull(),
  content: text("content").notNull(),
  page: integer("page").notNull(),
  position: jsonb("position"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

export const highlights = pgTable("highlights", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id").notNull(),
  text: text("text").notNull(),
  page: integer("page").notNull(),
  position: jsonb("position"),
  color: text("color").default("yellow"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHighlightSchema = createInsertSchema(highlights).omit({
  id: true,
  createdAt: true,
});

export type InsertHighlight = z.infer<typeof insertHighlightSchema>;
export type Highlight = typeof highlights.$inferSelect;
