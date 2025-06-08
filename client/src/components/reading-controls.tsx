import { Minus, Plus, Bookmark, StickyNote, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

interface ReadingControlsProps {
  fontSize: number;
  onFontSizeChange: (delta: number) => void;
  onToggleNotes: () => void;
  showNotes: boolean;
}

export function ReadingControls({ 
  fontSize, 
  onFontSizeChange, 
  onToggleNotes, 
  showNotes 
}: ReadingControlsProps) {
  const { theme } = useTheme();

  return (
    <div className="flex items-center space-x-4">
      {/* Font Size Controls */}
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onFontSizeChange(-2)}
          disabled={fontSize <= 14}
          className={`${
            theme === "sepia" ? "hover:bg-[#8B7355]/10" : ""
          }`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[3rem] text-center">
          {fontSize}px
        </span>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onFontSizeChange(2)}
          disabled={fontSize >= 24}
          className={`${
            theme === "sepia" ? "hover:bg-[#8B7355]/10" : ""
          }`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Reading Tools */}
      <Button 
        variant="ghost" 
        size="sm" 
        title="Bookmarks"
        className={`${
          theme === "sepia" ? "hover:bg-[#8B7355]/10" : ""
        }`}
      >
        <Bookmark className="h-4 w-4" />
      </Button>
      
      <Button 
        variant={showNotes ? "default" : "ghost"}
        size="sm" 
        onClick={onToggleNotes}
        title="Notes"
        className={`${
          theme === "sepia" && !showNotes ? "hover:bg-[#8B7355]/10" : ""
        }`}
      >
        <StickyNote className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        title="Search in document"
        className={`${
          theme === "sepia" ? "hover:bg-[#8B7355]/10" : ""
        }`}
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}
