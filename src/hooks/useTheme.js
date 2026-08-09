import { useState, useEffect } from "react";
import { storage } from "../lib/storage";

export function useTheme() {
  const [themeMode, setThemeMode] = useState(() => {
    return storage.getTheme("light");
  });

  useEffect(() => {
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    storage.setTheme(themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return {
    themeMode,
    toggleTheme
  };
}
