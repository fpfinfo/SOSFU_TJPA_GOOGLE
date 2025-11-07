
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { 
  getAvailableTransitions, 
  changeStatus, 
  STATUS_DESCRIPTIONS 
} from "./StatusMachine";
import { useCurrentUser } from "@/components/utils/UserContext";

export default function StatusControl({ 
  solicitacao, 
  onStatusChanged, 
  disabled = false 
}) {
  const user = useCurrentUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [observacao, setObservacao] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user || !solicitacao) return null;

  const availableTransitions = getAvailableTransitions(solicitacao.status, user.role);
  
  if (availableTransitions.length === 0) {
    return null;
  }

  const handleOpenModal = (newStatus) => {
    setSelectedStatus(newStatus);
    setObservacao('');
    setError('');
    setIsModalOpen(true);
  };

  const handleConfirmChange = async () => {
    setLoading(true);
    setError('');

    try {
      await changeStatus(
        solicitacao.id,
        selectedStatus,
        observacao,
        user.id || user.email, // Garante que o ID do usuário seja sempre válido
        user.role,
        user.email,
        user // PASSANDO O OBJETO USER COMPLETO
      );
      
      setIsModalOpen(false);
      onStatusChanged?.(selectedStatus);
    } catch (error) {
      setError(error.message || 'Erro ao alterar status');
    } finally {
      setLoading(false);
    }
  };

  const getActionText = (status) => {
    const actions = {
      pendente: 'Enviar para Análise',
      em_analise: 'Colocar em Análise',
      aprovado: 'Aprovar',
      rejeitado: 'Rejeitar',
      pago: 'Marcar como Pago',
      confirmado: 'Confirmar Recebimento',
      cancelado: 'Cancelar'
    };
    return actions[status] || `Alterar para ${status}`;
  };

  const getActionColor = (status) => {
    const colors = {
      pendente: 'bg-blue-600 hover:bg-blue-700',
      em_analise: 'bg-yellow-600 hover:bg-yellow-700',
      aprovado: 'bg-green-600 hover:bg-green-700',
      rejeitado: 'bg-red-600 hover:bg-red-700',
      pago: 'bg-emerald-600 hover:bg-emerald-700',
      confirmado: 'bg-emerald-700 hover:bg-emerald-800',
      cancelado: 'bg-purple-600 hover:bg-purple-700'
    };
    return colors[status] || 'bg-gray-600 hover:bg-gray-700';
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {availableTransitions.map((status) => (
          <Button
            key={status}
            size="sm"
            className={getActionColor(status)}
            onClick={() => handleOpenModal(status)}
            disabled={disabled}
          >
            {getActionText(status)}
          </Button>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Alterar Status
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-sm text-gray-600">
              <p><strong>Status atual:</strong> {solicitacao.status.replace(/_/g, ' ')}</p>
              <p><strong>Novo status:</strong> {selectedStatus.replace(/_/g, ' ')}</p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              {STATUS_DESCRIPTIONS[selectedStatus]}
            </div>
            
            {/* Campo de observação foi removido da UI. */}
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmChange}
              disabled={loading}
              className={getActionColor(selectedStatus)}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Alterando...
                </div>
              ) : (
                'Confirmar Alteração'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
