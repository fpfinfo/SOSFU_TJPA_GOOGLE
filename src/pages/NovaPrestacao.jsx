
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { PrestacaoContas } from "@/api/entities";
import { DespesaPrestacao } from "@/api/entities";
import { SolicitacaoSuprimento } from "@/api/entities";
import { DevolucaoPrestacao } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, ArrowLeft, Upload, FileText, Loader2, Eye, Undo2 } from "lucide-react";
// Adiciona o ícone de link externo
import { ExternalLink } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCurrentUser } from "@/components/utils/UserContext";
import { useToast } from "@/components/ui/use-toast";
import PrestacaoStatusControl from "@/components/status/PrestacaoStatusControl";
import { AnexoService } from "@/components/anexos/AnexoService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

const formatCurrency = (value) => {
  const n = Number(value) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const ELEMENTOS_DESPESA_PRESTACAO = [
  { codigo: '3.3.90.30.96.01', descricao: 'CONSUMO EM GERAL' },
  { codigo: '3.3.90.30.96.02', descricao: 'COMBUSTÍVEL' },
  { codigo: '3.3.90.33.96', descricao: 'TRANSPORTE E LOCOMOÇÃO' },
  { codigo: '3.3.90.36.96', descricao: 'PRESTAÇÃO DE SERVIÇO PF' },
  { codigo: '3.3.90.39.96', descricao: 'PRESTAÇÃO DE SERVIÇO PJ' },
];

const ATIVIDADES_SERVICO = [
  "FORNECIMENTO DE LANCHES E REFEIÇÕES",
  "ALUGUEL DE MESAS E CADEIRAS",
  "SERVIÇO DE CONFECÇÃO DE CARIMBOS",
  "LOCAÇÃO APARELHO SOM",
  "SERVILO DE MANUTENÇÃO DE MÓVEIS",
  "SERVIÇO DE CHAVEIRO",
  "SERVIÇO DE COPEIRA",
  "SERVIÇO DE INTERNET",
  "SERVIÇO DE LAVAGEM AUTOMOTIVA",
  "SERVIÇO DE LIMPEZA E MANUTENÇÃO",
  "SERVIÇO DE MANUTENÇÃO EM GERAL",
  "SERVIÇO DE MANUTENÇÃO DE SOM",
  "SERVIÇO DE MANUTENÇÃO INFORMÁTICA",
  "SERVIÇO DE MANUTENÇÃO PREDIAL",
  "SERVIÇO DE MANUTENÇÃO VEICULAR",
  "SERVIÇO DE PINTURA",
  "SERVIÇO DE REFRIGERAÇÃO",
  "SERVIÇO DE ROÇAGEM E CAPINA",
  "SERVIÇO DE PODA E/OU JARDINAGEM",
  "SERVIÇOS ELÉTRICOS",
  "SERVIÇOS HIDRAULICOS",
  "OUTROS SERVIÇO NÃO LISTADOS"
];

export default function NovaPrestacao() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useCurrentUser();

  const [prestacao, setPrestacao] = useState(null);
  const [despesas, setDespesas] = useState([]);
  const [anexos, setAnexos] = useState([]);
  const [devolucoes, setDevolucoes] = useState([]);
  const [solicitacoesElegiveis, setSolicitacoesElegiveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chooseTypeOpen, setChooseTypeOpen] = useState(false); // NOVO: modal de escolha do tipo de despesa
  // NOVO: valor recebido da solicitação vinculada
  const [valorRecebido, setValorRecebido] = useState(0);

  const [confirmState, setConfirmState] = useState({ open: false, action: null, payload: null });

  const id = searchParams.get("id");

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  // NOVO: manter referência do register para capturar onChange
  const solicitacaoReg = register("solicitacao_suprimento_id", { required: true });

  const totalComprovado = useMemo(() => despesas.reduce((s, d) => s + (Number(d.valor) || 0), 0), [despesas]);
  const totalDevolvido = useMemo(() => devolucoes.reduce((s, d) => s + (Number(d.valor) || 0), 0), [devolucoes]);
  // NOVO: saldo correto considerando o valor recebido
  const saldoPrestacao = useMemo(() => {
    return (Number(valorRecebido) || 0) - (totalComprovado + totalDevolvido);
  }, [valorRecebido, totalComprovado, totalDevolvido]);

  const loadSolicitacoes = useCallback(async () => {
    if (!user) return;
    const data = await SolicitacaoSuprimento.filter({ created_by: user.email }, "-created_date");
    setSolicitacoesElegiveis(data.filter(s => ["pago", "confirmado", "aprovado"].includes(s.status)));
  }, [user]);

  // NOVO: cálculo das retenções ao alterar valor da NF
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
      await loadSolicitacoes();
      if (id) {
        const p = await PrestacaoContas.get(id);
        const d = await DespesaPrestacao.filter({ prestacao_id: id });
        const ax = await AnexoService.listarAnexos("prestacao", id, { origem: "suprido" });
        const dv = await DevolucaoPrestacao.filter({ prestacao_id: id });

        setPrestacao(p);
        setDespesas(d.map(item => {
          const baseItem = {
            ...item,
            tipo_formulario: item.tipo_formulario || "geral", // Default for existing old data
            comprovante_valor: item.comprovante_valor || item.valor || 0, // If comprovante_valor is missing, use existing 'valor'
            // Ensure all new fields are initialized for safety
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
          // If it's servico_pf and comprovante_valor is set, recalculate for consistency
          if (baseItem.tipo_formulario === "servico_pf") {
            return applyRetentionsIfPF(baseItem);
          }
          // For 'geral', ensure 'valor' equals 'comprovante_valor'
          return { ...baseItem, valor: baseItem.comprovante_valor };
        }));
        setDevolucoes(dv.map(item => ({
          ...item,
          quantidade: item.quantidade || 1,
          valor_unitario: item.valor_unitario || Number(item.valor) || 0,
        })));
        setAnexos(ax);
        setValue("solicitacao_suprimento_id", p.solicitacao_suprimento_id);
        setValue("protocolo", p.protocolo);
        setValue("data_prestacao", p.data_prestacao);
        setValue("observacoes_suprido", p.observacoes_suprido || "");
      } else {
        const now = new Date();
        const proto = `PRE-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
        setPrestacao({
          protocolo: proto,
          data_prestacao: new Date().toISOString().split("T")[0],
          status: "rascunho",
          valor_total_comprovado: 0
        });
        setDespesas([]);
        setAnexos([]);
        setDevolucoes([]);
        setValue("protocolo", proto);
        setValue("data_prestacao", new Date().toISOString().split("T")[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [id, loadSolicitacoes, setValue]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (prestacao) {
      setPrestacao(prev => ({ ...prev, valor_total_comprovado: totalComprovado }));
    }
  }, [totalComprovado, prestacao]);

  useEffect(() => {
    // Quando prestacao e lista de solicitações carregarem, derive o valor recebido
    if (prestacao?.solicitacao_suprimento_id && solicitacoesElegiveis?.length) {
      const s = solicitacoesElegiveis.find(x => x.id === prestacao.solicitacao_suprimento_id);
      setValorRecebido(s?.valor_solicitado || 0);
    }
  }, [solicitacoesElegiveis, prestacao]);

  const askConfirm = (action, payload) => setConfirmState({ open: true, action, payload });
  const closeConfirm = () => setConfirmState({ open: false, action: null, payload: null });

  const execConfirm = async () => {
    const { action, payload } = confirmState;
    if (action === "remove-despesa") {
      setDespesas(prev => prev.filter((_, i) => i !== payload.index));
      toast({ title: "Despesa removida", description: "A despesa foi removida da lista." });
    } else if (action === "remove-devolucao") {
      setDevolucoes(prev => prev.filter((_, i) => i !== payload.index));
      toast({ title: "Devolução removida", description: "A devolução foi removida da lista." });
    } else if (action === "remove-anexo" || action === "remove-anexo-item") {
      setLoading(true); // Show loading for async operation
      try {
        await AnexoService.excluirAnexo(payload.id);
        setAnexos(prev => prev.filter(a => a.id !== payload.id));
        toast({ title: "Anexo removido", description: "O anexo foi removido com sucesso." });
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao remover anexo", description: error.message || "Não foi possível remover o anexo." });
      } finally {
        setLoading(false);
      }
    }
    closeConfirm();
  };

  // NOVO: adicionar despesa conforme tipo escolhido
  const addExpenseOfType = (tipo) => {
    if (tipo === "servico_pf") {
      setDespesas(prev => [
        ...prev,
        {
          tipo_formulario: "servico_pf",
          categoria: "",
          data_despesa: "",
          documento_numero: "",
          valor: 0, // Gross value
          comprovante_valor: 0, // Input for NF/Comprovante value
          descricao: "", // General description, if needed (can be used for 'finalidade' or combined)
          atividade_servico: "", // Specific for servico_pf
          prestador_nome: "",
          prestador_cpf: "",
          prestador_data_nascimento: "",
          prestador_pis_nit: "",
          prestador_endereco: "",
          prestador_filiacao: "",
          retencao_inss: 0,
          retencao_iss: 0,
          valor_liquido: 0,
          observacao: ""
        }
      ]);
    } else { // tipo === "geral"
      setDespesas(prev => [
        ...prev,
        {
          tipo_formulario: "geral",
          categoria: "",
          data_despesa: "",
          documento_numero: "",
          valor: 0, // Total value of the expense
          comprovante_valor: 0, // Input for the expense value
          descricao: "", // Justificativa
          observacao: ""
        }
      ]);
    }
    setChooseTypeOpen(false);
  };

  // Handlers para despesas inline (atualizados)
  const handleDespesaChange = (index, field, value) => {
    setDespesas(prev => {
      let next = [...prev];
      let item = { ...next[index], [field]: value };

      if (field === "comprovante_valor") {
        item.comprovante_valor = Number(value) || 0;
        if (item.tipo_formulario === "servico_pf") {
          item = applyRetentionsIfPF(item);
        } else { // geral
          item.valor = item.comprovante_valor;
        }
      }

      next[index] = item;
      return next;
    });
  };

  const handleRemoveDespesaInline = (index) => {
    askConfirm("remove-despesa", { index });
  };

  // Handlers para devoluções inline (GDR)
  const handleAddDevolucao = () => {
    const nova = {
      tipo: "gdr", // Default type for devolution
      descricao: "",
      categoria: "",
      data_devolucao: "",
      documento_numero: "",
      quantidade: 1,
      valor_unitario: 0,
      valor: 0, // Calculated value
      observacao: ""
    };
    setDevolucoes(prev => [...prev, nova]);
  };

  const handleDevolucaoChange = (index, field, value) => {
    setDevolucoes(prev => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === "quantidade" || field === "valor_unitario") {
        const q = Number(field === "quantidade" ? value : item.quantidade) || 0;
        const vu = Number(field === "valor_unitario" ? value : item.valor_unitario) || 0;
        item.valor = q * vu;
      }
      next[index] = item;
      return next;
    });
  };

  const handleRemoveDevolucaoInline = (index) => {
    askConfirm("remove-devolucao", { index });
  };

  const handleUpload = async (e) => {
    if (!prestacao || !prestacao.id) {
      toast({ variant: "destructive", title: "Erro", description: "Salve o rascunho antes de anexar arquivos." });
      return;
    }
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(async (f) => {
        const novo = await AnexoService.uploadAnexo({
          arquivo: f,
          ownerTipo: "prestacao",
          ownerId: prestacao.id,
          origem: "suprido",
          categoria: "comprovante"
        });
        return novo;
      }));
      setAnexos(prev => [...prev, ...uploaded]);
      toast({ title: "Anexos enviados", description: `${uploaded.length} arquivo(s) enviado(s) com sucesso.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao enviar anexo", description: error.message || "Não foi possível enviar o anexo." });
    } finally {
      setUploading(false);
      e.target.value = ""; // clear the input
    }
  };

  const removeAnexo = (anexoId) => {
    askConfirm("remove-anexo", { id: anexoId });
  };

  const removeAnexoItem = (anexoId) => {
    askConfirm("remove-anexo-item", { id: anexoId });
  };

  // Upload por item de despesa
  const handleUploadItem = async (despesaId, e) => {
    if (!prestacao || !prestacao.id) {
      toast({ variant: "destructive", title: "Erro", description: "Salve o rascunho antes de anexar arquivos." });
      return;
    }
    if (!despesaId) {
      toast({ variant: "destructive", title: "Erro", description: "Salve a prestação para gerar o ID desta despesa antes de anexar arquivos." });
      return;
    }
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(async (f) => {
        const novo = await AnexoService.uploadAnexo({
          arquivo: f,
          ownerTipo: "prestacao",
          ownerId: prestacao.id,
          origem: "suprido",
          categoria: "comprovante",
          despesa_prestacao_id: despesaId
        });
        return novo;
      }));
      setAnexos(prev => [...prev, ...uploaded]);
      toast({ title: "Anexos enviados", description: `${uploaded.length} arquivo(s) enviado(s) para este item.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao enviar anexo", description: error.message || "Não foi possível enviar o anexo." });
    } finally {
      setUploading(false);
      // limpar o input
      e.target.value = "";
    }
  };

  const persist = async (form) => {
    if (!form.solicitacao_suprimento_id) {
      toast({ variant: "destructive", title: "Selecione a solicitação", description: "Vincule uma solicitação para continuar." });
      return;
    }
    if (despesas.length === 0 && devolucoes.length === 0) {
      toast({ variant: "destructive", title: "Adicione despesas ou devoluções", description: "Inclua pelo menos uma despesa ou devolução." });
      return;
    }
    setLoading(true);
    try {
      let saved;
      const payload = {
        ...prestacao,
        solicitacao_suprimento_id: form.solicitacao_suprimento_id,
        protocolo: form.protocolo,
        data_prestacao: form.data_prestacao,
        observacoes_suprido: form.observacoes_suprido || "",
        valor_total_comprovado: totalComprovado,
        valor_total_devolvido: totalDevolvido
      };

      const sol = await SolicitacaoSuprimento.get(form.solicitacao_suprimento_id);
      payload.solicitacao_numero_snapshot = sol?.numero_solicitacao || "";

      if (prestacao.id) {
        saved = await PrestacaoContas.update(prestacao.id, payload);
      } else {
        saved = await PrestacaoContas.create(payload);
      }
      setPrestacao(saved);

      // UPsert de despesas: atualizar existentes, criar novas e remover as excluídas
      if (saved.id) {
        const existing = await DespesaPrestacao.filter({ prestacao_id: saved.id });
        const existingById = new Map(existing.map(it => [it.id, it]));

        const incomingIds = new Set(despesas.filter(d => d.id).map(d => d.id));

        // Atualiza ou cria
        for (const d of despesas) {
          const itemPayload = {
            prestacao_id: saved.id,
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
            valor_liquido: d.valor_liquido ? Number(d.valor_liquido) : Number(d.valor) || 0,
          };

          if (d.id && existingById.has(d.id)) {
            await DespesaPrestacao.update(d.id, itemPayload);
          } else {
            await DespesaPrestacao.create(itemPayload);
          }
        }

        // Remover as que não estão mais presentes
        for (const ex of existing) {
          if (!incomingIds.has(ex.id)) {
            await DespesaPrestacao.delete(ex.id);
          }
        }
      }

      // Persistir devoluções: apagar antigas e inserir novas
      if (saved.id) {
        const existingDev = await DevolucaoPrestacao.filter({ prestacao_id: saved.id });
        for (const it of existingDev) {
          await DevolucaoPrestacao.delete(it.id);
        }
        if (devolucoes.length > 0) {
          const toPersistDev = devolucoes.map(d => ({
            prestacao_id: saved.id,
            tipo: d.tipo || "gdr",
            descricao: d.descricao || "",
            categoria: d.categoria || "",
            data_devolucao: d.data_devolucao || "",
            documento_numero: d.documento_numero || "",
            quantidade: Number(d.quantidade) || 1,
            valor_unitario: Number(d.valor_unitario) || Number(d.valor) || 0,
            valor: Number(d.valor) || 0,
            observacao: d.observacao || ""
          }));
          await DevolucaoPrestacao.bulkCreate(toPersistDev);
        }
      }

      toast({ title: "Rascunho salvo", description: "Prestação salva com sucesso." });
      // Recarregar dados para popular IDs das novas despesas (necessário para uploads por item)
      await loadData();
      if (!id) {
        navigate(createPageUrl(`NovaPrestacao?id=${saved.id}`), { replace: true });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar prestação", description: error.message || "Não foi possível salvar a prestação de contas." });
    } finally {
      setLoading(false);
    }
  };

  const onStatusChanged = async (newStatus) => {
    setLoading(true);
    try {
      const updated = await PrestacaoContas.get(prestacao.id);
      setPrestacao(updated);
      toast({ title: "Status atualizado", description: `Novo status: ${newStatus}` });
      if (newStatus === "pendente") {
        navigate(createPageUrl("MinhasPrestacoes"));
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar status", description: error.message || "Não foi possível atualizar o status da prestação." });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !prestacao && !confirmState.open) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        Carregando...
      </div>
    );
  }

  if (!prestacao) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <LoadingOverlay show={loading} text="Processando..." />

      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link to={createPageUrl("MinhasPrestacoes")}><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {prestacao.id ? "Editar" : "Nova"} Prestação de Contas
          </h1>
          <p className="text-gray-600 mt-1">{prestacao.protocolo}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(persist)} className="space-y-8">
        <Card className="border-none shadow-lg">
          <CardHeader><CardTitle>Dados da Prestação</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Solicitação Vinculada *</Label>
              <select
                {...solicitacaoReg}
                className={`w-full border rounded px-3 py-2 mt-1 ${errors.solicitacao_suprimento_id ? "border-red-500" : ""}`}
                defaultValue=""
                onChange={(e) => {
                  solicitacaoReg.onChange(e);
                  const sel = solicitacoesElegiveis.find(x => x.id === e.target.value);
                  setValorRecebido(sel?.valor_solicitado || 0);
                }}
              >
                <option value="" disabled>Selecione...</option>
                {solicitacoesElegiveis.map(s => (
                  <option key={s.id} value={s.id}>{s.numero_solicitacao} — {s.nome_servidor}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" {...register("data_prestacao", { required: true })} />
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
              <div>
                <CardTitle>Despesas e Devoluções</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setChooseTypeOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Despesa
                </Button>
                <Button type="button" variant="outline" onClick={handleAddDevolucao}>
                  <Undo2 className="w-4 h-4 mr-2" />
                  Adicionar Devolução
                </Button>
                {/* Botão externo para gerar GDR no TJPA */}
                <Button type="button" variant="outline" asChild>
                  <a
                    href="https://apps.tjpa.jus.br/gdr-publico/emissao-guia"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Gerar GDR no site do TJPA"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Gerar GDR (TJPA)
                  </a>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumo - ATUALIZADO */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm text-gray-600">Valor Recebido</p>
                <p className="text-2xl font-bold text-indigo-700">{formatCurrency(valorRecebido)}</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm text-gray-600">Total Despesas</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalComprovado)}</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm text-gray-600">Total Devoluções</p>
                <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalDevolvido)}</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm text-gray-600">Saldo para Prestação</p>
                <p className={`text-2xl font-bold ${saldoPrestacao < 0 ? 'text-red-600' : saldoPrestacao === 0 ? 'text-emerald-700' : 'text-gray-800'}`}>
                  {formatCurrency(saldoPrestacao)}
                </p>
              </div>
            </div>

            {/* Lista de Despesas (cards por tipo) */}
            <div className="space-y-4">
              {despesas.map((d, idx) => (
                <div key={`desp-${d.id || idx}`} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded ${d.tipo_formulario === 'servico_pf' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'} flex items-center justify-center text-xs font-semibold`}>#{idx + 1}</div>
                      <p className="font-semibold">{d.tipo_formulario === 'servico_pf' ? 'Serviço PF' : 'Despesa'} {idx + 1}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.tipo_formulario === 'servico_pf' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {d.tipo_formulario === 'servico_pf' ? 'Prestação de Serviço PF' : 'Geral'}
                      </span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleRemoveDespesaInline(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Cabeçalho comum */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                    <div className="lg:col-span-2">
                      <Label>Elemento de Despesa *</Label>
                      <Select
                        value={d.categoria || ""}
                        onValueChange={(v) => handleDespesaChange(idx, "categoria", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um elemento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ELEMENTOS_DESPESA_PRESTACAO.map(e => (
                            <SelectItem key={e.codigo} value={e.codigo}>
                              {e.codigo} - {e.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Data Comprovante *</Label>
                      <Input
                        type="date"
                        value={d.data_despesa || ""}
                        onChange={(e) => handleDespesaChange(idx, "data_despesa", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>N° Comprovante</Label>
                      <Input
                        placeholder="Número do comprovante"
                        value={d.documento_numero || ""}
                        onChange={(e) => handleDespesaChange(idx, "documento_numero", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Valor Comprovante *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={d.comprovante_valor ?? 0}
                        onChange={(e) => handleDespesaChange(idx, "comprovante_valor", Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Campos específicos */}
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
                          <Select
                            value={d.atividade_servico || ""}
                            onValueChange={(v) => handleDespesaChange(idx, "atividade_servico", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a atividade..." />
                            </SelectTrigger>
                            <SelectContent>
                              {ATIVIDADES_SERVICO.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <Input
                          placeholder="Descreva a justificativa..."
                          value={d.descricao || ""}
                          onChange={(e) => handleDespesaChange(idx, "descricao", e.target.value)}
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <Label>Valor Total</Label>
                        <div className="h-10 px-3 py-2 rounded-md border bg-blue-50 flex items-center justify-end font-bold text-blue-700">
                          {formatCurrency(d.valor || 0)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mt-3">
                    <div className="lg:col-span-6">
                      <Label>Observação (opcional)</Label>
                      <Input
                        placeholder="Observações adicionais"
                        value={d.observacao || ""}
                        onChange={(e) => handleDespesaChange(idx, "observacao", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Upload por item - agora habilitado quando a despesa já existe */}
                  <div className="mt-4">
                    {(!prestacao || !prestacao.id) ? (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center block cursor-not-allowed bg-gray-50">
                        <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Salve a prestação para anexar por item.</p>
                      </label>
                    ) : (!d.id) ? (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center block cursor-not-allowed bg-gray-50">
                        <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Salve as alterações para gerar o ID desta despesa.</p>
                      </label>
                    ) : (
                      <div className="space-y-2">
                        <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center block hover:border-blue-500 transition-colors cursor-pointer relative">
                          <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">Anexar comprovantes deste item</p>
                            {uploading && <div className="flex items-center justify-center gap-2 text-xs text-gray-500"><Loader2 className="animate-spin w-4 h-4" />Enviando...</div>}
                          </div>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleUploadItem(d.id, e)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploading}
                          />
                        </label>
                        {/* Lista de anexos do item */}
                        {anexos.filter(a => a.despesa_prestacao_id === d.id && !a.deleted_at).length > 0 && (
                          <div className="space-y-1">
                            {anexos.filter(a => a.despesa_prestacao_id === d.id && !a.deleted_at).map(a => (
                              <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                  <p className="font-medium truncate">{a.nome_original} (v{a.versao})</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:text-red-700 h-6 w-6" onClick={() => removeAnexoItem(a.id)}><Trash2 className="w-4 h-4" /></Button>
                                  <a href={a.url_assinada} target="_blank" rel="noopener noreferrer">
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6"><Eye className="w-4 h-4" /></Button>
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {despesas.length === 0 && (
                <div className="text-center py-10 text-gray-500 border rounded-xl bg-gray-50">
                  Nenhuma despesa adicionada. Clique em "Adicionar Despesa" para começar.
                </div>
              )}
            </div>

            {/* Lista de Devoluções */}
            <div className="space-y-4">
              {devolucoes.map((d, idx) => (
                <div key={`dev-${idx}`} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-semibold">#{idx + 1}</div>
                      <p className="font-semibold text-orange-700">Devolução {idx + 1}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleRemoveDevolucaoInline(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                    {/* Elemento de Despesa */}
                    <div className="lg:col-span-2">
                      <Label>Elemento de Despesa *</Label>
                      <Select
                        value={d.categoria || ""}
                        onValueChange={(v) => handleDevolucaoChange(idx, "categoria", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um elemento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ELEMENTOS_DESPESA_PRESTACAO.map(e => (
                            <SelectItem key={e.codigo} value={e.codigo}>
                              {e.codigo} - {e.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Data da Devolução */}
                    <div>
                      <Label>Data da Devolução *</Label>
                      <Input
                        type="date"
                        value={d.data_devolucao || ""}
                        onChange={(e) => handleDevolucaoChange(idx, "data_devolucao", e.target.value)}
                      />
                    </div>

                    {/* Quantidade */}
                    <div>
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={d.quantidade ?? 1}
                        onChange={(e) => handleDevolucaoChange(idx, "quantidade", Number(e.target.value))}
                      />
                    </div>

                    {/* Valor Unitário */}
                    <div>
                      <Label>Valor Unitário *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={d.valor_unitario ?? 0}
                        onChange={(e) => handleDevolucaoChange(idx, "valor_unitario", Number(e.target.value))}
                      />
                    </div>

                    {/* Valor Total (calculado) */}
                    <div>
                      <Label>Valor Total</Label>
                      <div className="h-10 px-3 py-2 rounded-md border bg-gray-50 text-right font-semibold flex items-center justify-end">
                        {formatCurrency(Number(d.valor) || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mt-3">
                    {/* Finalidade */}
                    <div className="lg:col-span-3">
                      <Label>Finalidade</Label>
                      <Input
                        placeholder="Descreva a finalidade da devolução..."
                        value={d.descricao || ""}
                        onChange={(e) => handleDevolucaoChange(idx, "descricao", e.target.value)}
                      />
                    </div>

                    {/* Nº Comprovante (GDR) */}
                    <div className="lg:col-span-2">
                      <Label>Nº Comprovante (GDR)</Label>
                      <Input
                        placeholder="Número da GDR ou comprovante"
                        value={d.documento_numero || ""}
                        onChange={(e) => handleDevolucaoChange(idx, "documento_numero", e.target.value)}
                      />
                    </div>

                    {/* Observação (opcional) */}
                    <div className="lg:col-span-6">
                      <Label>Observação</Label>
                      <Input
                        placeholder="Observações (opcional)"
                        value={d.observacao || ""}
                        onChange={(e) => handleDevolucaoChange(idx, "observacao", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {devolucoes.length === 0 && (
                <div className="text-center py-10 text-gray-500 border rounded-xl bg-gray-50">
                  Nenhuma devolução adicionada. Clique em "Adicionar Devolução" para registrar a GDR.
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
                {!prestacao.id && <p className="text-red-500 text-sm">Salve o rascunho para anexar arquivos.</p>}
              </div>
              <input type="file" multiple onChange={handleUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading || !prestacao.id} />
            </label>
            {uploading && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin w-4 h-4" />Enviando...</div>}
            {anexos.filter(a => !a.despesa_prestacao_id && !a.deleted_at).length > 0 && (
              <div className="space-y-2 pt-2">
                {anexos.filter(a => !a.despesa_prestacao_id && !a.deleted_at).map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <p className="font-medium truncate">{a.nome_original} (v{a.versao})</p>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:text-red-700 h-6 w-6" onClick={() => removeAnexo(a.id)}><Trash2 className="w-4 h-4" /></Button>
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
            <Link to={createPageUrl("MinhasPrestacoes")}>Cancelar</Link>
          </Button>
          <div className="flex gap-4">
            <Button type="submit" variant="outline" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Rascunho
            </Button>
            {prestacao.id && prestacao.status === "rascunho" && (
              <PrestacaoStatusControl prestacao={prestacao} onStatusChanged={onStatusChanged} disabled={loading} />
            )}
          </div>
        </div>
      </form>

      {/* Modal de escolha do tipo de despesa */}
      <Dialog open={chooseTypeOpen} onOpenChange={setChooseTypeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escolher tipo de despesa</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-2">
            <Button type="button" className="justify-start" onClick={() => addExpenseOfType('geral')}>
              <Plus className="w-4 h-4 mr-2" /> Formulário Geral
            </Button>
            <Button type="button" className="justify-start" variant="secondary" onClick={() => addExpenseOfType('servico_pf')}>
              <Plus className="w-4 h-4 mr-2" /> Prestação de Serviço PF
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChooseTypeOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => !open && closeConfirm()}
        title="Confirmar ação"
        description="Tem certeza que deseja executar esta ação? Esta ação não pode ser desfeita."
        confirmLabel="Confirmar"
        confirmVariant="destructive"
        onConfirm={execConfirm}
      />
    </div>
  );
}
