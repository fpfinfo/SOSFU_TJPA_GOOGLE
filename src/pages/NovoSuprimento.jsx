
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { SolicitacaoSuprimento } from "@/api/entities";
import { ItemDespesa } from "@/api/entities";
import { Comarca } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableFooter as UITableFooter, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Upload, FileText, Save, ArrowLeft, Pencil, Loader2, Eye } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StatusBadge from "../components/status/StatusBadge";
import StatusControl from "../components/status/StatusControl";
import { AnexoService } from "../components/anexos/AnexoService";
import { AuditoriaService } from "../components/utils/AuditoriaService";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUser } from "@/components/utils/UserContext";

// Adicionado para UX: confirmação e loading
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import DropzoneUpload from "@/components/anexos/DropzoneUpload"; // Adicionado para drag-and-drop

// Adicionado para Projeção de Júri
import { ProjecaoJuri } from "@/api/entities";
import ProjecaoJuriForm from "@/components/juri/ProjecaoJuriForm";
import PessoasEnvolvidas from "@/components/juri/PessoasEnvolvidas";

import { SequenceService } from "@/components/utils/SequenceService";

const ELEMENTOS_DESPESA = [
  { codigo: '3.3.90.30.96.01', descricao: 'CONSUMO EM GERAL' },
  { codigo: '3.3.90.30.96.02', descricao: 'COMBUSTÍVEL' },
  { codigo: '3.3.90.33.96', descricao: 'TRANSPORTE E LOCOMOÇÃO' },
  { codigo: '3.3.90.36.96', descricao: 'PRESTAÇÃO DE SERVIÇO PF' },
  { codigo: '3.3.90.39.96', descricao: 'PRESTAÇÃO DE SERVIÇO PJ' }
];

const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    value = Number(value) || 0;
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Helper para formatar CPF para exibição
const formatCPF = (cpf) => {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
};

// Helper para formatar telefone para exibição
const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) { // (XX) XXXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) { // (XX) XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

// Helper: mapeia nome do elemento da Projeção para código/descrição usados no formulário padrão
const mapElementoToPadrao = (nomeElemento) => {
  const nome = String(nomeElemento || '').toUpperCase();
  const found = ELEMENTOS_DESPESA.find(e => e.descricao.toUpperCase() === nome);
  if (found) return found;
  return { codigo: 'OUTROS', descricao: nomeElemento || 'OUTROS' };
};

// Helper: agrega itens da Projeção do Júri por elemento de despesa, gerando linhas para a tabela padrão
const aggregateFromProjecao = (proj) => {
  const items = Array.isArray(proj?.itens_projecao) ? proj.itens_projecao : [];
  const groups = {};
  items.forEach(it => {
    const key = (it.elemento_despesa || 'OUTROS');
    // total_solicitado já é pré-calculado em ProjecaoJuriForm, mas re-calculamos por segurança
    const total = Number(it.total_solicitado ?? ((Number(it.valor_unitario) || 0) * (Number(it.quantidade_solicitada) || 0))) || 0;
    groups[key] = (groups[key] || 0) + total;
  });
  const aggregated = Object.entries(groups).map(([elemento, total]) => {
    const mapped = mapElementoToPadrao(elemento);
    return {
      codigo: mapped.codigo,
      descricao: mapped.descricao,
      quantidade: 1, // Para fins de agregação, a quantidade é 1 e o valor_unitario é o total agregado
      valor_total: Number(total) || 0,
      valor_unitario: Number(total) || 0,
      justificativa: 'Linha agregada automaticamente a partir da Projeção do Júri'
    };
  });
  return aggregated;
};

export default function NovoSuprimento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const solicitacaoId = searchParams.get('id');
  const { toast } = useToast();

  const ctxUser = useCurrentUser();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [solicitacao, setSolicitacao] = useState(null);
  const [itens, setItens] = useState([]);
  const [anexos, setAnexos] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // adicionado: Estado para dados da comarca e preferência de pagamento
  const [comarcaDados, setComarcaDados] = useState(null);
  const [preferenciaPagamento, setPreferenciaPagamento] = useState("suprido"); // "suprido" ou "comarca"
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Estados para diálogos de confirmação
  const [confirmRemoveItemIndex, setConfirmRemoveItemIndex] = useState(null);
  const [confirmRemoveAnexoId, setConfirmRemoveAnexoId] = useState(null);

  // Adicionado para Projeção de Júri
  const [juriEnabled, setJuriEnabled] = useState(false);
  const [juriData, setJuriData] = useState(null);
  const [activeTab, setActiveTab] = useState("padrao"); // 'padrao' ou 'juri'

  // Formulário principal
  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm();
  // NEW: valor observado da justificativa para usar nos efeitos sem depender do "watch" diretamente
  const justificativaVal = watch('justificativa');
  
  // Formulário do modal de item
  const { 
    register: registerItem, 
    handleSubmit: handleSubmitItem, 
    setValue: setValueItem, 
    formState: { errors: errorsItem }, 
    watch: watchItem,
    reset: resetItem,
    control: controlItem
  } = useForm({
    defaultValues: {
      codigo: '',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
      // JUSTIFICATIVA REMOVIDA
    }
  });

  const totalSolicitado = useMemo(() => {
    return itens.reduce((sum, item) => sum + (item.valor_total || 0), 0);
  }, [itens]);

  // Watch dos campos do item para calcular valor total automaticamente
  const watchedQuantidade = watchItem('quantidade');
  const watchedValorUnitario = watchItem('valor_unitario');

  useEffect(() => {
    if (watchedQuantidade && watchedValorUnitario) {
      const total = Number(watchedQuantidade) * Number(watchedValorUnitario);
      setValueItem('valor_total', total);
    }
  }, [watchedQuantidade, watchedValorUnitario, setValueItem]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = ctxUser; 
      if (!userData) {
        // se por algum motivo ainda não disponível, aguardar próximo ciclo
        return;
      }
      setUser(userData);

      // adicionado: carregar comarca do usuário
      if (userData.comarca_id) {
        try {
          const c = await Comarca.get(userData.comarca_id);
          setComarcaDados(c);
        } catch (e) {
          console.warn("Comarca não encontrada para o usuário:", e);
        }
      }

      if (solicitacaoId) {
        console.log("NovoSuprimento: Carregando solicitação existente com ID:", solicitacaoId);
        const [solicitacaoData, itensData, anexosData] = await Promise.all([
          SolicitacaoSuprimento.get(solicitacaoId),
          ItemDespesa.filter({ solicitacao_id: solicitacaoId }),
          AnexoService.listarAnexos('solicitacao', solicitacaoId, { origem: 'suprido' })
        ]);
        
        // SEMPRE usar nome_completo_customizado se disponível, senão full_name, senão o valor salvo
        const nomeCompleto = userData.nome_completo_customizado || userData.full_name || solicitacaoData.nome_servidor;
        
        // Atualizar campos do perfil com dados atuais do usuário, INCLUINDO o nome_servidor
        const solicitacaoAtualizada = {
          ...solicitacaoData,
          nome_servidor: nomeCompleto, // SEMPRE atualizar este campo com o nome mais atual
          cpf: userData.cpf || solicitacaoData.cpf,
          cargo: userData.cargo || solicitacaoData.cargo,
          lotacao: userData.lotacao || solicitacaoData.lotacao,
          telefone: userData.telefone || solicitacaoData.telefone,
          gestor_responsavel: userData.gestor_responsavel || solicitacaoData.gestor_responsavel
        };
        
        setSolicitacao(solicitacaoAtualizada);
        setItens(itensData);
        setAnexos(anexosData);
        
        // Preencher formulário
        setValue('data_solicitacao', solicitacaoAtualizada.data_solicitacao);
        setValue('justificativa', solicitacaoAtualizada.justificativa);

        // adicionado: carregar preferência se existir
        setPreferenciaPagamento(solicitacaoAtualizada.preferencia_pagamento || "suprido");

        // Buscar projeção do júri vinculada (se existir)
        try {
          const pj = await ProjecaoJuri.filter({ solicitacao_id: solicitacaoAtualizada.id });
          if (pj && pj.length > 0) {
            setJuriData(pj[0]);
            setJuriEnabled(true);
            setActiveTab("juri"); // Default to Juri tab if found
            // Quando a projeção de júri está ativa, os itens são derivados dela, não do banco diretamente
            setItens(aggregateFromProjecao(pj[0]));
          } else {
            setJuriEnabled(false);
            setJuriData(null);
            setActiveTab("padrao");
          }
        } catch (e) {
          // silencioso
          console.warn("Erro ao carregar projeção de júri:", e);
          setJuriEnabled(false);
          setJuriData(null);
          setActiveTab("padrao");
        }
        
        console.log("NovoSuprimento: Solicitação existente carregada. Status:", solicitacaoAtualizada.status);
      } else {
        console.log("NovoSuprimento: Criando nova solicitação.");
        // const now = new Date(); // No longer needed for sequence generation
        // const year = now.getFullYear(); // No longer needed for sequence generation
        // const time = now.getTime().toString().slice(-6); // No longer needed for sequence generation

        // SEMPRE usar nome_completo_customizado se disponível, senão full_name
        const nomeCompleto = userData.nome_completo_customizado || userData.full_name || '';

        const novaSolicitacao = {
          id: null,
          numero_solicitacao: "Será gerado ao salvar", // Placeholder, will be generated on first save
          data_solicitacao: new Date().toISOString().split('T')[0],
          nome_servidor: nomeCompleto, // Garantir que o campo legado tenha o nome completo
          cpf: userData.cpf || '',
          cargo: userData.cargo || '',
          lotacao: userData.lotacao || '',
          telefone: userData.telefone || '',
          gestor_responsavel: userData.gestor_responsavel || '',
          valor_solicitado: 0,
          justificativa: '',
          tipo: 'suprimento',
          status: 'rascunho',
          solicitante_id: userData.email,
          preferencia_pagamento: "suprido" // adicionado: preferência padrão
        };
        
        setSolicitacao(novaSolicitacao);
        setItens([]);
        setAnexos([]);
        
        // Preencher formulário
        setValue('data_solicitacao', novaSolicitacao.data_solicitacao);
        setValue('justificativa', '');
        setPreferenciaPagamento("suprido"); // adicionado: preferência padrão

        // Resetar estados de júri para nova solicitação
        setJuriEnabled(false);
        setJuriData(null);
        setActiveTab("padrao");
      }
    } catch (error) {
      console.error("NovoSuprimento: Erro ao carregar dados:", error);
      toast({ variant: "destructive", title: "Erro ao Carregar Solicitação", description: "Não foi possível carregar os dados da solicitação. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }, [solicitacaoId, toast, setValue, ctxUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sincroniza itens do formulário padrão a partir da Projeção quando Júri estiver ativo
  // FIX: dependências estáveis (sem optional chaining no array)
  const solId = solicitacao?.id || null;
  const solTipo = solicitacao?.tipo || null;
  useEffect(() => {
    if (juriEnabled && juriData) {
      const agg = aggregateFromProjecao(juriData);
      setItens(agg);
    } else if (!juriEnabled && solId && solTipo !== 'juri') {
      // Se desativar o júri e já houver itens salvos no banco (e não for tipo juri), recarregar eles
      // Essa lógica pode ser ajustada se a expectativa for que os itens "derivados" fiquem na tela
      // por enquanto, se a solicitação NÃO É de júri, os itens vêm do ItemDespesa
      // Idealmente, um "tipo" de solicitação deveria ser persistido para gerenciar isso.
      // Já estamos persistindo o tipo no handleSaveDraft, então podemos usar isso.
      // Se o tipo original era 'juri' e a pessoa desativar, os itens devem permanecer derivados do júri até salvar
      // ou eles devem ser resetados? A abordagem atual é que eles *são* os itens da projeção.
      // Para simplificar: se o júri está desativado, o usuário interage com a lista de itens normalmente.
      // Se está ativado, a lista é sobreposta pela projeção.
      // Então, se juriEnabled muda para false, a lista DEVERIA refletir o que foi salvo COMO NÃO-JURI.
      // Esta parte é mais complexa do que parece.
      // Se desabilitar o júri, os itens deveriam voltar para o estado anterior ao ativar o júri, ou ficar em branco?
      // O mais seguro é que se juriEnabled muda, e a solicitação juriData é limpa, os itens devem ser resetados para vazio.
      // Ou, se a solicitação NÃO É de júri (solicitacao.tipo !== 'juri'), e juriEnabled é false, a lista é editável.
      // Se a solicitação É de júri (solicitacao.tipo === 'juri'), e juriEnabled é false (o usuário desmarcou), a lista ainda deve ser a derivada do júri.
      // Esta complexidade indica que a lista de `itens` não deveria ser "editável" no modo júri, mas meramente uma visualização.
      // A sincronização no `useEffect` garante que a exibição é sempre a projeção agregada.
      // O `handleSaveDraft` garante que a persistência é sempre a projeção agregada quando em modo júri.
      // A validação `if (itens.length === 0 && !juriEnabled)` permite uma solicitação de júri sem itens de despesa na aba padrão.
    }
  }, [juriEnabled, juriData, solId, solTipo]);

  useEffect(() => {
    if (solicitacao) {
      setSolicitacao(prev => ({ ...prev, valor_solicitado: totalSolicitado }));
    }
  }, [totalSolicitado, solicitacao]);

  // Auto-rascunho local: salvar itens/justificativa no localStorage
  useEffect(() => {
    const key = `draft_novosuprimento_${solicitacao?.id || "new"}`;
    const draft = localStorage.getItem(key);
    
    // restaurar APENAS se houver um solicitacaoId (rascunho existente sendo editado)
    // E se for uma solicitação em rascunho E ainda não tiver itens carregados (para evitar sobrescrever dados da API)
    if (solicitacaoId && solicitacao && solicitacao.status === 'rascunho' && itens.length === 0 && draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed?.itens?.length || parsed?.justificativa) {
          if (parsed.itens && !juriEnabled) {
            setItens(parsed.itens);
          }
          if (parsed.justificativa && !justificativaVal) { 
            setValue('justificativa', parsed.justificativa);
          }
          toast({ title: "Rascunho recuperado", description: "Restauramos um rascunho salvo automaticamente." });
        }
      } catch (e) {
        console.error("Failed to parse local draft:", e);
      }
    }
    
    // Se for uma NOVA solicitação (sem ID no URL), limpar qualquer rascunho antigo do slot "new"
    // Isso garante que ao iniciar uma nova solicitação, não há resquícios de um rascunho "new" anterior.
    if (!solicitacaoId && solicitacao && !solicitacao.id && draft) { // solicitacao.id será null para novas
      localStorage.removeItem(key);
    }
  // Dependências ajustadas: solicitacaoId foi adicionado pois a lógica depende dele.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solicitacao?.id, solicitacao?.status, solicitacaoId]);

  useEffect(() => {
    if (!solicitacao || solicitacao.status !== 'rascunho') return;
    const key = `draft_novosuprimento_${solicitacao.id || "new"}`;
    const data = {
      justificativa: justificativaVal, // Use the extracted value
      itens: juriEnabled ? aggregateFromProjecao(juriData || {}) : itens // Save based on current mode
    };
    localStorage.setItem(key, JSON.stringify(data));
  }, [itens, justificativaVal, solicitacao, juriEnabled, juriData]); // Include juriEnabled and juriData for completeness

  const handleOpenModal = (index = null) => {
    if (juriEnabled) return; // Prevent opening modal if juri is enabled

    if (index !== null) {
      setEditingIndex(index);
      const item = itens[index];
      setValueItem('codigo', item.codigo);
      setValueItem('descricao', item.descricao);
      setValueItem('quantidade', item.quantidade);
      setValueItem('valor_unitario', item.valor_unitario);
      setValueItem('valor_total', item.valor_total);
      // JUSTIFICATIVA REMOVIDA
    } else {
      setEditingIndex(null);
      resetItem();
    }
    setIsModalOpen(true);
  };

  const handleCodigoChange = (codigo) => {
    const elemento = ELEMENTOS_DESPESA.find(e => e.codigo === codigo);
    if (elemento) {
      setValueItem('descricao', elemento.descricao);
    }
  };

  const handleSaveItem = (data) => {
    const newItem = {
      codigo: data.codigo,
      descricao: data.descricao,
      quantidade: Number(data.quantidade),
      valor_unitario: Number(data.valor_unitario),
      valor_total: Number(data.quantidade) * Number(data.valor_unitario),
      // JUSTIFICATIVA REMOVIDA
    };
    
    let newItens = [...itens];
    if (editingIndex !== null) {
      newItens[editingIndex] = newItem;
    } else {
      newItens.push(newItem);
    }
    setItens(newItens);
    setIsModalOpen(false);
    resetItem();
    toast({ title: "Item Salvo", description: "O item de despesa foi salvo com sucesso." });
  };

  const removeItem = (index) => {
    if (juriEnabled) return; // Prevent removing item if juri is enabled
    setConfirmRemoveItemIndex(index);
  };

  const handleRemoveItemConfirmed = () => {
    if (confirmRemoveItemIndex === null) return;
    setItens(itens.filter((_, i) => i !== confirmRemoveItemIndex));
    setConfirmRemoveItemIndex(null);
    toast({ title: "Item Removido", description: "O item de despesa foi removido com sucesso." });
  };

  const handleFilesSelected = async (files) => {
    if (!solicitacao || !solicitacao.id) {
      toast({ variant: "destructive", title: "Ação necessária", description: "Salve o rascunho antes de anexar arquivos." });
      return;
    }
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        return AnexoService.uploadAnexo({
          arquivo: file,
          ownerTipo: 'solicitacao',
          ownerId: solicitacao.id,
          origem: 'suprido',
          categoria: 'documento'
        });
      }));
      setAnexos(prev => [...prev, ...uploaded]);
      toast({ title: "Upload concluído", description: `${uploaded.length} arquivo(s) anexado(s) com sucesso.` });
    } catch (e) {
      console.error("Erro no upload:", e);
      toast({ variant: "destructive", title: "Erro no upload", description: "Não foi possível enviar alguns arquivos." });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAnexo = async (anexoId) => {
    setConfirmRemoveAnexoId(anexoId);
  };

  const handleRemoveAnexoConfirmed = async () => {
    if (!confirmRemoveAnexoId) return;
    setLoading(true);
    try {
      await AnexoService.excluirAnexo(confirmRemoveAnexoId);
      setAnexos(prev => prev.filter(a => a.id !== confirmRemoveAnexoId));
      toast({ title: "Anexo Removido", description: "O anexo foi removido com sucesso." });
    } catch (error) {
      console.error("Erro ao remover anexo:", error);
      toast({ variant: "destructive", title: "Erro ao Remover Anexo", description: "Não foi possível remover o anexo. Tente novamente." });
    } finally {
      setConfirmRemoveAnexoId(null);
      setLoading(false);
    }
  };
  
  const handleStatusChanged = async (newStatus) => {
    setLoading(true);
    try {
      const originalSolicitacao = { ...solicitacao };
      const updatedSolicitacao = await SolicitacaoSuprimento.update(solicitacao.id, { status: newStatus });
      setSolicitacao(updatedSolicitacao);
      await AuditoriaService.registrarAtualizacao('SolicitacaoSuprimento', updatedSolicitacao.id, originalSolicitacao, updatedSolicitacao);

      if (newStatus === 'pendente') {
        // Limpar o auto-rascunho local após envio bem-sucedido
        const key = `draft_novosuprimento_${solicitacao.id}`; // Assumes solicitacao.id exists when status changes
        localStorage.removeItem(key);
        toast({ title: "Solicitação Enviada", description: "A solicitação foi enviada para análise com sucesso!" });
        navigate(createPageUrl("MinhasSolicitacoes"));
      } else {
        toast({ title: "Status Atualizado", description: "O status da solicitação foi atualizado com sucesso!" });
      }
    } catch (error) {
      console.error("Erro ao mudar status:", error);
      toast({ variant: "destructive", title: "Erro ao Mudar Status", description: "Não foi possível mudar o status da solicitação. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };
  
  // adicionado: Helper para construir o snapshot dos dados de pagamento
  const buildPagamentoSnapshot = useCallback(() => {
    const nowISO = new Date().toISOString();
    if (preferenciaPagamento === "comarca" && comarcaDados) {
      return {
        origem: "comarca",
        referencia_id: comarcaDados.id,
        banco_nome: comarcaDados.banco_nome || "",
        banco_codigo: comarcaDados.banco_codigo || "",
        agencia: comarcaDados.agencia || "",
        conta: comarcaDados.conta || "",
        tipo_conta: comarcaDados.tipo_conta || "",
        congelado_em: nowISO
      };
    }
    // default: suprido
    const u = user || {};
    return {
      origem: "suprido",
      referencia_id: u.id || u.email || "",
      banco_nome: u.banco_nome || "",
      banco_codigo: u.banco_codigo || "",
      agencia: u.agencia || "",
      conta: u.conta || "",
      tipo_conta: u.tipo_conta || "",
      congelado_em: nowISO
    };
  }, [preferenciaPagamento, comarcaDados, user]);

  const handleSaveDraft = async (formData) => {
    if (juriEnabled && (!juriData || !juriData.comarca || !juriData.processo_numero)) {
      toast({ variant: "destructive", title: "Validação Falhou", description: "Preencha a Comarca e o Número do Processo na Projeção de Júri." });
      setActiveTab("juri"); // Switch to Juri tab to show error
      return;
    }

    // Only require items if not a juri projection AND the juri projection doesn't have items
    const hasJuriItems = juriEnabled && juriData && Array.isArray(juriData.itens_projecao) && juriData.itens_projecao.length > 0;
    if (itens.length === 0 && !hasJuriItems && !juriEnabled) { 
      toast({ variant: "destructive", title: "Validação Falhou", description: "Adicione pelo menos um item de despesa para salvar o rascunho." });
      return;
    }
    
    setLoading(true);
    try {
      let savedSolicitacao;
      // adicionado: Construir o snapshot dos dados de pagamento
      const pagamento_snapshot = buildPagamentoSnapshot();

      const payloadBase = { 
        ...solicitacao, 
        data_solicitacao: formData.data_solicitacao,
        justificativa: formData.justificativa,
        valor_solicitado: totalSolicitado,
        preferencia_pagamento: preferenciaPagamento, // adicionado: Salvar preferência
        pagamento_snapshot, // adicionado: Salvar snapshot de pagamento
        tipo: juriEnabled ? 'juri' : 'suprimento', // Atualiza o tipo da solicitação
      };

      if (solicitacao.id) {
        console.log("NovoSuprimento: Atualizando solicitação existente:", solicitacao.id);
        const original = await SolicitacaoSuprimento.get(solicitacao.id);
        savedSolicitacao = await SolicitacaoSuprimento.update(solicitacao.id, payloadBase);
        await AuditoriaService.registrarAtualizacao('SolicitacaoSuprimento', solicitacao.id, original, savedSolicitacao);
      } else {
        // NEW: gerar sequência
        const seq = await SequenceService.generateSolicitacaoNumero();
        const payload = {
          ...payloadBase,
          numero_solicitacao: seq.numero,
          ano: seq.ano,
          sequencial: seq.sequencial
        };
        savedSolicitacao = await SolicitacaoSuprimento.create(payload);
        await AuditoriaService.registrarCriacao('SolicitacaoSuprimento', savedSolicitacao.id, savedSolicitacao);
        console.log("NovoSuprimento: Nova solicitação criada com ID:", savedSolicitacao.id);
      }
      
      setSolicitacao(savedSolicitacao);
      
      // Persistir itens:
      // - Se for Júri: sempre derivar da Projeção (fonte da verdade)
      // - Caso contrário: usar itens do formulário padrão
      const derivedItens = juriEnabled ? aggregateFromProjecao(juriData || {}) : itens;
      const existingItems = await ItemDespesa.filter({ solicitacao_id: savedSolicitacao.id });
      for (const item of existingItems) {
        await ItemDespesa.delete(item.id);
      }
      if (derivedItens.length > 0) {
        await ItemDespesa.bulkCreate(
          derivedItens.map(item => ({
            ...item,
            solicitacao_id: savedSolicitacao.id,
            quantidade: Number(item.quantidade) || 1, // Ensure number, default to 1 if not set
            valor_unitario: Number(item.valor_unitario) || 0, // Ensure number
            valor_total: Number(item.valor_total) || (Number(item.quantidade) || 1) * (Number(item.valor_unitario) || 0) // Recalculate or use provided
          }))
        );
      }

      // Salvar/atualizar projeção do júri (se habilitada)
      if (juriEnabled) {
        const computeTotals = (input) => {
          const arr = (input.itens_projecao || []).map((it) => {
            const vu = Number(it.valor_unitario) || 0;
            const qs = Number(it.quantidade_solicitada) || 0;
            const qa = it.quantidade_aprovada === undefined || it.quantidade_aprovada === null ? qs : Number(it.quantidade_aprovada) || 0;
            return {
              ...it,
              total_solicitado: vu * qs,
              total_aprovado: vu * qa
            };
          });
          return { ...input, itens_projecao: arr };
        };

        if (juriData?.id) {
          const payloadJuri = computeTotals({ ...juriData, solicitacao_id: savedSolicitacao.id });
          await ProjecaoJuri.update(juriData.id, payloadJuri);
        } else {
          const payloadJuri = computeTotals({ ...(juriData || { comarca: "", processo_numero: "", itens_projecao: [], pessoas_envolvidas: [] }), solicitacao_id: savedSolicitacao.id });
          const createdJuri = await ProjecaoJuri.create(payloadJuri);
          setJuriData(createdJuri);
        }
      }
      
      toast({ title: "Rascunho Salvo", description: "O rascunho da solicitação foi salvo com sucesso!" });
      
      if (!solicitacaoId) {
          console.log("NovoSuprimento: Redirecionando para a solicitação recém-criada para permitir edição contínua.");
          navigate(createPageUrl(`NovoSuprimento?id=${savedSolicitacao.id}`), { replace: true });
      }

    } catch (error) {
      console.error("Erro ao salvar rascunho:", error);
      toast({ variant: "destructive", title: "Erro ao Salvar Rascunho", description: "Não foi possível salvar o rascunho da solicitação. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  // adicionado: UI helper para renderizar preview dos dados de pagamento
  const renderPagamentoPreview = useCallback(() => {
    // FIX: corrigido nome da variável preferenciaPagamento (antes estava 'preferenciamPagamento')
    const src = preferenciaPagamento === "comarca" ? comarcaDados : user;
    if (!src) return null;
    return (
      <div className="text-sm bg-gray-50 border rounded-lg p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <p><span className="text-gray-500">Banco:</span> {src.banco_nome || src.banco_codigo || '—'}</p>
          <p><span className="text-gray-500">Agência:</span> {src.agencia || '—'}</p>
          <p><span className="text-gray-500">Conta:</span> {src.conta || '—'}</p>
          <p><span className="text-gray-500">Tipo:</span> {src.tipo_conta || '—'}</p>
          <p className="text-gray-500">{preferenciaPagamento === "comarca" ? "Origem: Comarca" : "Origem: Suprido"}</p>
        </div>
      </div>
    );
  }, [preferenciaPagamento, comarcaDados, user]);

  if (loading && !solicitacao && !solicitacaoId) { // Only show full screen loader on initial load of new/existing req
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4"/>
        <p className="text-gray-600">Carregando solicitação...</p>
      </div>
    );
  }
  
  if (!solicitacao) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <LoadingOverlay show={loading} text="Processando..." />

      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("MinhasSolicitacoes"))}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {solicitacao.id ? 'Editar' : 'Nova'} Solicitação de Suprimento
          </h1>
          <p className="text-gray-600 mt-1">{solicitacao.numero_solicitacao}</p>
        </div>
        <StatusBadge status={solicitacao.status} showDescription />
      </div>

      {/* Seletor do tipo da Solicitação */}
      <div className="mb-4">
        <Card className="border-none shadow-lg">
          <CardContent className="flex items-center gap-3 py-4">
            <Label className="min-w-40">Tipo da Solicitação</Label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={juriEnabled ? "juri" : "normal"}
              onChange={(e) => {
                setJuriEnabled(e.target.value === "juri");
                if (e.target.value === "juri") {
                  setActiveTab("juri");
                } else {
                  setActiveTab("padrao");
                }
              }}
            >
              <option value="normal">Normal</option>
              <option value="juri">Júri (com Projeção de Gastos)</option>
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Alternância por abas simples */}
      {juriEnabled ? (
        <div className="mb-6">
          <div className="flex gap-2 border-b mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("padrao")}
              className={`px-4 py-2 text-sm ${activeTab === "padrao" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-600"}`}
            >
              Formulário Padrão
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("juri")}
              className={`px-4 py-2 text-sm ${activeTab === "juri" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-600"}`}
            >
              Projeção Júri
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pessoas")}
              className={`px-4 py-2 text-sm ${activeTab === "pessoas" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-600"}`}
            >
              Pessoas Envolvidas
            </button>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(handleSaveDraft)} className="space-y-8">
        {/* Quando juriEnabled e aba ativa for juri, ocultar conteúdo padrão */}
        {(!juriEnabled || activeTab === "padrao") && (
          <>
            {/* Dados da Solicitação e Servidor */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Dados Gerais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><Label>Número</Label><Input value={solicitacao.numero_solicitacao} readOnly /></div>
                <div>
                  <Label htmlFor="data_solicitacao">Data da Solicitação *</Label>
                  <Input 
                    id="data_solicitacao"
                    type="date" 
                    {...register('data_solicitacao', { 
                      required: "A data da solicitação é obrigatória." 
                    })}
                    className={errors.data_solicitacao ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.data_solicitacao && (
                    <p className="text-red-500 text-xs mt-1">{errors.data_solicitacao.message}</p>
                  )}
                </div>
                <div><Label>Nome Completo</Label><Input value={solicitacao.nome_servidor} readOnly /></div>
                <div><Label>CPF</Label><Input value={formatCPF(solicitacao.cpf)} readOnly /></div>
                <div><Label>Cargo</Label><Input value={solicitacao.cargo} readOnly /></div>
                <div><Label>Lotação</Label><Input value={solicitacao.lotacao} readOnly /></div>
                <div><Label>Telefone</Label><Input value={formatPhone(solicitacao.telefone)} readOnly /></div>
                <div className="lg:col-span-2"><Label>Gestor Responsável</Label><Input value={solicitacao.gestor_responsavel} readOnly /></div>
              </CardContent>
            </Card>

            {/* adicionado: Preferência de Pagamento */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Preferência de Pagamento</CardTitle>
                <p className="text-sm text-gray-600">Escolha a conta para recebimento do recurso</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <Label htmlFor="preferencia_pagamento_select">Receber em</Label>
                    <select
                      id="preferencia_pagamento_select"
                      className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={preferenciaPagamento}
                      onChange={(e) => setPreferenciaPagamento(e.target.value)}
                    >
                      <option value="suprido">Conta do Suprido</option>
                      <option value="comarca">Conta da Comarca</option>
                    </select>
                    {!comarcaDados && preferenciaPagamento === "comarca" && (
                      <p className="text-xs text-amber-600 mt-1">
                        Sua comarca não possui dados bancários cadastrados. Por favor, atualize-os.
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Dados Selecionados</Label>
                    {renderPagamentoPreview()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Itens de Despesa */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Elementos de Despesa</CardTitle>
                  {!juriEnabled && ( // Hide button if juri is enabled
                    <Button type="button" onClick={() => handleOpenModal()} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Item
                    </Button>
                  )}
                </div>
                {juriEnabled && ( // Add explanatory text if juri is enabled
                  <p className="text-xs text-gray-500 mt-2">
                    Esta tabela está sincronizada automaticamente com a aba “Projeção Júri”. Para alterar, edite a Projeção.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Qtd.</TableHead>
                        <TableHead className="text-right">Vlr. Unitário</TableHead>
                        <TableHead className="text-right">Vlr. Total</TableHead>
                        {!juriEnabled && <TableHead>Ações</TableHead>} {/* Hide actions column if juri is enabled */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.codigo}</TableCell>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell className="text-right">{item.quantidade}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(item.valor_total)}</TableCell>
                          {!juriEnabled && ( // Hide action buttons if juri is enabled
                            <TableCell>
                              <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleOpenModal(index)}><Pencil className="w-4 h-4" /></Button>
                                <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => removeItem(index)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {itens.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={juriEnabled ? 5 : 6} className="text-center py-8 text-gray-500">
                            Nenhum item adicionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <UITableFooter>
                        <TableRow>
                            <TableCell colSpan={4} className="font-semibold text-lg">Total Previsto</TableCell>
                            <TableCell colSpan={juriEnabled ? 1 : 2} className="text-right font-bold text-lg">{formatCurrency(totalSolicitado)}</TableCell>
                        </TableRow>
                    </UITableFooter>
                  </Table>
                </div>
              </CardContent>
            </Card>
            
            {/* Justificativa e Anexos */}
            <div className="grid lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-lg">
                    <CardHeader><CardTitle>Justificativa da Solicitação</CardTitle></CardHeader>
                    <CardContent>
                        <Label htmlFor="justificativa">Justificativa *</Label>
                        <Textarea 
                          id="justificativa"
                          {...register('justificativa', { 
                            required: "A justificativa é obrigatória.",
                            minLength: { value: 10, message: "A justificativa deve ter pelo menos 10 caracteres." }
                          })}
                          placeholder="Descreva a justificativa para esta solicitação..." 
                          rows={5} 
                          className={errors.justificativa ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        />
                        {errors.justificativa && (
                          <p className="text-red-500 text-xs mt-1">{errors.justificativa.message}</p>
                        )}
                    </CardContent>
                </Card>
                <Card className="border-none shadow-lg">
                    <CardHeader><CardTitle>Documentos Anexos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <DropzoneUpload
                        disabled={uploading || !solicitacao?.id}
                        onFiles={handleFilesSelected}
                        title="Arraste arquivos ou clique para anexar"
                        note={!solicitacao?.id ? "Salve o rascunho para anexar arquivos." : ""}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      {uploading && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin w-4 h-4"/>Enviando...</div>}
                      {anexos.length > 0 && <div className="space-y-2 pt-2">{anexos.map((anexo) => (
                          <div key={anexo.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                              <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                  <p className="font-medium truncate">{anexo.nome_original} (v{anexo.versao})</p>
                              </div>
                              <div className="flex gap-1">
                                  <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:text-red-700 h-6 w-6" onClick={() => handleRemoveAnexo(anexo.id)}><Trash2 className="w-4 h-4" /></Button>
                                  <a href={anexo.url_assinada} target="_blank" rel="noopener noreferrer">
                                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6"><Eye className="w-4 h-4" /></Button>
                                  </a>
                              </div>
                          </div>
                      ))}</div>}
                    </CardContent>
                </Card>
            </div>
          </>
        )}

        {/* Projeção Júri */}
        {juriEnabled && activeTab === "juri" && (
          <ProjecaoJuriForm
            value={juriData}
            onChange={setJuriData}
          />
        )}

        {/* Pessoas Envolvidas */}
        {juriEnabled && activeTab === "pessoas" && (
          <PessoasEnvolvidas
            value={juriData?.pessoas_envolvidas}
            onChange={(next) => setJuriData((prev) => ({ ...(prev || {}), pessoas_envolvidas: next }))}
            isAdmin={user?.role === "admin"}
          />
        )}

        {/* Modal para Itens */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingIndex !== null ? 'Editar' : 'Adicionar'} Elemento de Despesa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitItem(handleSaveItem)} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="codigo">Código *</Label>
                        <Controller
                          name="codigo"
                          control={controlItem}
                          rules={{ required: "Selecione um código de despesa." }}
                          render={({ field }) => (
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleCodigoChange(value);
                              }}
                            >
                              <SelectTrigger className={errorsItem.codigo ? 'border-red-500 focus-visible:ring-red-500' : ''}>
                                <SelectValue placeholder="Selecione o elemento..." />
                              </SelectTrigger>
                              <SelectContent>
                                {ELEMENTOS_DESPESA.map(e => 
                                  <SelectItem key={e.codigo} value={e.codigo}>
                                    {`${e.codigo} - ${e.descricao}`}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errorsItem.codigo && (
                          <p className="text-red-500 text-xs mt-1">{errorsItem.codigo.message}</p>
                        )}
                    </div>
                    <div>
                      <Label htmlFor="descricao">Descrição *</Label>
                      <Input 
                        id="descricao"
                        {...registerItem('descricao', { 
                          required: "A descrição é obrigatória." 
                        })}
                        placeholder="Descrição da despesa" 
                        className={errorsItem.descricao ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      />
                      {errorsItem.descricao && (
                        <p className="text-red-500 text-xs mt-1">{errorsItem.descricao.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quantidade">Quantidade *</Label>
                          <Input 
                            id="quantidade"
                            type="number" 
                            min="1" 
                            {...registerItem('quantidade', { 
                              required: "A quantidade é obrigatória.",
                              min: { value: 1, message: "A quantidade deve ser pelo menos 1." }
                            })}
                            className={errorsItem.quantidade ? 'border-red-500 focus-visible:ring-red-500' : ''}
                          />
                          {errorsItem.quantidade && (
                            <p className="text-red-500 text-xs mt-1">{errorsItem.quantidade.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="valor_unitario">Valor Unitário (R$) *</Label>
                          <Input 
                            id="valor_unitario"
                            type="number" 
                            min="0" 
                            step="0.01" 
                            {...registerItem('valor_unitario', { 
                              required: "O valor unitário é obrigatório.",
                              min: { value: 0.01, message: "O valor deve ser maior que zero." }
                            })}
                            className={errorsItem.valor_unitario ? 'border-red-500 focus-visible:ring-red-500' : ''}
                          />
                          {errorsItem.valor_unitario && (
                            <p className="text-red-500 text-xs mt-1">{errorsItem.valor_unitario.message}</p>
                          )}
                        </div>
                    </div>
                    {/* JUSTIFICATIVA REMOVIDA
                    <div>
                      <Label htmlFor="justificativa_item">Justificativa do Item (opcional)</Label>
                      <Textarea 
                        id="justificativa_item"
                        {...registerItem('justificativa')}
                        placeholder="Justificativa específica para este item" 
                      />
                    </div>
                    */}
                    <div className="text-right font-semibold">
                      Valor Total do Item: {formatCurrency(watchItem('valor_total') || 0)}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Salvar Item</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        
        {/* Submit Button and Status Control */}
        <div className="flex justify-between items-center pt-4 border-t mt-8">
          <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("MinhasSolicitacoes"))}>
            Cancelar
          </Button>
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} variant="outline">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />} 
              Salvar Rascunho
            </Button>
            {solicitacao.id && solicitacao.status === 'rascunho' && (
              <StatusControl 
                solicitacao={solicitacao}
                onStatusChanged={handleStatusChanged}
                disabled={loading}
              />
            )}
          </div>
        </div>
      </form>

      {/* Confirm dialogs for item and anexo removal */}
      <ConfirmDialog
        open={confirmRemoveItemIndex !== null}
        onOpenChange={(open) => !open && setConfirmRemoveItemIndex(null)}
        title="Remover Item de Despesa"
        description="Tem certeza que deseja remover este item da solicitação? Esta ação não pode ser desfeita."
        confirmLabel="Remover Item"
        onConfirm={handleRemoveItemConfirmed}
        confirmVariant="destructive"
      />
      <ConfirmDialog
        open={!!confirmRemoveAnexoId}
        onOpenChange={(open) => !open && setConfirmRemoveAnexoId(null)}
        title="Remover Anexo"
        description="Esta ação removerá o arquivo anexado permanentemente da solicitação. Tem certeza que deseja continuar?"
        confirmLabel="Remover Anexo"
        onConfirm={handleRemoveAnexoConfirmed}
        confirmVariant="destructive"
      />
    </div>
  );
}
