
import React, { useState, useEffect, useCallback, useRef } from "react";
import { SolicitacaoSuprimento } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Eye, Plus, Search, Pencil, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import StatusBadge from "../components/status/StatusBadge";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/components/utils/UserContext";
import EmptyState from "@/components/ui/EmptyState";
import { formatDateBR } from "@/components/utils/dateUtils";
import { useAppToasts } from "@/components/utils/toastUtils";
// import { usePolling } from "@/components/utils/usePolling"; // Removed usePolling

const formatCurrency = (value) => {
    if (typeof value !== 'number') value = Number(value) || 0;
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function MinhasSolicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = "";
  const [sortKey, setSortKey] = useState("data"); // 'data' | 'valor' | 'numero'
  const [sortDir, setSortDir] = useState("desc"); // 'asc' | 'desc'
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const user = useCurrentUser();
  const toasts = useAppToasts();

  // NEW: guards para single-flight e carga única por usuário
  const lastEmailRef = useRef(null);
  const inFlightRef = useRef(false);

  const fetchSolicitacoes = useCallback(async (email) => {
    if (!email) return; // Should not happen if called correctly, but as a safeguard.
    if (inFlightRef.current) return; // Prevent concurrent calls

    inFlightRef.current = true;
    setLoading(true); // Always set loading to true when starting a fetch
    try {
      const data = await SolicitacaoSuprimento.filter({ created_by: email }, '-created_date');
      setSolicitacoes(data);
      lastEmailRef.current = email; // Mark that data for this email has been loaded
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
      toasts.error("Falha ao carregar suas solicitações");
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [toasts]); // atualizado: inclui 'toasts' como dependência

  useEffect(() => {
    const email = user?.email;

    // If user is not yet available, keep loading state visible.
    // This covers the initial render where user context might not be ready.
    if (!email) {
      setLoading(true); // Keep loading if user is not available yet
      return;
    }

    // If data for this email has already been fetched, skip a new fetch.
    if (lastEmailRef.current === email) { // já carregado para este usuário
      setLoading(false); // If already loaded, turn off loading
      return;
    }

    fetchSolicitacoes(email);
  }, [user, fetchSolicitacoes]); // atualizado: inclui a função nas dependências
  
  // Atualização automática removida para voltar ao comportamento anterior
  // usePolling(fetchSolicitacoes, 10000, !!user); // Removed usePolling hook

  const filteredSolicitacoes = solicitacoes.filter(s => {
    const matchesText =
      s.numero_solicitacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.justificativa.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Ensure data_solicitacao is treated as a string for comparison or convert to Date objects if needed
    // Assuming data_solicitacao is in a sortable string format like "YYYY-MM-DD"
    const solicitacaoDate = s.data_solicitacao; 
    const df = !dateFrom || (solicitacaoDate && solicitacaoDate >= dateFrom);
    const dt = !dateTo || (solicitacaoDate && solicitacaoDate <= dateTo);
    return matchesText && df && dt;
  });

  const sorted = [...filteredSolicitacoes].sort((a, b) => {
    let av, bv;
    if (sortKey === "data") {
      av = a.data_solicitacao || "";
      bv = b.data_solicitacao || "";
    } else if (sortKey === "valor") {
      av = Number(a.valor_solicitado) || 0;
      bv = Number(b.valor_solicitado) || 0;
    } else { // 'numero'
      av = a.numero_solicitacao || "";
      bv = b.numero_solicitacao || "";
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize);

  const switchSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc"); // Default to ascending when changing sort key
    }
    setPage(1); // Reset to first page on sort change
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Solicitações</h1>
          <p className="text-gray-600 mt-1">Acompanhe todos os seus pedidos de suprimento</p>
        </div>
        <Link to={createPageUrl("NovoSuprimento")}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Solicitação
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Buscar por número ou justificativa..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Input 
                type="date" 
                value={dateFrom} 
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} 
                placeholder="Data Inicial"
            />
            <Input 
                type="date" 
                value={dateTo} 
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }} 
                placeholder="Data Final"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-semibold">
                    <button className="inline-flex items-center gap-1 group" onClick={() => switchSort("numero")}>
                      Número <ArrowUpDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      {sortKey === "numero" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </button>
                  </th>
                  <th className="p-3 text-left font-semibold">
                    <button className="inline-flex items-center gap-1 group" onClick={() => switchSort("data")}>
                      Data <ArrowUpDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      {sortKey === "data" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </button>
                  </th>
                  <th className="p-3 text-left font-semibold">Justificativa</th>
                  <th className="p-3 text-right font-semibold">
                    <button className="inline-flex items-center gap-1 group" onClick={() => switchSort("valor")}>
                      Valor <ArrowUpDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      {sortKey === "valor" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </button>
                  </th>
                  <th className="p-3 text-center font-semibold">Status</th>
                  <th className="p-3 text-center font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((solicitacao) => (
                  <tr key={solicitacao.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{solicitacao.numero_solicitacao}</td>
                    <td className="p-3">{formatDateBR(solicitacao.data_solicitacao)}</td>
                    <td className="p-3 truncate max-w-xs">{solicitacao.justificativa}</td>
                    <td className="p-3 text-right">{formatCurrency(solicitacao.valor_solicitado)}</td>
                    <td className="p-3 text-center"><StatusBadge status={solicitacao.status} /></td>
                    <td className="p-3 text-center">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={createPageUrl(solicitacao.status === 'rascunho' ? `NovoSuprimento?id=${solicitacao.id}` : `DetalheSolicitacao?id=${solicitacao.id}`)}>
                          {solicitacao.status === 'rascunho' ? <Pencil className="w-4 h-4 mr-1"/> : <Eye className="w-4 h-4 mr-1"/>}
                          {solicitacao.status === 'rascunho' ? 'Editar' : 'Ver'}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-600">
              Página {page} de {totalPages} • {sorted.length} registro(s)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Próxima</Button>
            </div>
          </div>

          {sorted.length === 0 && (
            <EmptyState
              title="Nenhuma solicitação encontrada"
              description="Crie uma nova solicitação de suprimento para começar."
              action={
                <Link to={createPageUrl("NovoSuprimento")}>
                  <Button className="bg-blue-600 hover:bg-blue-700">Nova Solicitação</Button>
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
