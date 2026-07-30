"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeToggle() {
  const toggleTheme = () => {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    document.documentElement.style.colorScheme = nextIsDark ? "dark" : "light";
    localStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? "dark" : "light");
  };

  return (
    <Button
      aria-label="Cambia tema chiaro o scuro"
      className="size-10 rounded-xl"
      onClick={toggleTheme}
      size="icon"
      title="Cambia tema"
      variant="ghost"
    >
      <Moon aria-hidden="true" className="size-[1.1rem] dark:hidden" />
      <Sun
        aria-hidden="true"
        className="hidden size-[1.1rem] dark:block"
      />
    </Button>
  );
}
