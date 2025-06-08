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

          {/* Reading Content with Responsive Columns */}
          <div 
            className={`reading-text columns-1 lg:columns-2 gap-8 ${
              theme === "light" ? "text-neutral-900" :
              theme === "dark" ? "text-neutral-100" :
              "text-[#5C4B37]"
            }`}
            style={{ 
              fontSize: `${fontSize}px`,
              fontFamily: 'Georgia, serif',
              lineHeight: 1.7,
              textAlign: 'justify',
              columnFill: 'balance'
            }}
          >
            {/* Sample Academic Content */}
            <div className="break-inside-avoid mb-6">
              <h2 className="text-xl font-semibold mb-4 break-after-avoid">Abstract</h2>
              <p className="mb-4">
                The dominant sequence transduction models are based on complex recurrent or convolutional neural networks 
                that include an encoder and a decoder. The best performing models also connect the encoder and decoder 
                through an attention mechanism. We propose a new simple network architecture, the Transformer, based 
                solely on attention mechanisms, dispensing with recurrence and convolutions entirely.
              </p>
            </div>

            <div className="break-inside-avoid mb-6">
              <h2 className="text-xl font-semibold mb-4 break-after-avoid">1. Introduction</h2>
              <p className="mb-4">
                Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, 
                have been firmly established as state of the art approaches in sequence modeling and transduction 
                problems such as language modeling and machine translation. Numerous efforts have since continued 
                to push the boundaries of recurrent language models and encoder-decoder architectures.
              </p>
              <p className="mb-4">
                Recurrent models typically factor computation along the symbol positions of the input and output 
                sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden 
                states h_t, as a function of the previous hidden state h_(t-1) and the input for position t.
              </p>
            </div>

            <div className="break-inside-avoid mb-6">
              <h2 className="text-xl font-semibold mb-4 break-after-avoid">2. Background</h2>
              <p className="mb-4">
                The goal of reducing sequential computation also forms the foundation of the Extended Neural GPU, 
                ByteNet and ConvS2S, all of which use convolutional neural networks as basic building block, 
                computing hidden representations in parallel for all input and output positions.
              </p>
              <p className="mb-4">
                In these models, the number of operations required to relate signals from two arbitrary input 
                or output positions grows in the distance between positions, linearly for ConvS2S and logarithmically 
                for ByteNet. This makes it more difficult to learn dependencies between distant positions.
              </p>
            </div>

            <div className="break-inside-avoid mb-6">
              <h2 className="text-xl font-semibold mb-4 break-after-avoid">3. Model Architecture</h2>
              <p className="mb-4">
                Most competitive neural sequence transduction models have an encoder-decoder structure. Here, 
                the encoder maps an input sequence of symbol representations (x_1, ..., x_n) to a sequence 
                of continuous representations z = (z_1, ..., z_n). Given z, the decoder then generates an 
                output sequence (y_1, ..., y_m) of symbols one element at a time.
              </p>
              <p className="mb-4">
                At each step the model is auto-regressive, consuming the previously generated symbols as 
                additional input when generating the next. The Transformer follows this overall architecture 
                using stacked self-attention and point-wise, fully connected layers for both the encoder 
                and decoder, shown in the left and right halves of Figure 1, respectively.
              </p>
            </div>

            <div className={`${
              theme === "light" ? "bg-neutral-50" :
              theme === "dark" ? "bg-neutral-800" :
              "bg-[#8B7355]/5"
            } p-4 sm:p-6 rounded-lg break-inside-avoid mb-6`}>
              <p className={`italic text-sm ${
                theme === "light" ? "text-neutral-600" :
                theme === "dark" ? "text-neutral-400" :
                "text-[#8B7355]"
              }`}>
                This is sample content to demonstrate the responsive layout. In a production environment, 
                the actual paper content would be extracted from the uploaded {paper.filename?.endsWith('.pdf') ? 'PDF' : 'DOCX'} file 
                using PDF.js for PDF files or Mammoth.js for DOCX files, maintaining proper formatting and structure.
              </p>
            </div>
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
