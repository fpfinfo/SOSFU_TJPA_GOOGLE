import React, { useEffect, useState } from "react";
import { HistoricoStatusPrestacao } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PRESTACAO_STATUS_COLORS } from "./PrestacaoStatusMachine";

export default function PrestacaoStatusTimeline({ prestacaoId }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (prestacaoId) load();
  }, [prestacaoId]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await HistoricoStatusPrestacao.filter({ prestacao_id: prestacaoId }, "-created_date");
      setHistorico(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader><CardTitle><Clock className="w-5 h-5 inline mr-2" />Histórico de Status</CardTitle></CardHeader>
        <CardContent><div className="animate-pulse h-20 bg-gray-100 rounded" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader><CardTitle><Clock className="w-5 h-5 inline mr-2" />Histórico de Status</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {historico.map((h, idx) => (
            <div key={h.id} className="flex gap-4">
              <div className="relative flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                {idx < historico.length - 1 && <div className="w-px h-8 bg-gray-200 mt-2" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={PRESTACAO_STATUS_COLORS[h.de_status]} variant="outline">{h.de_status.replace('_',' ')}</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge className={PRESTACAO_STATUS_COLORS[h.para_status]}>{h.para_status.replace('_',' ')}</Badge>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <span>{format(new Date(h.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
                {h.observacao && (
                  <div className="bg-gray-50 p-3 rounded-lg mt-2">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-700">{h.observacao}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {historico.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Nenhum histórico encontrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}