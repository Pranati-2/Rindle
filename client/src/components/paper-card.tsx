import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/hooks/use-theme";
import type { Paper } from "@shared/schema";

interface PaperCardProps {
  paper: Paper;
  viewMode: "grid" | "list";
}

export function PaperCard({ paper, viewMode }: PaperCardProps) {
  const { theme } = useTheme();
  
  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
  };

  const getTagColor = (index: number) => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    ];
    return colors[index % colors.length];
  };

  if (viewMode === "list") {
    return (
      <Link href={`/reader/${paper.id}`}>
        <Card className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
          theme === "sepia" ? "bg-[#F7F3E9] border-[#8B7355]/20" : ""
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              {/* Thumbnail placeholder */}
              <div className={`w-16 h-20 rounded flex-shrink-0 flex items-center justify-center ${
                theme === "light" ? "bg-neutral-100" :
                theme === "dark" ? "bg-neutral-800" :
                "bg-[#8B7355]/10"
              }`}>
                📄
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{paper.title}</h3>
                <p className={`text-sm mb-2 ${
                  theme === "light" ? "text-neutral-600" :
                  theme === "dark" ? "text-neutral-400" :
                  "text-[#8B7355]"
                }`}>
                  {paper.authors}
                </p>
                {paper.journal && (
                  <p className={`text-xs mb-3 ${
                    theme === "light" ? "text-neutral-500" :
                    theme === "dark" ? "text-neutral-500" :
                    "text-[#8B7355]/70"
                  }`}>
                    {paper.journal} • {paper.year}
                  </p>
                )}
                
                {/* Progress */}
                <div className="mb-3">
                  <div className={`flex items-center justify-between text-xs mb-1 ${
                    theme === "light" ? "text-neutral-600" :
                    theme === "dark" ? "text-neutral-400" :
                    "text-[#8B7355]"
                  }`}>
                    <span>Progress</span>
                    <span>{paper.progress || 0}%</span>
                  </div>
                  <Progress value={paper.progress || 0} className="h-2" />
                </div>
                
                {/* Tags */}
                {paper.tags && paper.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {paper.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={tag} variant="secondary" className={`text-xs ${getTagColor(index)}`}>
                        {tag}
                      </Badge>
                    ))}
                    {paper.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{paper.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <div className={`text-xs ${
                theme === "light" ? "text-neutral-500" :
                theme === "dark" ? "text-neutral-500" :
                "text-[#8B7355]/70"
              }`}>
                {formatDate(paper.updatedAt || paper.createdAt)}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/reader/${paper.id}`}>
      <Card className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        theme === "sepia" ? "bg-[#F7F3E9] border-[#8B7355]/20" : ""
      }`}>
        {/* Thumbnail placeholder */}
        <div className={`w-full h-48 rounded-t-xl flex items-center justify-center text-4xl ${
          theme === "light" ? "bg-neutral-100" :
          theme === "dark" ? "bg-neutral-800" :
          "bg-[#8B7355]/10"
        }`}>
          📄
        </div>
        
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2 line-clamp-2">{paper.title}</h3>
          <p className={`text-sm mb-3 ${
            theme === "light" ? "text-neutral-600" :
            theme === "dark" ? "text-neutral-400" :
            "text-[#8B7355]"
          }`}>
            {paper.authors}
          </p>
          {paper.journal && (
            <p className={`text-xs mb-4 ${
              theme === "light" ? "text-neutral-500" :
              theme === "dark" ? "text-neutral-500" :
              "text-[#8B7355]/70"
            }`}>
              {paper.journal} • {paper.year}
            </p>
          )}
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className={`flex items-center justify-between text-xs mb-1 ${
              theme === "light" ? "text-neutral-600" :
              theme === "dark" ? "text-neutral-400" :
              "text-[#8B7355]"
            }`}>
              <span>Progress</span>
              <span>{paper.progress || 0}%</span>
            </div>
            <Progress value={paper.progress || 0} className="h-2" />
          </div>
          
          {/* Tags */}
          {paper.tags && paper.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {paper.tags.slice(0, 2).map((tag, index) => (
                <Badge key={tag} variant="secondary" className={`text-xs ${getTagColor(index)}`}>
                  {tag}
                </Badge>
              ))}
              {paper.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{paper.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
