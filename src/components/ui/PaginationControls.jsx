import React from "react";
import { Button } from "@/components/ui/button";

export default function PaginationControls({ page, totalPages, onPrev, onNext, className = "" }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className={`flex items-center justify-between mt-4 text-sm ${className}`}>
      <span className="text-gray-600">
        Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}>Anterior</Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={onNext}>Próxima</Button>
      </div>
    </div>
  );
}