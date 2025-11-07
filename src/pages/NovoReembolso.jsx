
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Reembolso } from "@/api/entities";
import { DespesaReembolso } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, ArrowLeft, Upload, FileText, Loader2, Eye } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCurrentUser } from "@/components/utils/UserContext";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnexoService } from "@/components/anexos/AnexoService";
import ReembolsoStatusControl from "@/components/status/ReembolsoStatusControl";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { SequenceService } from "@/components/utils/SequenceService";

// Substitui os elementos de despesa para reembolso
const ELEMENTOS_DESPESA = [
  { codigo: '3.3.90.93.01', descricao: 'Indenizações' },
  { codigo: '3.3.90.93.02', descricao: 'Restituições' },
];

const formatCurrency = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function NovoReembolso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useCurrentUser();

  const [reembolso, setReembolso] = useState(null);
  const [despesas, setDespesas] = useState([]);
  const [anexos, setAnexos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmRemoveIdx, setConfirmRemoveIdx] = useState(null);

  const id = searchParams.get("id");
  const { register, handleSubmit, setValue } = useForm();

  const totalComprovado = useMemo(() => despesas.reduce((s, d) => s + (Number(d.valor) || 0), 0), [despesas]);

  const applyRetentionsIfPF = (item) => {
    if (item.tipo_formulario === "servico_pf") {
      const base = Number(item.comprovante_valor || 0);
      const inss = Math.round(base * 0.11 * 100) / 100;
      const iss = Math.round(base * 0.05 * 100) / 100;
      const liquido = Math.round((base - inss - iss) * 100) / 100;
      return { ...item, retencao_inss: inss, retencao_iss: iss, valor_liquido: liquido, valor: base };
    }
    return item;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (id) {
        const r = await Reembolso.get(id);
        const d = await DespesaReembolso.filter({ reembolso_id: id });
        const ax = await AnexoService.listarAnexos("reembolso", id, { origem: "suprido" });

        setReembolso(r);
        setDespesas(d.map(item => {
          const baseItem = {
            ...item,
            tipo_formulario: item.tipo_formulario || "geral",
            comprovante_valor: item.comprovante_valor || item.valor || 0,
            prestador_nome: item.prestador_nome || "",
            prestador_cpf: item.prestador_cpf || "",
            prestador_data_nascimento: item.prestador_data_nascimento || "",
            prestador_pis_nit: item.prestador_pis_nit || "",
            prestador_endereco: item.prestador_endereco || "",
            prestador_filiacao: item.prestador_filiacao || "",
            atividade_servico: item.atividade_servico || "",
            retencao_inss: item.retencao_inss || 0,
            retencao_iss: item.retencao_iss || 0,
            valor_liquido: item.valor_liquido || 0,
          };
          if (baseItem.tipo_formulario === "servico_pf") return applyRetentionsIfPF(baseItem);
          return { ...baseItem, valor: baseItem.comprovante_valor };
        }));
        setAnexos(ax);
        setValue("protocolo", r.protocolo);
        setValue("data_reembolso", r.data_reembolso);
        setValue("observacoes_suprido", r.observacoes_suprido || "");
      } else {
        const today = new Date().toISOString().split("T")[0];
        setReembolso({
          protocolo: "Será gerado ao salvar",
          data_reembolso: today,
          status: "rascunho",
          valor_total_comprovado: 0
        });
        setDespesas([]);
        setAnexos([]);
        setValue("protocolo", "Será gerado ao salvar");
        setValue("data_reembolso", today);
      }
    } finally {
      setLoading(false);
    }
  }, [id, setValue]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (reembolso) {
      setReembolso(prev => ({ ...prev, valor_total_comprovado: totalComprovado }));
    }
  }, [totalComprovado, reembolso]);

  const handleDespesaChange = (index, field, value) => {
    setDespesas(prev => {
      let next = [...prev];
      let item = { ...next[index], [field]: value };
      if (field === "comprovante_valor") {
        item.comprovante_valor = Number(value) || 0;
        if (item.tipo_formulario === "servico_pf") {
          item = applyRetentionsIfPF(item);
        } else {
          item.valor = item.comprovante_valor;
        }
      }
      next[index] = item;
      return next;
    });
  };

  const addExpenseOfType = (tipo) => {
    if (tipo === "servico_pf") {
      setDespesas(prev => [...prev, { tipo_formulario: "servico_pf", categoria: "", data_despesa: "", documento_numero: "", valor: 0, comprovante_valor: 0, atividade_servico: "", prestador_nome: "", prestador_cpf: "", prestador_data_nascimento: "", prestador_pis_nit: "", prestador_endereco: "", prestador_filiacao: "", retencao_inss: 0, retencao_iss: 0, valor_liquido: 0, observacao: "" }]);
    } else {
      setDespesas(prev => [...prev, { tipo_formulario: "geral", categoria: "", data_despesa: "", documento_numero: "", valor: 0, comprovante_valor: 0, descricao: "", observacao: "" }]);
    }
  };

  const handleRemoveDespesaInline = (index) => {
    setConfirmRemoveIdx(index);
  };

  const execRemoveDespesa = () => {
    if (confirmRemoveIdx === null) return;
    setDespesas(prev => prev.filter((_, i) => i !== confirmRemoveIdx));
    setConfirmRemoveIdx(null);
  };

  const handleUpload = async (e) => {
    if (!reembolso || !reembolso.id) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(async (f) => {
        const novo = await AnexoService.uploadAnexo({
          arquivo: f,
          ownerTipo: "reembolso",
          ownerId: reembolso.id,
          origem: "suprido",
          categoria: "comprovante"
        });
        return novo;
      }));
      setAnexos(prev => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const persist = async (form) => {
    if (despesas.length === 0) {
      toast({ variant: "destructive", title: "Adicione despesas", description: "Inclua pelo menos uma despesa." });
      return;
    }
    setLoading(true);
    try {
      let saved;
      const payloadBase = {
        ...reembolso,
        data_reembolso: form.data_reembolso,
        observacoes_suprido: form.observacoes_suprido || "",
        valor_total_comprovado: totalComprovado
      };

      if (reembolso.id) {
        // For existing reimbursement, update. Protocolo is not taken from form as it's readOnly.
        saved = await Reembolso.update(reembolso.id, payloadBase);
      } else {
        // NEW: gerar sequência para novo reembolso
        const seq = await SequenceService.generateReembolsoProtocolo();
        const payload = {
          ...payloadBase,
          protocolo: seq.protocolo,
          ano: seq.ano,
          sequencial: seq.sequencial
        };
        saved = await Reembolso.create(payload);
      }
      setReembolso(saved);

      if (saved.id) {
        const existing = await DespesaReembolso.filter({ reembolso_id: saved.id });
        const existingById = new Map(existing.map(it => [it.id, it]));
        const incomingIds = new Set(despesas.filter(d => d.id).map(d => d.id));

        for (const d of despesas) {
          const itemPayload = {
            reembolso_id: saved.id,
            tipo_formulario: d.tipo_formulario || "geral",
            descricao: d.descricao || "",
            categoria: d.categoria || "",
            data_despesa: d.data_despesa || "",
            documento_numero: d.documento_numero || "",
            valor: Number(d.valor) || 0,
            observacao: d.observacao || "",
            comprovante_valor: d.comprovante_valor ? Number(d.comprovante_valor) : Number(d.valor) || 0,
            prestador_nome: d.prestador_nome || "",
            prestador_cpf: d.prestador_cpf || "",
            prestador_data_nascimento: d.prestador_data_nascimento || "",
            prestador_pis_nit: d.prestador_pis_nit || "",
            prestador_endereco: d.prestador_endereco || "",
            prestador_filiacao: d.prestador_filiacao || "",
            atividade_servico: d.atividade_servico || "",
            retencao_inss: d.retencao_inss ? Number(d.retencao_inss) : 0,
            retencao_iss: d.retencao_iss ? Number(d.retencao_iss) : 0,
            valor_liquido: d.valor_liquido ? Number(d.valor_liquido) : Number(d.valor) || 0
          };
          if (d.id && existingById.has(d.id)) {
            await DespesaReembolso.update(d.id, itemPayload);
          } else {
            await DespesaReembolso.create(itemPayload);
          }
        }

        for (const ex of existing) {
          if (!incomingIds.has(ex.id)) {
            await DespesaReembolso.delete(ex.id);
          }
        }
      }

      toast({ title: "Rascunho salvo", description: "Reembolso salvo com sucesso." });
      await loadData();
      if (!id) {
        navigate(createPageUrl(`NovoReembolso?id=${saved.id}`), { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const onStatusChanged = async (newStatus) => {
    const updated = await Reembolso.get(reembolso.id);
    setReembolso(updated);
    toast({ title: "Status atualizado", description: `Novo status: ${newStatus}` });
    if (newStatus === "pendente") {
      navigate(createPageUrl("MeusReembolsos"));
    }
  };

  if (loading && !reembolso) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        Carregando...
      </div>
    );
  }

  if (!reembolso) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <LoadingOverlay show={loading} text="Processando..." />
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link to={createPageUrl("MeusReembolsos")}><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {reembolso.id ? "Editar" : "Novo"} Reembolso de Despesa
          </h1>
          <p className="text-gray-600 mt-1">{reembolso.protocolo}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(persist)} className="space-y-8">
        <Card className="border-none shadow-lg">
          <CardHeader><CardTitle>Dados do Reembolso</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Data *</Label>
              <Input type="date" {...register("data_reembolso", { required: true })} />
            </div>
            <div>
              <Label>Protocolo *</Label>
              <Input {...register("protocolo", { required: true })} readOnly />
            </div>
            <div className="md:col-span-3">
              <Label>Observações do Suprido</Label>
              <Textarea rows={3} {...register("observacoes_suprido")} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Despesas</CardTitle>
              <Button type="button" variant="outline" onClick={() => addExpenseOfType("geral")}><Plus className="w-4 h-4 mr-2" />Adicionar Despesa</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm text-gray-600">Total Despesas</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalComprovado)}</p>
            </div>

            <div className="space-y-4">
              {despesas.map((d, idx) => (
                <div key={`desp-${d.id || idx}`} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded ${d.tipo_formulario === 'servico_pf' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'} flex items-center justify-center text-xs font-semibold`}>#{idx + 1}</div>
                      <p className="font-semibold">{d.tipo_formulario === 'servico_pf' ? 'Serviço PF' : 'Despesa'} {idx + 1}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleRemoveDespesaInline(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                    <div className="lg:col-span-2">
                      <Label>Elemento de Despesa *</Label>
                      <Select value={d.categoria || ""} onValueChange={(v) => handleDespesaChange(idx, "categoria", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione um elemento..." /></SelectTrigger>
                        <SelectContent>
                          {ELEMENTOS_DESPESA.map(e => (<SelectItem key={e.codigo} value={e.codigo}>{e.codigo} - {e.descricao}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Data Comprovante *</Label>
                      <Input type="date" value={d.data_despesa || ""} onChange={(e) => handleDespesaChange(idx, "data_despesa", e.target.value)} />
                    </div>

                    <div>
                      <Label>N° Comprovante</Label>
                      <Input placeholder="Número do comprovante" value={d.documento_numero || ""} onChange={(e) => handleDespesaChange(idx, "documento_numero", e.target.value)} />
                    </div>

                    <div>
                      <Label>Valor Comprovante *</Label>
                      <Input type="number" min="0" step="0.01" value={d.comprovante_valor ?? 0} onChange={(e) => handleDespesaChange(idx, "comprovante_valor", Number(e.target.value))} />
                    </div>
                  </div>

                  {d.tipo_formulario === 'servico_pf' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mt-3">
                        <div className="lg:col-span-3">
                          <Label>Nome Completo do Prestador *</Label>
                          <Input value={d.prestador_nome || ""} onChange={(e) => handleDespesaChange(idx, "prestador_nome", e.target.value)} />
                        </div>
                        <div>
                          <Label>CPF *</Label>
                          <Input value={d.prestador_cpf || ""} onChange={(e) => handleDespesaChange(idx, "prestador_cpf", e.target.value)} />
                        </div>
                        <div>
                          <Label>Data de Nascimento</Label>
                          <Input type="date" value={d.prestador_data_nascimento || ""} onChange={(e) => handleDespesaChange(idx, "prestador_data_nascimento", e.target.value)} />
                        </div>
                        <div>
                          <Label>PIS/NIT</Label>
                          <Input value={d.prestador_pis_nit || ""} onChange={(e) => handleDespesaChange(idx, "prestador_pis_nit", e.target.value)} />
                        </div>
                        <div className="lg:col-span-3">
                          <Label>Endereço Completo</Label>
                          <Input value={d.prestador_endereco || ""} onChange={(e) => handleDespesaChange(idx, "prestador_endereco", e.target.value)} />
                        </div>
                        <div className="lg:col-span-3">
                          <Label>Filiação (opcional)</Label>
                          <Input value={d.prestador_filiacao || ""} onChange={(e) => handleDespesaChange(idx, "prestador_filiacao", e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mt-3">
                        <div className="lg:col-span-3">
                          <Label>Atividade (descrição do serviço)</Label>
                          <Input value={d.atividade_servico || ""} onChange={(e) => handleDespesaChange(idx, "atividade_servico", e.target.value)} />
                        </div>
                        <div>
                          <Label>INSS (11%)</Label>
                          <div className="h-10 px-3 py-2 rounded-md border bg-gray-50 flex items-center justify-end font-semibold text-rose-700">
                            {formatCurrency(d.retencao_inss || 0)}
                          </div>
                        </div>
                        <div>
                          <Label>ISS (5%)</Label>
                          <div className="h-10 px-3 py-2 rounded-md border bg-gray-50 flex items-center justify-end font-semibold text-rose-700">
                            {formatCurrency(d.retencao_iss || 0)}
                          </div>
                        </div>
                        <div>
                          <Label>Valor Líquido</Label>
                          <div className="h-10 px-3 py-2 rounded-md border bg-emerald-50 flex items-center justify-end font-bold text-emerald-700">
                            {formatCurrency(d.valor_liquido || 0)}
                          </div>
                        </div>
                        <div>
                          <Label>Valor Total (Bruto)</Label>
                          <div className="h-10 px-3 py-2 rounded-md border bg-blue-50 flex items-center justify-end font-bold text-blue-700">
                            {formatCurrency(d.valor || 0)}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mt-3">
                      <div className="lg:col-span-3">
                        <Label>Justificativa</Label>
                        <Input placeholder="Descreva a justificativa..." value={d.descricao || ""} onChange={(e) => handleDespesaChange(idx, "descricao", e.target.value)} />
                      </div>
                      <div className="lg:col-span-2">
                        <Label>Valor Total</Label>
                        <div className="h-10 px-3 py-2 rounded-md border bg-blue-50 flex items-center justify-end font-bold text-blue-700">
                          {formatCurrency(d.valor || 0)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {despesas.length === 0 && (
                <div className="text-center py-10 text-gray-500 border rounded-xl bg-gray-50">
                  Nenhuma despesa adicionada. Clique em "Adicionar Despesa" para começar.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader><CardTitle>Comprovantes Anexos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer block relative">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <div className="space-y-2">
                <p className="text-gray-600">Arraste arquivos ou clique para anexar</p>
                {!reembolso.id && <p className="text-red-500 text-sm">Salve o rascunho para anexar arquivos.</p>}
              </div>
              <input type="file" multiple onChange={handleUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading || !reembolso.id} />
            </label>
            {uploading && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin w-4 h-4" />Enviando...</div>}
            {anexos.filter(a => !a.deleted_at).length > 0 && (
              <div className="space-y-2 pt-2">
                {anexos.filter(a => !a.deleted_at).map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <p className="font-medium truncate">{a.nome_original} (v{a.versao})</p>
                    </div>
                    <div className="flex gap-1">
                      <a href={a.url_assinada} target="_blank" rel="noopener noreferrer">
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6"><Eye className="w-4 h-4" /></Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-4 border-t mt-8">
          <Button type="button" variant="outline" asChild>
            <Link to={createPageUrl("MeusReembolsos")}>Cancelar</Link>
          </Button>
          <div className="flex gap-4">
            <Button type="submit" variant="outline" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Rascunho
            </Button>
            {reembolso.id && reembolso.status === "rascunho" && (
              <ReembolsoStatusControl reembolso={reembolso} onStatusChanged={onStatusChanged} disabled={loading} />
            )}
          </div>
        </div>
      </form>
      <ConfirmDialog
        open={confirmRemoveIdx !== null}
        onOpenChange={(open) => !open && setConfirmRemoveIdx(null)}
        title="Remover despesa"
        description="Deseja realmente remover esta despesa?"
        confirmLabel="Remover"
        confirmVariant="destructive"
        onConfirm={execRemoveDespesa}
      />
    </div>
  );
}
