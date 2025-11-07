import React, { useState, useEffect } from "react";
import { HistoricoStatusSolicitacao } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User as UserIcon, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_COLORS } from "./StatusMachine";

export default function StatusTimeline({ solicitacaoId }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (solicitacaoId) {
      loadHistorico();
    }
  }, [solicitacaoId]);

  const loadHistorico = async () => {
    try {
      const data = await HistoricoStatusSolicitacao.filter(
        { solicitacao_id: solicitacaoId },
        '-created_date'
      );
      setHistorico(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico de Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Histórico de Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {historico.map((item, index) => (
            <div key={item.id} className="flex gap-4">
              {/* Timeline connector */}
              <div className="relative flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                </div>
                {index < historico.length - 1 && (
                  <div className="w-px h-8 bg-gray-200 mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={STATUS_COLORS[item.de_status]} variant="outline">
                    {item.de_status.replace('_', ' ')}
                  </Badge>
                  <span className="text-gray-400">→</span>
                  <Badge className={STATUS_COLORS[item.para_status]}>
                    {item.para_status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">
                    {item.autor_id?.includes('@') ? 
                      (item.autor_id.includes('sistema') ? 'Sistema' : 'Usuário') : 
                      item.autor_id
                    }
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {format(new Date(item.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>

                {item.observacao && (
                  <div className="bg-gray-50 p-3 rounded-lg mt-2">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-700">{item.observacao}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {historico.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Nenhum histórico de alteração encontrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}