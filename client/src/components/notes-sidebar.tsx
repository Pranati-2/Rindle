import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/hooks/use-theme";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@shared/schema";

interface NotesSidebarProps {
  paperId: number;
  open: boolean;
  onClose: () => void;
}

export function NotesSidebar({ paperId, open, onClose }: NotesSidebarProps) {
  const [newNote, setNewNote] = useState("");
  const { theme } = useTheme();
  const { toast } = useToast();

  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: ["/api/papers", paperId, "notes"],
    enabled: open && !!paperId,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/papers/${paperId}/notes`, {
        content,
        page: 1, // In a real implementation, this would be the current page
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/papers", paperId, "notes"] });
      setNewNote("");
      toast({
        title: "Note saved",
        description: "Your note has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to save note",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return apiRequest("DELETE", `/api/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/papers", paperId, "notes"] });
      toast({
        title: "Note deleted",
        description: "The note has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete note",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveNote = () => {
    if (newNote.trim()) {
      createNoteMutation.mutate(newNote.trim());
    }
  };

  const handleDeleteNote = (noteId: number) => {
    deleteNoteMutation.mutate(noteId);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleString();
  };

  return (
    <div className={`fixed right-0 top-0 h-full w-80 shadow-2xl transform transition-transform duration-300 z-50 ${
      open ? "translate-x-0" : "translate-x-full"
    } ${
      theme === "light" ? "bg-white" :
      theme === "dark" ? "bg-neutral-900" :
      "bg-[#F7F3E9]"
    }`}>
      {/* Header */}
      <div className={`p-6 border-b ${
        theme === "light" ? "border-neutral-200" :
        theme === "dark" ? "border-neutral-800" :
        "border-[#8B7355]/20"
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Notes & Highlights</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6 space-y-4 overflow-y-auto pb-32">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notes && notes.length > 0 ? (
            notes.map((note) => (
              <Card key={note.id} className={`${
                theme === "light" ? "bg-yellow-50 border-l-4 border-l-yellow-400" :
                theme === "dark" ? "bg-yellow-900/20 border-l-4 border-l-yellow-600" :
                "bg-yellow-100/50 border-l-4 border-l-yellow-600"
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm flex-1">{note.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="ml-2 h-6 w-6 p-0"
                      disabled={deleteNoteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className={`flex items-center justify-between text-xs ${
                    theme === "light" ? "text-neutral-500" :
                    theme === "dark" ? "text-neutral-400" :
                    "text-[#8B7355]/70"
                  }`}>
                    <span>Page {note.page}</span>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className={`${
                theme === "light" ? "text-neutral-500" :
                theme === "dark" ? "text-neutral-400" :
                "text-[#8B7355]/70"
              }`}>
                No notes yet. Add your first note below!
              </p>
            </div>
          )}
        </div>
        
        {/* Add Note Section */}
        <div className={`absolute bottom-0 left-0 right-0 p-6 border-t ${
          theme === "light" ? "bg-white border-neutral-200" :
          theme === "dark" ? "bg-neutral-900 border-neutral-800" :
          "bg-[#F7F3E9] border-[#8B7355]/20"
        }`}>
          <div className="space-y-3">
            <Textarea
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="resize-none"
              rows={3}
              disabled={createNoteMutation.isPending}
            />
            <Button
              onClick={handleSaveNote}
              disabled={!newNote.trim() || createNoteMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createNoteMutation.isPending ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
