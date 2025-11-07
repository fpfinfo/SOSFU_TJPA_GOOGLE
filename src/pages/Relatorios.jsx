
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { exportToCSV } from "@/components/utils/exportUtils";
import { useCurrentUser } from "@/components/utils/UserContext";
import { SolicitacaoSuprimento } from "@/api/entities";
import { ItemDespesa } from "@/api/entities";
import { PrestacaoContas } from "@/api/entities";
import { DespesaPrestacao } from "@/api/entities";
import { Reembolso } from "@/api/entities";
import { DespesaReembolso } from "@/api/entities";
import { Comarca } from "@/api/entities";
import { User } from "@/api/entities";
import {
  ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell
} from "recharts";
import { Loader2, BarChart3, FileDown } from "lucide-react";

// Lista padrão de elementos de despesa (código - descrição)
const ELEMENTOS_DESPESA = [
  { codigo: '3.3.90.30.96.01', descricao: 'CONSUMO EM GERAL' },
  { codigo: '3.3.90.30.96.02', descricao: 'COMBUSTÍVEL' },
  { codigo: '3.3.90.33.96', descricao: 'TRANSPORTE E LOCOMOÇÃO' },
  { codigo: '3.3.90.36.96', descricao: 'PRESTAÇÃO DE SERVIÇO PF' },
  { codigo: '3.3.90.39.96', descricao: 'PRESTAÇÃO DE SERVIÇO PJ' }
];

const COLORS = ["#6366F1","#22C55E","#F59E0B","#EF4444","#06B6D4","#A855F7","#84CC16","#EC4899"];

function fmtCurrency(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Relatorios() {
  const user = useCurrentUser();
  const [loading, setLoading] = useState(false);

  // filtros
  const [dtIni, setDtIni] = useState("");
  const [dtFim, setDtFim] = useState("");
  const [suprido, setSuprido] = useState("");
  const [comarcaId, setComarcaId] = useState("all");
  const [elem, setElem] = useState("all");
  const [tipos, setTipos] = useState({ suprimento: true, prestacao: true, reembolso: true });

  // bases
  const [comarcas, setComarcas] = useState([]);
  const [usersByEmail, setUsersByEmail] = useState({});

  // dados
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [itensSolic, setItensSolic] = useState([]); // ItemDespesa
  const [prestacoes, setPrestacoes] = useState([]);
  const [despesasPrest, setDespesasPrest] = useState([]);
  const [reembolsos, setReembolsos] = useState([]);
  const [despesasReemb, setDespesasReemb] = useState([]);

  // carga inicial
  useEffect(() => {
    if (!user || user.role !== "admin") return;
    const load = async () => {
      setLoading(true);
      const [cList, uList] = await Promise.all([
        Comarca.list(),
        User.list()
      ]);
      const usersMap = {};
      (uList || []).forEach(u => { usersMap[u.email] = u; });
      setComarcas([{ id: "all", nome: "Todas as comarcas" }, ...(cList || [])]);
      setUsersByEmail(usersMap);

      // Carrega dados principais (ordenados desc por created_date)
      const [s, p, r] = await Promise.all([
        SolicitacaoSuprimento.list("-created_date"),
        PrestacaoContas.list("-created_date"),
        Reembolso.list("-created_date")
      ]);
      setSolicitacoes(s || []);
      setPrestacoes(p || []);
      setReembolsos(r || []);

      // Carrega despesas relacionadas
      const [is, dp, dr] = await Promise.all([
        ItemDespesa.list(),
        DespesaPrestacao.list(),
        DespesaReembolso.list()
      ]);
      setItensSolic(is || []);
      setDespesasPrest(dp || []);
      setDespesasReemb(dr || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const asDate = (d) => d ? new Date(d) : null;

  // Convert helpers to stable callbacks to satisfy hook deps
  const inRange = useCallback((d) => {
    if (!d) return true;
    const dd = asDate(d);
    if (!dd || isNaN(dd.getTime())) return true;
    if (dtIni && dd < asDate(dtIni)) return false;
    if (dtFim && dd > asDate(dtFim)) return false;
    return true;
  }, [dtIni, dtFim]);

  const matchSuprido = useCallback((rec) => {
    const termo = suprido.trim().toLowerCase();
    if (!termo) return true;
    return (rec.nome_servidor || "").toLowerCase().includes(termo) || (rec.created_by || "").toLowerCase().includes(termo);
  }, [suprido]);

  const matchComarca = useCallback((email) => {
    if (comarcaId === "all") return true;
    const u = usersByEmail[email];
    return (u && u.comarca_id === comarcaId) || false;
  }, [comarcaId, usersByEmail]);

  const elemMatchInSolic = useCallback((solId) => {
    if (elem === "all") return true;
    return itensSolic.some(it => it.solicitacao_id === solId && it.codigo === elem);
  }, [elem, itensSolic]);

  const elemMatchInPrest = useCallback((prestId) => {
    if (elem === "all") return true;
    return despesasPrest.some(d => d.prestacao_id === prestId && d.categoria === elem);
  }, [elem, despesasPrest]);

  const elemMatchInReemb = useCallback((rebId) => {
    if (elem === "all") return true;
    return despesasReemb.some(d => d.reembolso_id === rebId && d.categoria === elem);
  }, [elem, despesasReemb]);

  // aplica filtros
  const filteredSolic = useMemo(() => {
    if (!tipos.suprimento) return [];
    return (solicitacoes || []).filter(s =>
      inRange(s.created_date) &&
      matchSuprido(s) &&
      matchComarca(s.created_by) &&
      elemMatchInSolic(s.id)
    );
  }, [tipos.suprimento, solicitacoes, inRange, matchSuprido, matchComarca, elemMatchInSolic]);

  const filteredPrest = useMemo(() => {
    if (!tipos.prestacao) return [];
    return (prestacoes || []).filter(p =>
      inRange(p.created_date) &&
      // vincula suprido/comarca via solicitação
      (() => {
        const sol = solicitacoes.find(s => s.id === p.solicitacao_suprimento_id);
        if (!sol) return true; // se não achar, não filtra por suprido/comarca
        return matchSuprido(sol) && matchComarca(sol.created_by);
      })() &&
      elemMatchInPrest(p.id)
    );
  }, [tipos.prestacao, prestacoes, solicitacoes, inRange, matchSuprido, matchComarca, elemMatchInPrest]);

  const filteredReemb = useMemo(() => {
    if (!tipos.reembolso) return [];
    return (reembolsos || []).filter(r =>
      inRange(r.created_date) &&
      matchComarca(r.created_by) &&
      // suprido: usa created_by (não há nome_servidor)
      (() => {
        const t = suprido.trim().toLowerCase();
        if (!t) return true;
        return (r.created_by || "").toLowerCase().includes(t);
      })() &&
      elemMatchInReemb(r.id)
    );
  }, [tipos.reembolso, reembolsos, inRange, matchComarca, suprido, elemMatchInReemb]);

  // totais
  const totals = useMemo(() => {
    const totalSolic = filteredSolic.reduce((s, i) => s + (Number(i.valor_solicitado) || 0), 0);
    const totalPrest = filteredPrest.reduce((s, i) => s + (Number(i.valor_total_comprovado) || 0), 0);
    const totalReemb = filteredReemb.reduce((s, i) => s + (Number(i.valor_total_comprovado) || 0), 0);
    return { totalSolic, totalPrest, totalReemb, grand: totalSolic + totalPrest + totalReemb };
  }, [filteredSolic, filteredPrest, filteredReemb]);

  // distribuição por elemento (somando três tipos)
  const distByElem = useMemo(() => {
    const map = new Map();

    // Solicitacao -> ItemDespesa.codigo
    filteredSolic.forEach(s => {
      const its = itensSolic.filter(it => it.solicitacao_id === s.id);
      its.forEach(it => {
        const key = it.codigo || "N/D";
        const prev = map.get(key) || 0;
        map.set(key, prev + (Number(it.valor_total) || 0));
      });
    });

    // Prestacao -> DespesaPrestacao.categoria usa valor
    filteredPrest.forEach(p => {
      const ds = despesasPrest.filter(d => d.prestacao_id === p.id);
      ds.forEach(d => {
        const key = d.categoria || "N/D";
        const prev = map.get(key) || 0;
        map.set(key, prev + (Number(d.valor) || 0));
      });
    });

    // Reembolso -> DespesaReembolso.categoria usa valor
    filteredReemb.forEach(r => {
      const ds = despesasReemb.filter(d => d.reembolso_id === r.id);
      ds.forEach(d => {
        const key = d.categoria || "N/D";
        const prev = map.get(key) || 0;
        map.set(key, prev + (Number(d.valor) || 0));
      });
    });

    const rows = [];
    map.forEach((value, key) => {
      const el = ELEMENTOS_DESPESA.find(e => e.codigo === key);
      rows.push({ codigo: key, nome: el ? el.descricao : key, valor: value });
    });
    return rows.sort((a, b) => b.valor - a.valor);
  }, [filteredSolic, filteredPrest, filteredReemb, itensSolic, despesasPrest, despesasReemb]);

  // estatísticas por analista (somente solicitações)
  const statsAnalista = useMemo(() => {
    const counts = {};
    filteredSolic.forEach(s => {
      const k = s.analista_responsavel || "Não atribuído";
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).map(([analista, qtde]) => ({ analista, qtde }));
  }, [filteredSolic]);

  const exportSelecionados = useCallback(() => {
    const rows = [];

    filteredSolic.forEach(s => {
      const u = usersByEmail[s.created_by] || {};
      const com = comarcas.find(c => c.id === u.comarca_id);
      const cods = itensSolic.filter(it => it.solicitacao_id === s.id).map(it => it.codigo).join("; ");
      rows.push({
        tipo: "Suprimento",
        id: s.id,
        created_date: s.created_date,
        suprido: s.nome_servidor || s.created_by,
        email: s.created_by,
        comarca: com ? com.nome : "",
        valor: s.valor_solicitado || 0,
        status: s.status,
        elementos: cods
      });
    });

    filteredPrest.forEach(p => {
      const s = solicitacoes.find(x => x.id === p.solicitacao_suprimento_id);
      const u = s ? usersByEmail[s.created_by] : null;
      const com = u ? comarcas.find(c => c.id === u.comarca_id) : null;
      const cods = despesasPrest.filter(d => d.prestacao_id === p.id).map(d => d.categoria).join("; ");
      rows.push({
        tipo: "Prestação",
        id: p.id,
        created_date: p.created_date,
        suprido: s?.nome_servidor || s?.created_by || "",
        email: s?.created_by || "",
        comarca: com ? com.nome : "",
        valor: p.valor_total_comprovado || 0,
        status: p.status,
        elementos: cods
      });
    });

    filteredReemb.forEach(r => {
      const u = usersByEmail[r.created_by] || {};
      const com = comarcas.find(c => c.id === u.comarca_id);
      const cods = despesasReemb.filter(d => d.reembolso_id === r.id).map(d => d.categoria).join("; ");
      rows.push({
        tipo: "Reembolso",
        id: r.id,
        created_date: r.created_date,
        suprido: r.created_by,
        email: r.created_by,
        comarca: com ? com.nome : "",
        valor: r.valor_total_comprovado || 0,
        status: r.status,
        elementos: cods
      });
    });

    exportToCSV("relatorios_filtrados.csv", rows);
  }, [filteredSolic, filteredPrest, filteredReemb, usersByEmail, comarcas, itensSolic, despesasPrest, despesasReemb, solicitacoes]);

  if (!user || user.role !== "admin") {
    return (
      <div className="p-6">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <p className="text-gray-600">Acesso restrito a administradores.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios e Análises</h1>
          <p className="text-gray-600">Filtros por período, suprido, comarca, elemento de despesa e tipo.</p>
        </div>
        <Button onClick={exportSelecionados} variant="outline">
          <FileDown className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-none shadow-lg">
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div>
            <Label>Data início</Label>
            <Input type="date" value={dtIni} onChange={(e) => setDtIni(e.target.value)} />
          </div>
          <div>
            <Label>Data fim</Label>
            <Input type="date" value={dtFim} onChange={(e) => setDtFim(e.target.value)} />
          </div>
          <div className="lg:col-span-2">
            <Label>Suprido (nome ou email)</Label>
            <Input placeholder="Buscar por suprido..." value={suprido} onChange={(e) => setSuprido(e.target.value)} />
          </div>
          <div>
            <Label>Comarca</Label>
            <Select value={comarcaId} onValueChange={setComarcaId}>
              <SelectTrigger><SelectValue placeholder="Selecione a comarca" /></SelectTrigger>
              <SelectContent>
                {comarcas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Elemento de Despesa</Label>
            <Select value={elem} onValueChange={setElem}>
              <SelectTrigger><SelectValue placeholder="Todos os elementos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {ELEMENTOS_DESPESA.map(e => (
                  <SelectItem key={e.codigo} value={e.codigo}>
                    {e.codigo} - {e.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-6">
            <div className="flex items-center gap-3 mt-2">
              <Label className="mr-2">Tipos:</Label>
              <button type="button" onClick={() => setTipos(t => ({ ...t, suprimento: !t.suprimento }))} className={`px-3 py-1 rounded-full text-sm border ${tipos.suprimento ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600'}`}>Suprimento</button>
              <button type="button" onClick={() => setTipos(t => ({ ...t, prestacao: !t.prestacao }))} className={`px-3 py-1 rounded-full text-sm border ${tipos.prestacao ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-600'}`}>Prestação</button>
              <button type="button" onClick={() => setTipos(t => ({ ...t, reembolso: !t.reembolso }))} className={`px-3 py-1 rounded-full text-sm border ${tipos.reembolso ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-600'}`}>Reembolso</button>
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="outline" onClick={() => { setDtIni(""); setDtFim(""); setSuprido(""); setComarcaId("all"); setElem("all"); setTipos({ suprimento: true, prestacao: true, reembolso: true }); }}>
                  Limpar filtros
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg"><CardContent className="p-4"><p className="text-sm text-gray-600">Total Suprimento</p><p className="text-2xl font-bold text-blue-700">{fmtCurrency(totals.totalSolic)}</p></CardContent></Card>
        <Card className="border-none shadow-lg"><CardContent className="p-4"><p className="text-sm text-gray-600">Total Prestação</p><p className="text-2xl font-bold text-emerald-700">{fmtCurrency(totals.totalPrest)}</p></CardContent></Card>
        <Card className="border-none shadow-lg"><CardContent className="p-4"><p className="text-sm text-gray-600">Total Reembolso</p><p className="text-2xl font-bold text-purple-700">{fmtCurrency(totals.totalReemb)}</p></CardContent></Card>
        <Card className="border-none shadow-lg"><CardContent className="p-4"><p className="text-sm text-gray-600">Total Geral</p><p className="text-2xl font-bold text-gray-900">{fmtCurrency(totals.grand)}</p></CardContent></Card>
      </div>

      {/* Distribuição por Elemento */}
      <Card className="border-none shadow-lg">
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /> Distribuição por Elemento de Despesa</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distByElem}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="codigo" />
              <YAxis />
              <Tooltip formatter={(v) => fmtCurrency(v)} />
              <Legend />
              <Bar dataKey="valor" fill="#6366F1" name="Valor" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Estatística por Analista (Solicitações) */}
      <Card className="border-none shadow-lg">
        <CardHeader><CardTitle>Estatística por Analista (Solicitações)</CardTitle></CardHeader>
        <CardContent className="h-72">
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsAnalista}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="analista" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="qtde" fill="#10B981" name="Qtd. Solicitações" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {statsAnalista.map((s, idx) => (
              <Badge key={idx} variant="outline">{s.analista}: {s.qtde}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
