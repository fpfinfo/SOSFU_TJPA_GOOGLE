
import React, { useEffect, useState, useCallback, useRef } from "react";
import { PrestacaoContas } from "@/api/entities";
import { DespesaPrestacao } from "@/api/entities";
import { AnexoService } from "@/components/anexos/AnexoService";
import AdminAnexosSection from "@/components/anexos/AdminAnexosSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { FileText, Search, Eye, Printer, MessageCircle, Paperclip } from "lucide-react";
import StatusBadge from "@/components/status/StatusBadge";
import PrestacaoStatusControl from "@/components/status/PrestacaoStatusControl";
import PrestacaoStatusTimeline from "@/components/status/PrestacaoStatusTimeline";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DevolucaoPrestacao } from "@/api/entities";
import PrestacaoChecklist from "@/components/checklist/PrestacaoChecklist";
import PaginationControls from "@/components/ui/PaginationControls";
import { exportToCSV } from "@/components/utils/exportUtils";
import { SolicitacaoSuprimento } from "@/api/entities";
import { useAppToasts } from "@/components/utils/toastUtils";

const formatCurrency = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AnalisePrestacao() {
  const [prestacoes, setPrestacoes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [despesas, setDespesas] = useState([]);
  const [devolucoes, setDevolucoes] = useState([]);
  const [anexosSuprido, setAnexosSuprido] = useState([]);
  const [anexosAdmin, setAnexosAdmin] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tipoDespesaFilter, setTipoDespesaFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loadingList, setLoadingList] = useState(true);
  const [valorRecebido, setValorRecebido] = useState(0);
  const [prestacoesEnriquecidas, setPrestacoesEnriquecidas] = useState([]);

  const toasts = useAppToasts();

  // guards para evitar múltiplas chamadas e recargas desnecessárias
  const inFlightRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const loadPrestacoes = useCallback(async () => {
    // evita paralelismo
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoadingList(true);
    try {
      const data = await PrestacaoContas.list("-created_date");
      setPrestacoes(data);

      // NEW: enriquecer com nome do servidor (da Solicitação vinculada)
      const ids = Array.from(new Set((data || []).map(p => p.solicitacao_suprimento_id).filter(Boolean)));
      
      // Fetch solicitacoes in parallel
      const solicitacoes = await Promise.all(ids.map(id => SolicitacaoSuprimento.get(id).catch(() => null))); // Catch errors for individual fetches

      const mapNomes = Object.fromEntries(solicitacoes.filter(Boolean).map(s => [s.id, s.nome_servidor || ""]));
      const enriched = (data || []).map(p => ({
        ...p,
        servidor_nome: mapNomes[p.solicitacao_suprimento_id] || ""
      }));
      setPrestacoesEnriquecidas(enriched);
    } catch (e) {
      console.error("Failed to load prestacoes:", e);
      toasts.error("Falha ao carregar prestações");
    } finally {
      setLoadingList(false);
      inFlightRef.current = false;
      hasLoadedRef.current = true;
    }
  }, [toasts]);

  const loadDetalhes = async (p) => {
    setSelected(p);
    try {
      const [itens, axSup, axAdm, dv, sol] = await Promise.all([
        DespesaPrestacao.filter({ prestacao_id: p.id }),
        AnexoService.listarAnexos("prestacao", p.id, { origem: "suprido" }),
        AnexoService.listarAnexos("prestacao", p.id, { origem: "admin", incluirInvisiveis: true }),
        DevolucaoPrestacao.filter({ prestacao_id: p.id }),
        p.solicitacao_suprimento_id ? SolicitacaoSuprimento.get(p.solicitacao_suprimento_id) : Promise.resolve(null)
      ]);
      setDespesas(itens);
      setAnexosSuprido(axSup);
      setAnexosAdmin(axAdm);
      setDevolucoes(dv);
      setValorRecebido(sol?.valor_solicitado || 0);
    } catch (e) {
      console.error("Failed to load prestacao details:", e);
      toasts.error("Falha ao carregar detalhes da prestação");
    }
  };

  useEffect(() => {
    // carrega apenas uma vez ao montar (ou quando loadPrestacoes mudar)
    if (!hasLoadedRef.current) {
      loadPrestacoes();
    }
  }, [loadPrestacoes]);

  const baseList = prestacoesEnriquecidas.length ? prestacoesEnriquecidas : prestacoes;

  const filtered = baseList.filter(p => {
    const s = statusFilter === "all" || p.status === statusFilter;
    const lower = search.toLowerCase();
    const q = search === "" 
      || (p.protocolo || "").toLowerCase().includes(lower)
      || (p.solicitacao_numero_snapshot || "").toLowerCase().includes(lower)
      || (p.servidor_nome || "").toLowerCase().includes(lower); // NEW: busca por nome
    return s && q;
  });

  // Resumos para painel direito (detalhe selecionado)
  const totalDespesas = despesas.reduce((s, d) => s + (Number(d.valor) || 0), 0);
  const totalDevolucoes = devolucoes.reduce((s, d) => s + (Number(d.valor) || 0), 0);
  const saldoPrestacao = (Number(valorRecebido) || 0) - (totalDespesas + totalDevolucoes);


  const handleStatusChanged = async () => {
    await loadPrestacoes();
    if (selected) {
      const updated = await PrestacaoContas.get(selected.id);
      setSelected(updated);
      await loadDetalhes(updated); // manter painel sincronizado
    }
  };

  // Utilitário: conta anexos por despesa (suprido)
  const anexosPorDespesa = (despesaId) =>
    anexosSuprido.filter(a => a.despesa_prestacao_id && a.despesa_prestacao_id === despesaId);

  const exportCSV = () => {
    const rows = filtered.map(p => ({
      id: p.id,
      protocolo: p.protocolo,
      data_prestacao: p.data_prestacao,
      solicitacao_numero: p.solicitacao_numero_snapshot || "",
      servidor_nome: p.servidor_nome || "",
      status: p.status,
      valor_total_comprovado: p.valor_total_comprovado,
      created_by: p.created_by
    }));
    exportToCSV("prestacoes_filtradas.csv", rows);
    toasts.success("Exportação concluída", `${rows.length} prestação(ões) exportada(s).`);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  // pageItems is directly calculated in the render block for dynamic filtering
  // const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Skeleton de carregamento
  if (loadingList) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-7 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded" />)}
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
          <h1 className="text-3xl font-bold text-gray-900">Análise de Prestação</h1>
          <p className="text-gray-600 mt-1">Analise, glosse e aprove prestações de contas</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Prestações</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{filtered.length} total</Badge>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  title="Itens por página"
                >
                  <option value={10}>10/página</option>
                  <option value={20}>20/página</option>
                  <option value={50}>50/página</option>
                </select>
                <Button variant="outline" size="sm" onClick={exportCSV}>Exportar CSV</Button>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por protocolo ou nome..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovado">Aprovadas</SelectItem>
                  <SelectItem value="glosa">Glosadas</SelectItem>
                  <SelectItem value="rejeitado">Rejeitadas</SelectItem>
                  <SelectItem value="concluido">Concluídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingList ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-gray-50 animate-pulse h-20"></div>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {filtered.slice((page - 1) * pageSize, page * pageSize).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => loadDetalhes(p)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selected?.id === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{p.protocolo}</p>
                          <p className="text-sm text-gray-600">{p.solicitacao_numero_snapshot || "-"}</p>
                          {/* NEW: exibir nome do servidor para ajudar a busca visual */}
                          {p.servidor_nome ? (
                            <p className="text-xs text-gray-500">{p.servidor_nome}</p>
                          ) : null}
                          <p className="text-xs text-gray-500">{new Date(p.data_prestacao).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="text-right space-y-2">
                          <StatusBadge status={p.status} />
                          <p className="text-sm font-medium">{formatCurrency(p.valor_total_comprovado)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma prestação encontrada</p>
                    </div>
                  )}
                </div>
                <PaginationControls
                  page={page}
                  totalPages={totalPages}
                  onPrev={() => setPage((p) => Math.max(1, p - 1))}
                  onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </>
            )}
          </CardContent>
        </Card>

        {selected ? (
          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Detalhes da Prestação</CardTitle>
                    <div className="mt-2">
                      <StatusBadge status={selected.status} showDescription />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={createPageUrl(`DetalhePrestacao?id=${selected.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />Ver Detalhes
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
                  <div><span className="text-xs text-gray-500">Data</span><p>{new Date(selected.data_prestacao).toLocaleDateString("pt-BR")}</p></div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Observações</span>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{selected.observacoes_suprido || "-"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Resumo Financeiro (ATUALIZADO) */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-sm text-gray-600">Valor Recebido</p>
                    <p className="text-2xl font-bold text-indigo-700">{formatCurrency(valorRecebido)}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-sm text-gray-600">Total Comprovado</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalDespesas)}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-sm text-gray-600">Total Devoluções</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalDevolucoes)}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-sm text-gray-600">Saldo para Prestação</p>
                    <p className={`text-2xl font-bold ${saldoPrestacao < 0 ? 'text-red-600' : saldoPrestacao === 0 ? 'text-emerald-700' : 'text-gray-800'}`}>
                      {formatCurrency(saldoPrestacao)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Despesas com filtro por tipo e anexos por item (novo) */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Despesas</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={tipoDespesaFilter} onValueChange={setTipoDespesaFilter}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Tipo de Despesa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Tipos</SelectItem>
                        <SelectItem value="geral">Formulário Geral</SelectItem>
                        <SelectItem value="servico_pf">Serviço PF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição/Atividade</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Doc.</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">INSS</TableHead>
                      <TableHead className="text-right">ISS</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="text-center">Anexos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despesas
                      .filter(d => tipoDespesaFilter === "all" || (d.tipo_formulario || "geral") === tipoDespesaFilter)
                      .map((d) => {
                        const isPF = (d.tipo_formulario || "geral") === "servico_pf";
                        const anexosItem = anexosPorDespesa(d.id);
                        return (
                          <TableRow key={d.id}>
                            <TableCell>
                              <Badge variant="outline" className={isPF ? "text-purple-700" : "text-gray-700"}>
                                {isPF ? "Serviço PF" : "Geral"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[280px]">
                              {isPF ? (d.atividade_servico || d.descricao || "-") : (d.descricao || "-")}
                            </TableCell>
                            <TableCell>{d.data_despesa || "-"}</TableCell>
                            <TableCell>{d.documento_numero || "-"}</TableCell>
                            <TableCell className="text-right">{formatCurrency(d.valor)}</TableCell>
                            <TableCell className="text-right">{isPF ? formatCurrency(d.retencao_inss || 0) : "-"}</TableCell>
                            <TableCell className="text-right">{isPF ? formatCurrency(d.retencao_iss || 0) : "-"}</TableCell>
                            <TableCell className="text-right">{isPF ? formatCurrency(d.valor_liquido || d.valor || 0) : "-"}</TableCell>
                            <TableCell className="text-center">
                              {anexosItem.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-gray-700">
                                  <Paperclip className="w-4 h-4" /> {anexosItem.length}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">—</span>
                              )}
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
                      <TableCell />
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>

            {/* Devoluções (novo) */}
            {devolucoes.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader><CardTitle>Devoluções</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devolucoes.map((dv) => (
                        <TableRow key={dv.id}>
                          <TableCell className="capitalize">{dv.tipo || "gdr"}</TableCell>
                          <TableCell>{dv.descricao || "-"}</TableCell>
                          <TableCell>{dv.data_devolucao || "-"}</TableCell>
                          <TableCell>{dv.documento_numero || "-"}</TableCell>
                          <TableCell className="text-right">{formatCurrency(dv.valor)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} className="font-semibold text-lg">Total Devoluções</TableCell>
                        <TableCell className="text-right font-bold text-lg">{formatCurrency(totalDevolucoes)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              </Card>
            )}

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
              ownerTipo="prestacao"
              ownerId={selected.id}
              anexos={anexosAdmin}
              onAnexosChange={setAnexosAdmin}
              user={{ role: "admin" }}
            />

            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle>Controle de Status</CardTitle></CardHeader>
              <CardContent>
                <PrestacaoStatusControl prestacao={selected} onStatusChanged={handleStatusChanged} />
              </CardContent>
            </Card>

            <PrestacaoStatusTimeline prestacaoId={selected.id} />

            {/* Checklist embutido (novo, somente em análise) */}
            {selected.status === "em_analise" && (
              <PrestacaoChecklist prestacaoId={selected.id} canEdit />
            )}
          </div>
        ) : (
          <Card className="border-none shadow-lg">
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Selecione uma prestação para ver os detalhes</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
