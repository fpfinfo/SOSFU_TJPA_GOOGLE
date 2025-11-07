import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingOverlay({ show, text = "Processando..." }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-white shadow">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm text-gray-700">{text}</span>
      </div>
    </div>
  );
}