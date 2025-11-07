
import React, { useState, useEffect, useCallback, useRef } from "react";
import { SolicitacaoSuprimento } from "@/api/entities";
import { ItemDespesa } from "@/api/entities";
import { AnexoService } from '../components/anexos/AnexoService';
import AdminAnexosSection from '../components/anexos/AdminAnexosSection';
import { exportToCSV } from "@/components/utils/exportUtils";
import { formatDateBR } from "@/components/utils/dateUtils";
import PaginationControls from "@/components/ui/PaginationControls";
import { useAppToasts } from "@/components/utils/toastUtils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import {
  FileText,
  Download,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Printer
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StatusBadge from "../components/status/StatusBadge";
import StatusControl from "../components/status/StatusControl";
import StatusTimeline from "../components/status/StatusTimeline";

const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    value = Number(value) || 0;
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function AnaliseSuprimento() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);
  const [itens, setItens] = useState([]);
  const [anexos, setAnexos] = useState([]);
  const [anexosAdmin, setAnexosAdmin] = useState([]);
  const [loading, setLoading] = useState(false); // Used for details loading
  const [loadingList, setLoadingList] = useState(true); // Used for main list loading
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const toasts = useAppToasts();

  // NEW: guards para evitar múltiplas requisições simultâneas e recargas desnecessárias
  const inFlightRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const loadSolicitacoes = useCallback(async () => {
    if (inFlightRef.current) return; // evita paralelismo
    inFlightRef.current = true;

    try {
      setLoadingList(true);
      const data = await SolicitacaoSuprimento.list('-created_date');
      const somenteSuprimentoEJuri = (data || []).filter(s => (s.tipo === 'suprimento' || s.tipo === 'juri' || !s.tipo));
      setSolicitacoes(somenteSuprimentoEJuri);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
      toasts.error("Falha ao carregar solicitações");
    } finally {
      setLoadingList(false);
      inFlightRef.current = false;
    }
  }, [toasts]); // atualizado: inclui 'toasts' como dependência

  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadSolicitacoes();
    }
  }, [loadSolicitacoes]); // atualizado: inclui a função nas dependências

  const loadDetalhes = async (solicitacao) => {
    setSelectedSolicitacao(solicitacao);

    try {
      const [itensData, anexosSupridoData, anexosAdminData] = await Promise.all([
        ItemDespesa.filter({ solicitacao_id: solicitacao.id }),
        AnexoService.listarAnexos('solicitacao', solicitacao.id, { origem: 'suprido' }),
        AnexoService.listarAnexos('solicitacao', solicitacao.id, { origem: 'admin', incluirInvisiveis: true })
      ]);

      setItens(itensData);
      setAnexos(anexosSupridoData);
      setAnexosAdmin(anexosAdminData);
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      toasts.error("Falha ao carregar detalhes da solicitação.");
    }
  };

  const handleStatusChanged = async (newStatus) => {
    await loadSolicitacoes();
    if (selectedSolicitacao) {
      setSelectedSolicitacao(prev => ({ ...prev, status: newStatus }));
    }
  };

  const filteredSolicitacoes = solicitacoes.filter(s => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesSearch = searchTerm === '' ||
      s.numero_solicitacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nome_servidor.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSolicitacoes.length / pageSize));
  const pageItems = filteredSolicitacoes.slice((page - 1) * pageSize, page * pageSize);

  const exportFiltradasCSV = () => {
    const rows = filteredSolicitacoes.map(s => ({
      id: s.id,
      numero_solicitacao: s.numero_solicitacao,
      data_solicitacao: formatDateBR(s.data_solicitacao),
      nome_servidor: s.nome_servidor,
      cpf: s.cpf,
      valor_solicitado: s.valor_solicitado,
      status: s.status,
      justificativa: s.justificativa,
      created_by: s.created_by,
      created_date: format(new Date(s.created_date), 'dd/MM/yyyy HH:mm:ss'),
      updated_date: s.updated_date ? format(new Date(s.updated_date), 'dd/MM/yyyy HH:mm:ss') : ''
    }));
    exportToCSV("solicitacoes_filtradas.csv", rows);
    toasts.success("Exportação concluída", `${rows.length} registro(s) exportado(s).`);
  };

  // Exibe skeleton enquanto carrega a lista principal
  if (loadingList) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-7 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análise de Suprimento</h1>
          <p className="text-gray-600 mt-1">Analise e aprove solicitações de suprimento de fundos</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Solicitações</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{filteredSolicitacoes.length} total</Badge>
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
                <Button variant="outline" size="sm" onClick={exportFiltradasCSV}>Exportar CSV</Button>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovado">Aprovadas</SelectItem>
                  <SelectItem value="rejeitado">Rejeitadas</SelectItem>
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
                  {pageItems.map((solicitacao) => (
                    <div key={solicitacao.id} onClick={() => loadDetalhes(solicitacao)} className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedSolicitacao?.id === solicitacao.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{solicitacao.numero_solicitacao}</p>
                          <p className="text-sm text-gray-600">{solicitacao.nome_servidor}</p>
                          <p className="text-xs text-gray-500">
                            {formatDateBR(solicitacao.data_solicitacao)}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <StatusBadge status={solicitacao.status} />
                          <p className="text-sm font-medium">{formatCurrency(solicitacao.valor_solicitado)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredSolicitacoes.length === 0 && <div className="text-center py-8 text-gray-500"><FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" /><p>Nenhuma solicitação encontrada</p></div>}
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

        {selectedSolicitacao ? (
          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Detalhes da Solicitação</CardTitle>
                    <div className="mt-2">
                      <StatusBadge status={selectedSolicitacao.status} showDescription />
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="outline" size="sm" asChild>
                      <Link to={createPageUrl(`DetalheSolicitacao?id=${selectedSolicitacao.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />Ver Detalhes
                      </Link>
                    </Button>
                     <Button variant="outline" size="sm" asChild>
                      <Link to={createPageUrl(`Chat?id=${selectedSolicitacao.id}`)}>
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
                  <div><Label className="text-xs">Número</Label><p>{selectedSolicitacao.numero_solicitacao}</p></div>
                  <div><Label className="text-xs">Data</Label><p>{formatDateBR(selectedSolicitacao.data_solicitacao)}</p></div>
                  <div><Label className="text-xs">Servidor</Label><p>{selectedSolicitacao.nome_servidor}</p></div>
                  <div><Label className="text-xs">CPF</Label><p>{selectedSolicitacao.cpf}</p></div>
                  <div><Label className="text-xs">Matrícula</Label><p>{selectedSolicitacao.matricula}</p></div>
                </div>
                <div>
                  <Label className="text-xs">Justificativa</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{selectedSolicitacao.justificativa}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle>Elementos de Despesa</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.valor_total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-semibold text-lg">Total Previsto</TableCell>
                      <TableCell className="text-right font-bold text-lg">{formatCurrency(selectedSolicitacao.valor_solicitado)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>

            {anexos.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader><CardTitle>Documentos do Suprido</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {anexos.map((anexo) => (
                    <div key={anexo.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 truncate"><FileText className="w-4 h-4 text-blue-600 shrink-0" /><p className="font-medium truncate text-sm">{anexo.nome_original}</p></div>
                      <Button variant="outline" size="sm" asChild><a href={anexo.url_assinada} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4 mr-2" />Ver</a></Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <AdminAnexosSection
              ownerTipo="solicitacao"
              ownerId={selectedSolicitacao.id}
              anexos={anexosAdmin}
              onAnexosChange={setAnexosAdmin}
              user={{ role: 'admin' }}
            />

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Controle de Status</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusControl
                  solicitacao={selectedSolicitacao}
                  onStatusChanged={handleStatusChanged}
                  disabled={loading}
                />
              </CardContent>
            </Card>

            <StatusTimeline solicitacaoId={selectedSolicitacao.id} />
          </div>
        ) : (
          <Card className="border-none shadow-lg">
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Selecione uma solicitação para ver os detalhes</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
