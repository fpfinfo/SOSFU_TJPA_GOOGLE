
import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  Eye, 
  EyeOff, 
  Trash2, 
  Download, 
  Plus,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { AnexoService } from "./AnexoService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIAS_ADMIN = [
  { value: 'portaria', label: 'Portaria SF' },
  { value: 'empenho', label: 'Empenho' },
  { value: 'documento', label: 'Documento Oficial' },
  { value: 'despacho', label: 'Despacho' },
  { value: 'outros', label: 'Outros' }
];

const AnexoItem = ({ anexo, onToggleVisibility, onRemove, onDownload, canEdit = false }) => {
  const [loading, setLoading] = useState(false);

  // Garantir data válida e compatibilidade (created_date é o campo correto)
  const createdLabel = React.useMemo(() => {
    const raw = anexo.created_date || anexo.created_at; // fallback p/ compatibilidade
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : format(d, 'dd/MM HH:mm', { locale: ptBR });
  }, [anexo.created_date, anexo.created_at]);

  const handleToggleVisibility = async () => {
    setLoading(true);
    try {
      await onToggleVisibility(anexo.id, !anexo.visivel_para_suprido);
    } catch (error) {
      console.error("Erro ao alterar visibilidade:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    await onDownload(anexo.id);
    window.open(anexo.url_assinada, '_blank');
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 border">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{anexo.nome_original}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {CATEGORIAS_ADMIN.find(c => c.value === anexo.categoria)?.label || anexo.categoria}
            </Badge>
            <Badge variant="outline" className="text-xs">
              v{anexo.versao}
            </Badge>
            {createdLabel && (
              <span className="text-xs text-gray-500">
                {createdLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Download sempre visível */}
        <Button
          variant="ghost" 
          size="icon"
          onClick={handleDownload}
          title="Baixar arquivo"
        >
          <Download className="w-4 h-4" />
        </Button>

        {/* Ações somente para administradores */}
        {canEdit && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleVisibility}
              disabled={loading}
              title={anexo.visivel_para_suprido ? "Ocultar do suprido" : "Mostrar ao suprido"}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : anexo.visivel_para_suprido ? (
                <Eye className="w-4 h-4 text-green-600" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(anexo.id)}
              className="text-red-600 hover:text-red-700"
              title="Remover arquivo"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default function AdminAnexosSection({ 
  ownerTipo, 
  ownerId, 
  anexos, 
  onAnexosChange,
  user 
}) {
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [categoria, setCategoria] = useState('documento');
  const [visivelParaSuprido, setVisivelParaSuprido] = useState(true);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // Novo: controle de permissão
  const canEdit = !!user && user.role === 'admin';

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsModalOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const novoAnexo = await AnexoService.uploadAnexo({
        arquivo: selectedFile,
        ownerTipo,
        ownerId,
        origem: 'admin',
        categoria,
        visivelParaSuprido
      });

      // Atualizar lista de anexos
      onAnexosChange(prev => [...prev, novoAnexo]);
      
      // Resetar estado
      setIsModalOpen(false);
      setSelectedFile(null);
      setCategoria('documento');
      setVisivelParaSuprido(true);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      toast({ variant: "destructive", title: "Erro no Upload", description: "Ocorreu um erro ao fazer upload do arquivo." });
    } finally {
      setUploading(false);
    }
  };

  const handleToggleVisibility = async (anexoId, novaVisibilidade) => {
    try {
      await AnexoService.alterarVisibilidade(anexoId, novaVisibilidade);
      onAnexosChange(prev => prev.map(a => 
        a.id === anexoId ? { ...a, visivel_para_suprido: novaVisibilidade } : a
      ));
    } catch (error) {
      console.error("Erro ao alterar visibilidade:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível alterar a visibilidade do anexo." });
      throw error;
    }
  };

  const handleRemove = async (anexoId) => {
    if (!window.confirm("Tem certeza que deseja remover este anexo?")) return;

    try {
      await AnexoService.excluirAnexo(anexoId);
      onAnexosChange(prev => prev.filter(a => a.id !== anexoId));
    } catch (error) {
      console.error("Erro ao remover anexo:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível remover o anexo." });
    }
  };

  const handleDownload = async (anexoId) => {
    await AnexoService.registrarDownload(anexoId);
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Documentos do Administrador
            {!canEdit && (
              <Badge variant="outline" className="ml-2">Somente visualização</Badge>
            )}
          </CardTitle>
          {canEdit && (
            <Button onClick={() => fileInputRef.current?.click()}>
              <Plus className="w-4 h-4 mr-2" />
              Anexar Documento
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {canEdit && ( // Only render file input if editing is allowed
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        )}

        <div className="space-y-3">
          {anexos.length > 0 ? (
            anexos.map(anexo => (
              <AnexoItem
                key={anexo.id}
                anexo={anexo}
                onToggleVisibility={handleToggleVisibility}
                onRemove={handleRemove}
                onDownload={handleDownload}
                canEdit={canEdit}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Nenhum documento oficial anexado</p>
              {canEdit && <p className="text-sm">Anexe portarias, empenhos e outros documentos</p>}
            </div>
          )}
        </div>

        {/* Modal de Upload - somente se admin */}
        {canEdit && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Anexar Documento Oficial</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label>Arquivo Selecionado</Label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {selectedFile?.name}
                  </p>
                </div>

                <div>
                  <Label>Categoria do Documento</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_ADMIN.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="visibilidade"
                    checked={visivelParaSuprido}
                    onChange={(e) => setVisivelParaSuprido(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="visibilidade" className="text-sm">
                    Visível para o suprido
                  </Label>
                </div>

                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                  <p><strong>Dica:</strong> Documentos marcados como "não visíveis" ficam ocultos do suprido e são úteis para rascunhos internos ou documentos em elaboração.</p>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={uploading}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Anexar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
