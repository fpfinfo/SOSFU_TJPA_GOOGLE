
import React, { useState, useEffect, useCallback } from "react";
import { SolicitacaoSuprimento } from "@/api/entities";
import { Reembolso } from "@/api/entities"; // Adicionado Reembolso
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "../components/status/StatusBadge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FileText,
  Clock,
  CheckCircle,
  Plus,
  Eye,
  MessageCircle,
  TrendingUp,
  Search // Adicionado Search para o filtro
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCurrentUser } from "@/components/utils/UserContext"; // adicionado
import { Input } from "@/components/ui/input"; // Adicionado Input
import { exportToCSV } from "@/components/utils/exportUtils"; // Path corrected
import { formatDateBR } from "@/components/utils/dateUtils"; // Adicionado para formatação de data
// import { usePolling } from "@/components/utils/usePolling"; // Removido usePolling
import {
  ResponsiveContainer,
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from "recharts";
import { useAppToasts } from "@/components/utils/toastUtils";

export default function Dashboard() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [reembolsos, setReembolsos] = useState([]); // Adicionado estado para reembolsos
  const [userState, setUserState] = useState(null); // mantém compatibilidade
  // Ajuste: loading inicia como false para não travar a UI antes do usuário estar disponível
  const [loading, setLoading] = useState(false);
  const [reembolsoSearch, setReembolsoSearch] = useState(""); // Novo estado para busca
  const [reembolsoStatus, setReembolsoStatus] = useState("all"); // Novo estado para filtro de status

  const ctxUser = useCurrentUser(); // contexto
  const toasts = useAppToasts();

  // NEW: guards para evitar múltiplas chamadas simultâneas
  const lastLoadedEmailRef = React.useRef(null);
  const inFlightRef = React.useRef(false);

  useEffect(() => {
    setUserState(ctxUser || null);
  }, [ctxUser]);

  // Atualizado: loadAll recebe o usuário explicitamente e nunca deixa loading travado
  const loadAll = useCallback(async (user) => {
    if (!user) {
      // Usuário ainda não disponível — não manter loading=true
      setLoading(false);
      setSolicitacoes([]);
      setReembolsos([]);
      return;
    }
    setLoading(true);
    try {
      let solicitacoesData;
      if (user.role === 'admin') {
        solicitacoesData = await SolicitacaoSuprimento.list('-created_date');
      } else {
        solicitacoesData = await SolicitacaoSuprimento.filter(
          { created_by: user.email },
          '-created_date'
        );
      }
      setSolicitacoes(solicitacoesData);

      // Reembolsos
      let reembolsosData;
      if (user.role === 'admin') {
        reembolsosData = await Reembolso.list('-created_date');
      } else {
        reembolsosData = await Reembolso.filter({ created_by: user.email }, '-created_date');
      }
      setReembolsos(reembolsosData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toasts.error("Falha ao carregar dados", "Tente novamente em alguns segundos.");
    } finally {
      setLoading(false);
    }
  }, [toasts]);

  // UPDATED: dispara carga apenas 1x por usuário e evita paralelismo
  useEffect(() => {
    const user = ctxUser;
    if (!user?.email) {
      // sem usuário disponível: não force loading=true
      setLoading(false);
      return;
    }
    // Evita repetir chamada se já carregado para este usuário
    if (lastLoadedEmailRef.current === user.email) return;
    // Evita concorrência
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setLoading(true);
    // Use Promise.resolve to wrap the async call and ensure finally is always called
    // or directly await and use try/finally within this useEffect if prefered,
    // but the current loadAll already handles its own loading state.
    // The main point here is to guard the *initiation* of loadAll.
    loadAll(user).finally(() => {
        inFlightRef.current = false;
        lastLoadedEmailRef.current = user.email;
    });
  }, [ctxUser, loadAll]);

  // Removido polling automático para evitar problemas nos módulos admin

  const getSuprimentoStats = () => {
    const rascunho = solicitacoes.filter(s => s.status === 'rascunho').length;
    const pendentes = solicitacoes.filter(s => s.status === 'pendente').length;
    const emAnalise = solicitacoes.filter(s => s.status === 'em_analise').length;
    const aprovadas = solicitacoes.filter(s => s.status === 'aprovado').length;
    const pagas = solicitacoes.filter(s => s.status === 'pago').length;
    const confirmadas = solicitacoes.filter(s => s.status === 'confirmado').length;
    const totalValor = solicitacoes.reduce((sum, s) => sum + (s.valor_solicitado || 0), 0);

    return {
      rascunho,
      pendentes,
      emAnalise,
      aprovadas,
      pagas,
      confirmadas,
      total: solicitacoes.length,
      totalValor
    };
  };

  const getReembolsoStats = () => {
    const total = reembolsos.length;
    const pendentes = reembolsos.filter(r => r.status === 'pendente').length;
    const emAnalise = reembolsos.filter(r => r.status === 'em_analise').length;
    const aprovados = reembolsos.filter(r => r.status === 'aprovado').length;
    const glosados = reembolsos.filter(r => r.status === 'glosa').length;
    const concluidos = reembolsos.filter(r => r.status === 'concluido').length;
    const totalValor = reembolsos.reduce((sum, r) => sum + (r.valor_total_comprovado || 0), 0);
    return { total, pendentes, emAnalise, aprovados, glosados, concluidos, totalValor };
  };

  const getPerformanceMetrics = () => {
    const now = new Date();
    // Calculate 30 days ago from the current moment
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const solicitacoesRecentes = solicitacoes.filter(s =>
      s.created_date && new Date(s.created_date) >= thirtyDaysAgo
    );

    let totalDaysForAnalysis = 0;
    let countForAnalysis = 0;

    solicitacoes.forEach(s => {
      if (s.created_date && s.data_analise && s.status !== 'rascunho') {
        const creationDate = new Date(s.created_date);
        const analysisDate = new Date(s.data_analise);

        // Ensure analysis date is after creation date to get a positive duration
        if (analysisDate >= creationDate) {
          const diffTime = analysisDate.getTime() - creationDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
          totalDaysForAnalysis += diffDays;
          countForAnalysis++;
        }
      }
    });

    const tempoMedioAnalise = countForAnalysis > 0 ? totalDaysForAnalysis / countForAnalysis : 0;

    return {
      solicitacoesNoMes: solicitacoesRecentes.length,
      tempoMedioAnalise: Math.round(tempoMedioAnalise) || 0
    };
  };

  const suprimentoStats = getSuprimentoStats();
  const reembolsoStats = getReembolsoStats(); // Chamada para stats de reembolso
  const metrics = getPerformanceMetrics();

  // Helpers para gráficos (admin)
  const COLORS = ["#6366F1","#22C55E","#F59E0B","#EF4444","#06B6D4","#A855F7","#84CC16"];
  const statusDistSolic = React.useMemo(() => {
    const counts = {};
    solicitacoes.forEach(s => { counts[s.status || "indefinido"] = (counts[s.status || "indefinido"] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [solicitacoes]);

  const statusDistReemb = React.useMemo(() => {
    const counts = {};
    reembolsos.forEach(r => { counts[r.status || "indefinido"] = (counts[r.status || "indefinido"] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reembolsos]);

  const monthlySeries = (items, dateField = "created_date", label = "Quantidade") => {
    // últimos 6 meses incluindo o atual
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`, label: `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`, value: 0 });
    }
    items.forEach(it => {
      const raw = it[dateField];
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const b = buckets.find(b => b.key === key);
      if (b) b.value += 1;
    });
    return buckets.map(b => ({ name: b.label, [label]: b.value }));
  };

  const serieSolic = React.useMemo(() => monthlySeries(solicitacoes, "created_date", "Solicitações"), [solicitacoes]);
  const serieReemb = React.useMemo(() => monthlySeries(reembolsos, "created_date", "Reembolsos"), [reembolsos]);

  // Exportações (admin)
  const exportSolicitacoesCSV = () => {
    const rows = solicitacoes.map(s => ({
      id: s.id,
      numero_solicitacao: s.numero_solicitacao,
      data_solicitacao: s.data_solicitacao,
      nome_servidor: s.nome_servidor,
      cpf: s.cpf,
      valor_solicitado: s.valor_solicitado,
      status: s.status,
      created_by: s.created_by,
      created_date: s.created_date,
      updated_date: s.updated_date
    }));
    exportToCSV("solicitacoes.csv", rows);
    toasts.info("Exportação iniciada", "Arquivo solicitacoes.csv gerado.");
  };

  const exportReembolsosCSV = () => {
    const rows = reembolsos.map(r => ({
      id: r.id,
      protocolo: r.protocolo,
      data_reembolso: r.data_reembolso,
      valor_total_comprovado: r.valor_total_comprovado,
      status: r.status,
      created_by: r.created_by,
      created_date: r.created_date,
      updated_date: r.updated_date
    }));
    exportToCSV("reembolsos.csv", rows);
    toasts.info("Exportação iniciada", "Arquivo reembolsos.csv gerado.");
  };

  // Derivados para filtros locais da lista de Reembolsos Recentes
  const reembolsosFiltrados = reembolsos.filter((r) => {
    const statusOk = reembolsoStatus === "all" || r.status === reembolsoStatus;
    const termo = reembolsoSearch.trim().toLowerCase();
    const buscaOk =
      termo === "" ||
      (r.protocolo || "").toLowerCase().includes(termo) ||
      (r.created_by || "").toLowerCase().includes(termo);
    return statusOk && buscaOk;
  });


  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => ( // Adjusted array size
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {userState?.role === 'admin' ? 'Visão geral do sistema' : 'Suas solicitações'}
          </p>
        </div>
        {userState?.role !== 'admin' && (
          <div className="flex gap-3">
            <Link to={createPageUrl("NovoSuprimento")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Solicitação
              </Button>
            </Link>
            {/* Botão rápido para novo reembolso */}
            <Link to={createPageUrl("NovoReembolso")}>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Novo Reembolso
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Métricas de Desempenho */}
      {userState?.role === 'admin' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Métricas de Desempenho
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-none shadow-lg bg-gradient-to-r from-indigo-50 to-indigo-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-800 text-sm font-medium">Solicitações (30 dias)</p>
                    <p className="text-2xl font-bold text-indigo-900">{metrics.solicitacoesNoMes}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-r from-teal-50 to-teal-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-800 text-sm font-medium">Tempo Médio Análise</p>
                    <p className="text-2xl font-bold text-teal-900">{metrics.tempoMedioAnalise} dias</p>
                  </div>
                  <Clock className="w-8 h-8 text-teal-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Relatórios Visuais (Admin) */}
      {userState?.role === 'admin' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Relatórios Visuais</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle>Evolução de Solicitações (últimos 6 meses)</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serieSolic}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Solicitações" stroke="#6366F1" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle>Evolução de Reembolsos (últimos 6 meses)</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serieReemb}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Reembolsos" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle>Distribuição por Status (Solicitações)</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDistSolic} dataKey="value" nameKey="name" fill="#8884d8" outerRadius={80} label>
                      {statusDistSolic.map((entry, index) => <Cell key={`c-s-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle>Distribuição por Status (Reembolsos)</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDistReemb} dataKey="value" nameKey="name" outerRadius={80} label>
                      {statusDistReemb.map((entry, index) => <Cell key={`c-r-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Stats Cards - Suprimento */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Suprimento de Fundos
          <Badge variant="outline" className="ml-2">
            {suprimentoStats.totalValor.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}
          </Badge>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-none shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800 text-sm font-medium">Rascunhos</p>
                  <p className="text-2xl font-bold text-gray-900">{suprimentoStats.rascunho}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-800 text-sm font-medium">Pendentes</p>
                  <p className="text-2xl font-bold text-blue-900">{suprimentoStats.pendentes}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-r from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-800 text-sm font-medium">Em Análise</p>
                  <p className="text-2xl font-bold text-yellow-900">{suprimentoStats.emAnalise}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 text-sm font-medium">Aprovadas</p>
                  <p className="text-2xl font-bold text-green-900">{suprimentoStats.aprovadas}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-r from-emerald-50 to-emerald-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-800 text-sm font-medium">Pagas</p>
                  <p className="text-2xl font-bold text-emerald-900">{suprimentoStats.pagas}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-r from-emerald-50 to-emerald-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-800 text-sm font-medium">Confirmadas</p>
                  <p className="text-2xl font-bold text-emerald-900">{suprimentoStats.confirmadas}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Cards - Reembolsos */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Reembolsos
          <Badge variant="outline" className="ml-2">
            {reembolsoStats.totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Badge>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-none shadow-lg bg-gradient-to-r from-blue-50 to-blue-100"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-blue-800 text-sm font-medium">Pendentes</p><p className="text-2xl font-bold text-blue-900">{reembolsoStats.pendentes}</p></div><FileText className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
          <Card className="border-none shadow-lg bg-gradient-to-r from-amber-50 to-amber-100"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-amber-800 text-sm font-medium">Em Análise</p><p className="text-2xl font-bold text-amber-900">{reembolsoStats.emAnalise}</p></div><FileText className="w-8 h-8 text-amber-600" /></div></CardContent></Card>
          <Card className="border-none shadow-lg bg-gradient-to-r from-green-50 to-green-100"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-green-800 text-sm font-medium">Aprovados</p><p className="text-2xl font-bold text-green-900">{reembolsoStats.aprovados}</p></div><FileText className="w-8 h-8 text-green-600" /></div></CardContent></Card>
          <Card className="border-none shadow-lg bg-gradient-to-r from-red-50 to-red-100"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-red-800 text-sm font-medium">Glosados</p><p className="text-2xl font-bold text-red-900">{reembolsoStats.glosados}</p></div><FileText className="w-8 h-8 text-red-600" /></div></CardContent></Card>
          <Card className="border-none shadow-lg bg-gradient-to-r from-emerald-50 to-emerald-100"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-emerald-800 text-sm font-medium">Concluidos</p><p className="text-2xl font-bold text-emerald-900">{reembolsoStats.concluidos}</p></div><FileText className="w-8 h-8 text-emerald-600" /></div></CardContent></Card>
          <Card className="border-none shadow-lg bg-gradient-to-r from-purple-50 to-purple-100"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-purple-800 text-sm font-medium">Total</p><p className="text-2xl font-bold text-purple-900">{reembolsos.length}</p></div><FileText className="w-8 h-8 text-purple-600" /></div></CardContent></Card>
        </div>
      </div>

      {/* Ações Rápidas (Admin) */}
      {userState?.role === 'admin' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="flex flex-wrap gap-3">
            <Link to={createPageUrl("GestaoINSS")}><Button variant="outline">Gestão INSS</Button></Link>
            <Link to={createPageUrl("GerenciarComarcas")}><Button variant="outline">Gerenciar Comarcas</Button></Link>
            <Link to={createPageUrl("GerenciarUsuarios")}><Button variant="outline">Gerenciar Usuários</Button></Link>
            <Link to={createPageUrl("ImportarDados")}><Button variant="outline">Importar Dados (CSV)</Button></Link>
            <Link to={createPageUrl("GerenciarFAQ")}><Button variant="outline">Gerenciar FAQ</Button></Link>
            <Link to={createPageUrl("GerenciarManual")}><Button variant="outline">Gerenciar Manual</Button></Link>
            <Button variant="outline" onClick={exportSolicitacoesCSV}>Exportar Solicitações (CSV)</Button>
            <Button variant="outline" onClick={exportReembolsosCSV}>Exportar Reembolsos (CSV)</Button>
          </div>
        </div>
      )}

      {/* Recent Items */}
      <div className="grid lg:grid-cols-1 gap-8">
        {/* Recent Solicitações */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Solicitações Recentes
              </CardTitle>
              <Link to={createPageUrl(userState?.role === 'admin' ? "AnaliseSuprimento" : "MinhasSolicitacoes")}>
                <Button variant="outline" size="sm">Ver todas</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {solicitacoes.slice(0, 5).map((solicitacao) => (
                <div key={solicitacao.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{solicitacao.numero_solicitacao}</p>
                      <p className="text-sm text-gray-600">{solicitacao.nome_servidor}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        R$ {solicitacao.valor_solicitado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDateBR(solicitacao.data_solicitacao)}
                      </p>
                    </div>

                    <StatusBadge status={solicitacao.status} />

                    <div className="flex gap-2">
                      <Link to={createPageUrl(`DetalheSolicitacao?id=${solicitacao.id}`)}>
                        <Button variant="outline" size="sm" title="Ver Detalhes">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link to={createPageUrl(`Chat?id=${solicitacao.id}`)}>
                        <Button variant="outline" size="sm" title="Abrir Chat">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {solicitacoes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma solicitação encontrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reembolsos */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Reembolsos Recentes
              </CardTitle>
              <Link to={createPageUrl(userState?.role === 'admin' ? "AnaliseReembolso" : "MeusReembolsos")}>
                <Button variant="outline" size="sm">Ver todas</Button>
              </Link>
            </div>

            {/* Filtros locais para lista de reembolsos */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por protocolo ou criador..."
                  value={reembolsoSearch}
                  onChange={(e) => setReembolsoSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                className="border rounded px-3 py-2"
                value={reembolsoStatus}
                onChange={(e) => setReembolsoStatus(e.target.value)}
              >
                <option value="all">Todos status</option>
                <option value="rascunho">Rascunho</option>
                <option value="pendente">Pendente</option>
                <option value="em_analise">Em Análise</option>
                <option value="aprovado">Aprovado</option>
                <option value="glosa">Glosa</option>
                <option value="rejeitado">Rejeitado</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reembolsosFiltrados.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{r.protocolo}</p>
                      <p className="text-sm text-gray-600">
                        {r.data_reembolso ? formatDateBR(r.data_reembolso) : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {(r.valor_total_comprovado || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>

                    <StatusBadge status={r.status} />

                    <div className="flex gap-2">
                      <Link to={createPageUrl(`DetalheReembolso?id=${r.id}`)}>
                        <Button variant="outline" size="sm" title="Ver Detalhes">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      {/* Mantemos o Chat apenas se desejar ativar aqui futuramente */}
                    </div>
                  </div>
                </div>
              ))}
              {reembolsosFiltrados.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum reembolso encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
