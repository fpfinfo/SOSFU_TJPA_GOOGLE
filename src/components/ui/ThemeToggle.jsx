import React from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState("light");

  React.useEffect(() => {
    const saved = localStorage.getItem("app_theme") || "light";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("app_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} title={theme === "light" ? "Ativar modo escuro" : "Desativar modo escuro"}>
      {theme === "light" ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-yellow-400" />}
    </Button>
  );
}