import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Upload, Search, Grid3X3, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/hooks/use-theme";
import { PaperCard } from "@/components/paper-card";
import { UploadDialog } from "@/components/upload-dialog";
import type { Paper } from "@shared/schema";

export default function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploadOpen, setUploadOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const { data: papers, isLoading, error } = useQuery<Paper[]>({
    queryKey: ["/api/papers"],
  });

  const filteredPapers = papers?.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.authors.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const sortedPapers = [...filteredPapers].sort((a, b) => {
    switch (sortBy) {
      case "alphabetical":
        return a.title.localeCompare(b.title);
      case "progress":
        return (b.progress || 0) - (a.progress || 0);
      case "recent":
      default:
        return new Date(b.updatedAt || b.createdAt || 0).getTime() - 
               new Date(a.updatedAt || a.createdAt || 0).getTime();
    }
  });

  const ThemeButton = ({ value, icon: Icon, isActive }: { value: string; icon: any; isActive: boolean }) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={() => setTheme(value as any)}
      className={isActive ? "bg-white shadow-sm dark:bg-neutral-800" : ""}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === "light" ? "bg-white text-neutral-900" :
      theme === "dark" ? "bg-neutral-900 text-neutral-100" :
      "bg-[#F7F3E9] text-[#5C4B37]"
    }`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-sm transition-colors duration-300 ${
        theme === "light" ? "bg-white/80 border-neutral-200" :
        theme === "dark" ? "bg-neutral-900/80 border-neutral-800" :
        "bg-[#F7F3E9]/80 border-[#8B7355]/20"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold">Rindle Kindle</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Input
                  type="text"
                  placeholder="Search papers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              </div>
              
              {/* Theme Switcher */}
              <div className={`flex items-center space-x-1 rounded-lg p-1 ${
                theme === "light" ? "bg-neutral-100" :
                theme === "dark" ? "bg-neutral-800" :
                "bg-[#8B7355]/10"
              }`}>
                <ThemeButton value="light" icon={() => "☀️"} isActive={theme === "light"} />
                <ThemeButton value="dark" icon={() => "🌙"} isActive={theme === "dark"} />
                <ThemeButton value="sepia" icon={() => "🍂"} isActive={theme === "sepia"} />
              </div>
              
              {/* Upload Button */}
              <Button onClick={() => setUploadOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Library Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Library</h2>
            <p className={`${
              theme === "light" ? "text-neutral-600" :
              theme === "dark" ? "text-neutral-400" :
              "text-[#8B7355]"
            }`}>
              {papers?.length || 0} papers available
            </p>
          </div>
          
          {/* View Controls */}
          <div className="flex items-center space-x-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="progress">By Progress</SelectItem>
              </SelectContent>
            </Select>
            
            <div className={`flex rounded-lg p-1 ${
              theme === "light" ? "bg-neutral-100" :
              theme === "dark" ? "bg-neutral-800" :
              "bg-[#8B7355]/10"
            }`}>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-white shadow-sm dark:bg-neutral-700" : ""}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-white shadow-sm dark:bg-neutral-700" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className={viewMode === "grid" ? 
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" :
            "space-y-4"
          }>
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-3" />
                  <Skeleton className="h-2 w-full mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">Failed to load papers</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        ) : sortedPapers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              {papers?.length === 0 ? (
                <>
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                  <h3 className="text-xl font-semibold mb-2">No papers yet</h3>
                  <p className={`mb-6 ${
                    theme === "light" ? "text-neutral-600" :
                    theme === "dark" ? "text-neutral-400" :
                    "text-[#8B7355]"
                  }`}>
                    Upload your first research paper to get started
                  </p>
                  <Button onClick={() => setUploadOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Paper
                  </Button>
                </>
              ) : (
                <>
                  <Search className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                  <h3 className="text-xl font-semibold mb-2">No results found</h3>
                  <p className={`${
                    theme === "light" ? "text-neutral-600" :
                    theme === "dark" ? "text-neutral-400" :
                    "text-[#8B7355]"
                  }`}>
                    Try adjusting your search terms
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === "grid" ? 
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" :
            "space-y-4"
          }>
            {sortedPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} viewMode={viewMode} />
            ))}
          </div>
        )}

      </main>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
