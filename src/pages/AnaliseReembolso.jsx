
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Reembolso } from "@/api/entities";
import { DespesaReembolso } from "@/api/entities";
import { AnexoService } from "@/components/anexos/AnexoService";
import AdminAnexosSection from "@/components/anexos/AdminAnexosSection";
import { User } from "@/api/entities"; // NEW
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { FileText, Search, Eye, Printer, MessageCircle, Paperclip } from "lucide-react";
import StatusBadge from "@/components/status/StatusBadge";
import ReembolsoStatusControl from "@/components/status/ReembolsoStatusControl";
import ReembolsoStatusTimeline from "@/components/status/ReembolsoStatusTimeline";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReembolsoChecklist from "@/components/checklist/ReembolsoChecklist";
import { useAppToasts } from "@/components/utils/toastUtils";


const formatCurrency = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AnaliseReembolso() {
  const [itens, setItens] = useState([]);
  const [selected, setSelected] = useState(null);
  const [despesas, setDespesas] = useState([]);
  const [anexosSuprido, setAnexosSuprido] = useState([]);
  const [anexosAdmin, setAnexosAdmin] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [itensEnriquecidos, setItensEnriquecidos] = useState([]); // NEW

  const toasts = useAppToasts();

  // NEW: guards para evitar múltiplas chamadas e recargas desnecessárias
  const inFlightRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    // single-flight: evita paralelismo
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      setLoadingList(true);
      const data = await Reembolso.list("-created_date");
      setItens(data);

      // NEW: enriquecer com nome do solicitante (User)
      const emails = Array.from(new Set((data || []).map(r => r.created_by).filter(Boolean)));
      const users = await Promise.all(
        emails.map(async (email) => {
          const arr = await User.filter({ email });
          return [email, arr[0] || null];
        })
      );
      const mapUser = Object.fromEntries(users);
      const enriched = (data || []).map(r => ({
        ...r,
        solicitante_nome:
          mapUser[r.created_by]?.nome_completo_customizado ||
          mapUser[r.created_by]?.full_name ||
          (r.created_by ? r.created_by.split("@")[0] : "")
      }));
      setItensEnriquecidos(enriched);
    } catch (e) {
      console.error(e);
      toasts.error("Falha ao carregar reembolsos");
    } finally {
      setLoadingList(false);
      inFlightRef.current = false;
      hasLoadedRef.current = true;
    }
  }, [toasts]);

  const loadDetalhes = async (r) => {
    setSelected(r);
    const [ds, axSup, axAdm] = await Promise.all([
      DespesaReembolso.filter({ reembolso_id: r.id }),
      AnexoService.listarAnexos("reembolso", r.id, { origem: "suprido" }),
      AnexoService.listarAnexos("reembolso", r.id, { origem: "admin", incluirInvisiveis: true })
    ]);
    setDespesas(ds);
    setAnexosSuprido(axSup);
    setAnexosAdmin(axAdm);
  };

  useEffect(() => {
    // carrega apenas uma vez no mount (ou quando 'load' mudar)
    if (!hasLoadedRef.current) {
      load();
    }
  }, [load]);

  const baseList = itensEnriquecidos.length > 0 ? itensEnriquecidos : itens; // NEW

  const filtered = baseList.filter(r => {
    const s = statusFilter === "all" || r.status === statusFilter;
    const lower = search.toLowerCase();
    const q = search === ""
      || (r.protocolo || "").toLowerCase().includes(lower)
      || (r.solicitante_nome || "").toLowerCase().includes(lower) // NEW
      || (r.created_by || "").toLowerCase().includes(lower); // opcional: email
    const df = !dateFrom || (r.data_reembolso && r.data_reembolso >= dateFrom);
    const dt = !dateTo || (r.data_reembolso && r.data_reembolso <= dateTo);
    return s && q && df && dt;
  });

  const totalDespesas = despesas.reduce((s, d) => s + (Number(d.valor) || 0), 0);

  const handleStatusChanged = async () => {
    await load();
    if (selected) {
      const updated = await Reembolso.get(selected.id);
      setSelected(updated);
      await loadDetalhes(updated);
    }
  };

  const anexosPorDespesa = (despesaId) =>
    anexosSuprido.filter(a => a.despesa_reembolso_id && a.despesa_reembolso_id === despesaId);

  // Skeleton de carregamento
  if (loadingList) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-7 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded" />)}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análise de Reembolso</h1>
          <p className="text-gray-600 mt-1">Analise, glosse e aprove reembolsos</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Reembolsos</CardTitle>
              <Badge variant="outline">{filtered.length} total</Badge>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex-1 min-w-[220px] relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Buscar por protocolo ou nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovado">Aprovados</SelectItem>
                  <SelectItem value="glosa">Glosados</SelectItem>
                  <SelectItem value="rejeitado">Rejeitados</SelectItem>
                  <SelectItem value="concluido">Concluídos</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  onClick={() => loadDetalhes(r)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selected?.id === r.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{r.protocolo}</p>
                      {/* NEW: exibir nome do solicitante */}
                      {r.solicitante_nome ? (
                        <p className="text-sm text-gray-600">{r.solicitante_nome}</p>
                      ) : null}
                      <p className="text-xs text-gray-500">{r.data_reembolso || "-"}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <StatusBadge status={r.status} />
                      <p className="text-sm font-medium">{formatCurrency(r.valor_total_comprovado)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum reembolso encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selected ? (
          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Detalhes do Reembolso</CardTitle>
                    <div className="mt-2">
                      <StatusBadge status={selected.status} showDescription />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={createPageUrl(`DetalheReembolso?id=${selected.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />Ver Detalhes
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={createPageUrl(`Chat?id=${selected.id}&tipo=reembolso`)}>
                        <MessageCircle className="w-4 h-4 mr-2" />Chat
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="w-4 h-4 mr-2" />Imprimir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-xs text-gray-500">Protocolo</span><p className="font-medium">{selected.protocolo}</p></div>
                  <div><span className="text-xs text-gray-500">Data</span><p>{selected.data_reembolso || "-"}</p></div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Observações</span>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{selected.observacoes_suprido || "-"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle>Resumo Financeiro</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-sm text-gray-600">Total Comprovado</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalDespesas)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Despesas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Doc.</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Anexos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despesas.map((d) => {
                      const anexosItem = anexosPorDespesa(d.id);
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="max-w-[280px]">{d.descricao || d.atividade_servico || "-"}</TableCell>
                          <TableCell>{d.categoria || "-"}</TableCell>
                          <TableCell>{d.data_despesa || "-"}</TableCell>
                          <TableCell>{d.documento_numero || "-"}</TableCell>
                          <TableCell className="text-right">{formatCurrency(d.valor)}</TableCell>
                          <TableCell className="text-center">
                            {anexosItem.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-gray-700">
                                <Paperclip className="w-4 h-4" /> {anexosItem.length}
                              </span>
                            ) : (<span className="text-gray-400 text-sm">—</span>)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="font-semibold text-lg">Total Comprovado</TableCell>
                      <TableCell className="text-right font-bold text-lg">{formatCurrency(totalDespesas)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>

            {anexosSuprido.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader><CardTitle>Comprovantes do Suprido</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {anexosSuprido.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 truncate"><FileText className="w-4 h-4 text-blue-600 shrink-0" /><p className="font-medium truncate text-sm">{a.nome_original}</p></div>
                      <Button variant="outline" size="sm" asChild><a href={a.url_assinada} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4 mr-2" />Ver</a></Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <AdminAnexosSection
              ownerTipo="reembolso"
              ownerId={selected.id}
              anexos={anexosAdmin}
              onAnexosChange={setAnexosAdmin}
              user={{ role: "admin" }}
            />

            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle>Controle de Status</CardTitle></CardHeader>
              <CardContent>
                <ReembolsoStatusControl reembolso={selected} onStatusChanged={handleStatusChanged} />
              </CardContent>
            </Card>

            <ReembolsoStatusTimeline reembolsoId={selected.id} />

            {selected.status === "em_analise" && (
              <ReembolsoChecklist reembolsoId={selected.id} canEdit />
            )}
          </div>
        ) : (
          <Card className="border-none shadow-lg">
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Selecione um reembolso para ver os detalhes</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
