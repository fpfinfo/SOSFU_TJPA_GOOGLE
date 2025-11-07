import React from "react";
import { Badge } from "@/components/ui/badge";
import { PRESTACAO_STATUS_DESCRIPTIONS } from "@/components/utils/statusConstants";

// Paleta unificada de status (todas as áreas)
const STATUS_COLORS = {
  rascunho: 'bg-slate-100 text-slate-700',
  pendente: 'bg-sky-100 text-sky-700',
  em_analise: 'bg-amber-100 text-amber-700',
  aprovado: 'bg-emerald-100 text-emerald-700',
  glosa: 'bg-orange-100 text-orange-700',
  rejeitado: 'bg-rose-100 text-rose-700',
  reanalise: 'bg-cyan-100 text-cyan-700',
  ajsefin: 'bg-indigo-100 text-indigo-700',
  siafe: 'bg-violet-100 text-violet-700',
  concluido: 'bg-emerald-600 text-white font-semibold',
  // Status específicos de solicitação
  pago: 'bg-emerald-600 text-white',
  confirmado: 'bg-teal-600 text-white',
  cancelado: 'bg-purple-100 text-purple-700'
};

export default function StatusBadge({ status, showDescription = false, className = "" }) {
  const statusText = status?.replace(/_/g, ' ').toUpperCase() || 'INDEFINIDO';
  const colorClass = STATUS_COLORS[status] || "bg-slate-100 text-slate-700";

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <Badge className={`${colorClass} border text-xs font-medium px-2 py-1`}>
        {statusText}
      </Badge>
      {showDescription && (
        <p className="text-xs text-gray-600 max-w-xs">
          {PRESTACAO_STATUS_DESCRIPTIONS?.[status] || 'Status não definido'}
        </p>
      )}
    </div>
  );
}