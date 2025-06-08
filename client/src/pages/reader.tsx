import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ArrowLeft, Minus, Plus, Bookmark, StickyNote, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/hooks/use-theme";
import { ReadingControls } from "@/components/reading-controls";
import { NotesSidebar } from "@/components/notes-sidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Paper } from "@shared/schema";

export default function Reader() {
  const [, params] = useRoute("/reader/:id");
  const paperId = parseInt(params?.id || "0");
  const [fontSize, setFontSize] = useState(18);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNotes, setShowNotes] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const { theme } = useTheme();
  const { toast } = useToast();

  const { data: paper, isLoading, error } = useQuery<Paper>({
    queryKey: ["/api/papers", paperId],
    enabled: !!paperId && !isNaN(paperId),
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ progress, page }: { progress: number; page: number }) => {
      return apiRequest("PATCH", `/api/papers/${paperId}`, {
        progress,
        currentPage: page,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/papers", paperId] });
    },
  });

  useEffect(() => {
    if (paper) {
      setCurrentPage(paper.currentPage || 1);
      setReadingProgress(paper.progress || 0);
    }
  }, [paper]);

  useEffect(() => {
    // Update progress when page changes
    if (paper && currentPage !== paper.currentPage) {
      const newProgress = Math.round((currentPage / (paper.totalPages || 1)) * 100);
      setReadingProgress(newProgress);
      
      // Debounce the API call
      const timeoutId = setTimeout(() => {
        updateProgressMutation.mutate({ 
          progress: newProgress, 
          page: currentPage 
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [currentPage, paper, updateProgressMutation]);

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(14, Math.min(24, fontSize + delta));
    setFontSize(newSize);
  };

  const handlePageChange = (direction: "prev" | "next") => {
    if (!paper) return;
    
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < (paper.totalPages || 1)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const navigateBack = () => {
    window.history.back();
  };

  if (isNaN(paperId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Invalid paper ID</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === "light" ? "bg-white text-neutral-900" :
        theme === "dark" ? "bg-neutral-900 text-neutral-100" :
        "bg-[#F7F3E9] text-[#5C4B37]"
      }`}>
        <div className="pt-20 pb-20 max-w-4xl mx-auto px-6">
          <Skeleton className="h-8 w-3/4 mb-6" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Paper not found</p>
            <Button onClick={navigateBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === "light" ? "bg-white text-neutral-900" :
      theme === "dark" ? "bg-neutral-900 text-neutral-100" :
      "bg-[#F7F3E9] text-[#5C4B37]"
    }`}>
      
      {/* Reading Header */}
      <header className={`fixed top-0 left-0 right-0 h-16 z-50 backdrop-blur-sm border-b transition-colors duration-300 ${
        theme === "light" ? "bg-white/90 border-neutral-200" :
        theme === "dark" ? "bg-neutral-900/90 border-neutral-800" :
        "bg-[#F7F3E9]/90 border-[#8B7355]/20"
      }`}>
        <div className="flex items-center justify-between px-6 h-full">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={navigateBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="max-w-md">
              <h3 className="font-semibold truncate">{paper.title}</h3>
              <p className={`text-sm ${
                theme === "light" ? "text-neutral-600" :
                theme === "dark" ? "text-neutral-400" :
                "text-[#8B7355]"
              }`}>
                {paper.authors}
              </p>
            </div>
          </div>
          
          <ReadingControls
            fontSize={fontSize}
            onFontSizeChange={handleFontSizeChange}
            onToggleNotes={() => setShowNotes(!showNotes)}
            showNotes={showNotes}
          />
        </div>
      </header>

      {/* Reading Progress Bar */}
      <div className={`fixed top-16 left-0 right-0 h-1 z-40 ${
        theme === "light" ? "bg-neutral-200" :
        theme === "dark" ? "bg-neutral-800" :
        "bg-[#8B7355]/20"
      }`}>
        <div 
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Reading Content */}
      <main className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Paper Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">{paper.title}</h1>
            
            <div className={`border-b pb-6 ${
              theme === "light" ? "text-neutral-600 border-neutral-200" :
              theme === "dark" ? "text-neutral-400 border-neutral-800" :
              "text-[#8B7355] border-[#8B7355]/20"
            }`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <p><strong>Authors:</strong> {paper.authors}</p>
                {paper.journal && <p><strong>Journal:</strong> {paper.journal}</p>}
                {paper.year && <p><strong>Year:</strong> {paper.year}</p>}
                {paper.doi && <p><strong>DOI:</strong> {paper.doi}</p>}
              </div>
            </div>
          </div>

          {/* Reading Content - Now renders images */}
          <div 
            className={`reading-text ${ // Removed column and gap styles
              theme === "light" ? "text-neutral-900" :
              theme === "dark" ? "text-neutral-100" :
              "text-[#5C4B37]"
            }`}
            // Removed inline styles for fontSize, fontFamily, lineHeight, textAlign, columnFill
          >
            {(() => {
              // Ensure paper.content is correctly typed, it should be Array<{type: string, value: string}>
              // as per shared/schema.ts and server/pdf-processor.ts
              const contentArray = paper.content as Array<{ type: string; value: string }>;
              const currentContentPage = contentArray && contentArray[currentPage - 1];

              if (isLoading) { // This isLoading is for the paper query, page content itself isn't separately loaded here
                return <p>Loading paper details...</p>;
              }

              if (!paper) { // Should be caught by earlier checks, but good for safety
                return <p>Paper data is not available.</p>;
              }

              if (currentContentPage && currentContentPage.type === 'image') {
                return (
                  <img
                    src={currentContentPage.value}
                    alt={`Page ${currentPage} of ${paper.totalPages}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      objectFit: 'contain',
                      margin: '0 auto', // Center the image if it's narrower than the container
                      maxWidth: '800px' // Optional: constrain max width for very large screens
                    }}
                  />
                );
              } else if (currentContentPage) {
                return <p>Unsupported content type for this page: {currentContentPage.type}.</p>;
              } else {
                return <p>No content available for this page ({currentPage} of {paper.totalPages}).</p>;
              }
            })()}
          </div>
        </div>
      </main>

      {/* Reading Navigation */}
      <footer className={`fixed bottom-0 left-0 right-0 h-16 z-50 backdrop-blur-sm border-t transition-colors duration-300 ${
        theme === "light" ? "bg-white/90 border-neutral-200" :
        theme === "dark" ? "bg-neutral-900/90 border-neutral-800" :
        "bg-[#F7F3E9]/90 border-[#8B7355]/20"
      }`}>
        <div className="flex items-center justify-center h-full space-x-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handlePageChange("prev")}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-4">
            <span className={`text-sm ${
              theme === "light" ? "text-neutral-600" :
              theme === "dark" ? "text-neutral-400" :
              "text-[#8B7355]"
            }`}>
              Page
            </span>
            <Input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (!isNaN(page) && page >= 1 && page <= (paper.totalPages || 1)) {
                  setCurrentPage(page);
                }
              }}
              min={1}
              max={paper.totalPages || 1}
              className="w-16 text-center text-sm"
            />
            <span className={`text-sm ${
              theme === "light" ? "text-neutral-600" :
              theme === "dark" ? "text-neutral-400" :
              "text-[#8B7355]"
            }`}>
              of {paper.totalPages || 1}
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handlePageChange("next")}
            disabled={currentPage >= (paper.totalPages || 1)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </footer>

      {/* Notes Sidebar */}
      <NotesSidebar 
        paperId={paperId}
        open={showNotes}
        onClose={() => setShowNotes(false)}
      />
    </div>
  );
}
