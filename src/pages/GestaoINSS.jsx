
import React, { useEffect, useMemo, useState } from "react";
import { DespesaPrestacao } from "@/api/entities";
import { PrestacaoContas } from "@/api/entities";
import { Comarca } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Percent, Download, Calendar as CalendarIcon, Users as UsersIcon, MapPin, FileText, Printer } from "lucide-react";
import { useCurrentUser } from "@/components/utils/UserContext";
import { exportToCSV } from "@/components/utils/exportUtils";

const currency = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const ym = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

export default function GestaoINSS() {
  const user = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // Filtros
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [suprido, setSuprido] = useState("all"); // email
  const [comarcaId, setComarcaId] = useState("all");
  const [mes, setMes] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1) Despesas tipo servico_pf
        const despesasPF = await DespesaPrestacao.filter({ tipo_formulario: "servico_pf" }, "-created_date");

        // 2) Prestacoes referentes
        const prestacaoIds = Array.from(new Set(despesasPF.map((d) => d.prestacao_id).filter(Boolean)));
        const prestacoes = await Promise.all(prestacaoIds.map((id) => PrestacaoContas.get(id)));
        const prestById = new Map(prestacoes.map((p) => [p.id, p]));

        // 3) Usuários (supridos)
        const emails = Array.from(new Set(prestacoes.map((p) => p.created_by).filter(Boolean)));
        const users = await Promise.all(
          emails.map(async (email) => {
            const found = await User.filter({ email });
            return found && found.length ? found[0] : null;
          })
        );
        const userByEmail = new Map(users.filter(Boolean).map((u) => [u.email, u]));

        // 4) Comarcas
        const comarcaIds = Array.from(new Set(users.map((u) => u?.comarca_id).filter(Boolean)));
        const comarcas = await Promise.all(comarcaIds.map((id) => Comarca.get(id)));
        const comarcaById = new Map(comarcas.map((c) => [c.id, c]));

        // 5) Monta linhas
        const composed = despesasPF.map((d) => {
          const p = prestById.get(d.prestacao_id);
          const u = p ? userByEmail.get(p.created_by) : null;
          const c = u?.comarca_id ? comarcaById.get(u.comarca_id) : null;

          const valorComprovante = Number(d.comprovante_valor ?? d.valor ?? 0);
          const contribuinte11 = d.retencao_inss != null ? Number(d.retencao_inss) : round2(valorComprovante * 0.11);
          const patronal20 = round2(valorComprovante * 0.2);

          return {
            id: d.id,
            prestador_nome: d.prestador_nome || "",
            prestador_cpf: d.prestador_cpf || "",
            prestador_data_nascimento: d.prestador_data_nascimento || "",
            prestador_pis_nit: d.prestador_pis_nit || "",
            prestador_endereco: d.prestador_endereco || "",
            prestador_filiacao: d.prestador_filiacao || "",
            valor_comprovante: valorComprovante,
            documento_numero: d.documento_numero || "",
            data_comprovante: d.data_despesa || "",
            inss_contribuinte_11: contribuinte11,
            inss_patronal_20: patronal20,
            comarca_id: u?.comarca_id || "",
            comarca_nome: c?.nome || "-",
            protocolo: p?.protocolo || "-",
            atividade: d.atividade_servico || d.descricao || "-",
            suprido_email: p?.created_by || "",
            suprido_nome: u?.nome_completo_customizado || u?.full_name || "",
            mes_ref: ym(d.data_despesa),
          };
        });

        setRows(composed);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const supridosOptions = useMemo(() => {
    const set = new Map();
    rows.forEach((r) => {
      if (r.suprido_email && !set.has(r.suprido_email)) {
        set.set(r.suprido_email, r.suprido_nome ? `${r.suprido_nome} (${r.suprido_email})` : r.suprido_email);
      }
    });
    return Array.from(set.entries()).map(([email, label]) => ({ email, label }));
  }, [rows]);

  const comarcasOptions = useMemo(() => {
    const set = new Map();
    rows.forEach((r) => {
      if (r.comarca_id && !set.has(r.comarca_id)) set.set(r.comarca_id, r.comarca_nome || r.comarca_id);
    });
    return Array.from(set.entries()).map(([id, nome]) => ({ id, nome }));
  }, [rows]);

  const mesesOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => r.mes_ref && set.add(r.mes_ref));
    return Array.from(set.values()).sort();
  }, [rows]);

  const filtered = rows.filter((r) => {
    const df = !dateFrom || (r.data_comprovante && r.data_comprovante >= dateFrom);
    const dt = !dateTo || (r.data_comprovante && r.data_comprovante <= dateTo);
    const s = suprido === "all" || r.suprido_email === suprido;
    const c = comarcaId === "all" || r.comarca_id === comarcaId;
    const m = mes === "all" || r.mes_ref === mes;
    return df && dt && s && c && m;
  });

  const totals = useMemo(() => {
    const total = filtered.reduce((s, r) => s + (Number(r.valor_comprovante) || 0), 0);
    const contrib = filtered.reduce((s, r) => s + (Number(r.inss_contribuinte_11) || 0), 0);
    const patronal = filtered.reduce((s, r) => s + (Number(r.inss_patronal_20) || 0), 0);
    return { total, contrib, patronal };
  }, [filtered]);

  const exportar = () => {
    const rowsCsv = filtered.map((r) => ({
      "Nome Completo": r.prestador_nome,
      "CPF": r.prestador_cpf,
      "Data de Nascimento": r.prestador_data_nascimento,
      "PIS/NIT": r.prestador_pis_nit,
      "Endereço": r.prestador_endereco,
      "Filiação": r.prestador_filiacao,
      "Valor Comprovante": r.valor_comprovante,
      "Nº Comprovante": r.documento_numero,
      "Data Comprovante": r.data_comprovante,
      "INSS 11% Contribuinte": r.inss_contribuinte_11,
      "INSS 20% Patronal": r.inss_patronal_20,
      "Comarca": r.comarca_nome,
      "Protocolo": r.protocolo,
      "Atividade": r.atividade,
      "Suprido (email)": r.suprido_email
    }));
    exportToCSV("gestao_inss_pf.csv", rowsCsv);
  };

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="p-6">
        <Card className="border-none shadow-lg">
          <CardContent className="py-10 text-center text-gray-600">
            Acesso restrito. Este módulo é visível apenas para administradores.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 inss-page">
      {/* Estilos específicos de impressão */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          /* Esconder elementos não necessários na impressão */
          .print-hidden { display: none !important; }
          header, aside { display: none !important; } /* Assuming these might be outside this component */
          /* Garantir que a tabela ocupe toda a largura e reduza fontes */
          .inss-print-table { overflow: visible !important; }
          .inss-print-table table { width: 100% !important; table-layout: auto; }
          .inss-print-table thead th,
          .inss-print-table tbody td {
            font-size: 11px !important;
            padding: 4px 6px !important;
            white-space: nowrap !important;
          }
          /* Ajustar background para impressão */
          .inss-page { background: #ffffff !important; }
        }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 print-hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão do INSS (Serviço PF)</h1>
          <p className="text-gray-600 mt-1">Consolidação de INSS Contribuinte (11%) e Patronal (20%) por comprovante.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportar}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-none shadow-lg print-hidden">
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-gray-600 flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Data Inicial</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-600 flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Data Final</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-600 flex items-center gap-1"><UsersIcon className="w-3 h-3" /> Suprido</label>
            <Select value={suprido} onValueChange={setSuprido}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {supridosOptions.map((opt) => (
                  <SelectItem key={opt.email} value={opt.email}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> Comarca</label>
            <Select value={comarcaId} onValueChange={setComarcaId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {comarcasOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-600 flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Mês (YYYY-MM)</label>
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {mesesOptions.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-hidden">
        <Card className="border-none shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800">Total Comprovado</p>
              <p className="text-2xl font-bold text-blue-900">{currency(totals.total)}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-r from-emerald-50 to-emerald-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-800">Contribuinte 11%</p>
              <p className="text-2xl font-bold text-emerald-900">{currency(totals.contrib)}</p>
            </div>
            <Percent className="w-8 h-8 text-emerald-600" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-800">Patronal 20%</p>
              <p className="text-2xl font-bold text-purple-900">{currency(totals.patronal)}</p>
            </div>
            <Percent className="w-8 h-8 text-purple-600" />
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card className="border-none shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registros ({filtered.length})</CardTitle>
          {loading && <Badge variant="outline">Carregando...</Badge>}
        </CardHeader>
        <CardContent className="overflow-x-auto inss-print-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Data de Nascimento</TableHead>
                <TableHead>PIS/NIT</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Filiação</TableHead>
                <TableHead className="text-right">Valor Comprovante</TableHead>
                <TableHead>N° Comprovante</TableHead>
                <TableHead>Data Comprovante</TableHead>
                <TableHead className="text-right">INSS 11% Contrib.</TableHead>
                <TableHead className="text-right">INSS 20% Patronal</TableHead>
                <TableHead>Comarca</TableHead>
                <TableHead>Protocolo</TableHead>
                <TableHead>Atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="min-w-[180px]">{r.prestador_nome}</TableCell>
                  <TableCell>{r.prestador_cpf}</TableCell>
                  <TableCell>{r.prestador_data_nascimento || "-"}</TableCell>
                  <TableCell>{r.prestador_pis_nit || "-"}</TableCell>
                  <TableCell className="min-w-[220px]">{r.prestador_endereco || "-"}</TableCell>
                  <TableCell className="min-w-[160px]">{r.prestador_filiacao || "-"}</TableCell>
                  <TableCell className="text-right">{currency(r.valor_comprovante)}</TableCell>
                  <TableCell>{r.documento_numero || "-"}</TableCell>
                  <TableCell>{r.data_comprovante || "-"}</TableCell>
                  <TableCell className="text-right text-emerald-700 font-medium">{currency(r.inss_contribuinte_11)}</TableCell>
                  <TableCell className="text-right text-purple-700 font-medium">{currency(r.inss_patronal_20)}</TableCell>
                  <TableCell>{r.comarca_nome || "-"}</TableCell>
                  <TableCell className="font-mono">{r.protocolo}</TableCell>
                  <TableCell className="min-w-[200px]">{r.atividade}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-8 text-gray-500">
                    Nenhum registro encontrado com os filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
