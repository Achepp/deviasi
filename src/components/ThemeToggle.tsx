"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };

    syncTheme();
    setMounted(true);

    window.addEventListener("themechange", syncTheme);
    return () => window.removeEventListener("themechange", syncTheme);
  }, []);

  const toggleTheme = () => {
    const currentIsDark = document.documentElement.classList.contains("dark");
    const nextTheme = currentIsDark ? "light" : "dark";

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    try {
      localStorage.setItem("weighing_theme", nextTheme);
    } catch {
      // ignore
    }

    setTheme(nextTheme);
    window.dispatchEvent(new Event("themechange"));
  };

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={theme === "dark" ? "Ganti ke Tema Terang (Light)" : "Ganti ke Tema Gelap (Dark)"}
      aria-label="Toggle theme"
      className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer flex items-center justify-center shadow-xs"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700" />
      )}
    </button>
  );
}
