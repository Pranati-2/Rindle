import { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark" | "sepia";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as Theme) || "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    
    // Update document class
    document.documentElement.classList.remove("light", "dark", "sepia");
    document.documentElement.classList.add(theme);
    
    // Update theme-color meta tag
    const themeColorMap = {
      light: "#ffffff",
      dark: "#0a0a0a", 
      sepia: "#F7F3E9"
    };
    
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColorMap[theme]);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
