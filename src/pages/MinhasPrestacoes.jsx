
import React, { useEffect, useState, useCallback, useRef } from "react";
import { PrestacaoContas } from "@/api/entities";
import { SolicitacaoSuprimento } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Eye, Plus, Search, Pencil, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCurrentUser } from "@/components/utils/UserContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import StatusBadge from "@/components/status/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { useAppToasts } from "@/components/utils/toastUtils";

export default function MinhasPrestacoes() {
  const user = useCurrentUser();
  const [prestacoes, setPrestacoes] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState("data"); // 'data' | 'valor' | 'protocolo'
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const toasts = useAppToasts();

  // NEW: guards para single-flight e carga única por usuário
  const lastEmailRef = useRef(null);
  const inFlightRef = useRef(false);

  const fetchPrestacoes = useCallback(async (email) => {
    if (!email) return; // Defensive check, should be handled by useEffect as well.
    if (inFlightRef.current) return; // Prevent multiple concurrent fetches.

    inFlightRef.current = true;
    try {
      const data = await PrestacaoContas.filter({ created_by: email }, "-created_date");
      setPrestacoes(data);
      lastEmailRef.current = email; // Store the email for which data was successfully fetched.
    } catch (e) {
      console.error(e);
      toasts.error("Falha ao carregar suas prestações");
    } finally {
      inFlightRef.current = false;
    }
  }, [toasts]); // atualizado: inclui 'toasts' como dependência

  useEffect(() => {
    const email = user?.email;
    if (!email) return; // No user email available, nothing to fetch.
    if (lastEmailRef.current === email) return; // Data for this email is already loaded.
    if (inFlightRef.current) return; // A fetch is already ongoing.

    fetchPrestacoes(email);
  }, [user, fetchPrestacoes]); // atualizado: inclui a função nas dependências

  const filtered = prestacoes.filter((p) => {
    const q = (p.protocolo || "").toLowerCase().includes(search.toLowerCase()) ||
              (p.solicitacao_numero_snapshot || "").toLowerCase().includes(search.toLowerCase());
    const d = p.data_prestacao; // Assuming data_prestacao is in YYYY-MM-DD format for direct string comparison
    const df = !dateFrom || (d && d >= dateFrom);
    const dt = !dateTo || (d && d <= dateTo);
    return q && df && dt;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av, bv;
    if (sortKey === "data") {
      av = a.data_prestacao || "";
      bv = b.data_prestacao || "";
    } else if (sortKey === "valor") {
      av = Number(a.valor_total_comprovado) || 0;
      bv = Number(b.valor_total_comprovado) || 0;
    } else { // default to 'protocolo'
      av = a.protocolo || "";
      bv = b.protocolo || "";
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize);

  const switchSort = (key) => {
    if (sortKey === key) setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1); // Reset page on sort change
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Prestações</h1>
          <p className="text-gray-600 mt-1">Envie e acompanhe suas prestações de contas</p>
        </div>
        <Link to={createPageUrl("NovaPrestacao")}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Prestação
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por protocolo ou nº da solicitação..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Input 
              type="date" 
              value={dateFrom} 
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} 
              title="Data de início" 
            />
            <Input 
              type="date" 
              value={dateTo} 
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }} 
              title="Data de fim" 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-semibold">
                    <button className="inline-flex items-center gap-1" onClick={() => switchSort("protocolo")}>
                      Protocolo {sortKey === "protocolo" ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                    </button>
                  </th>
                  <th className="p-3 text-left font-semibold">Solicitação</th>
                  <th className="p-3 text-left font-semibold">
                    <button className="inline-flex items-center gap-1" onClick={() => switchSort("data")}>
                      Data {sortKey === "data" ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                    </button>
                  </th>
                  <th className="p-3 text-right font-semibold">
                    <button className="inline-flex items-center gap-1" onClick={() => switchSort("valor")}>
                      Total Comprovado {sortKey === "valor" ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                    </button>
                  </th>
                  <th className="p-3 text-center font-semibold">Status</th>
                  <th className="p-3 text-center font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{p.protocolo}</td>
                    <td className="p-3">{p.solicitacao_numero_snapshot || "-"}</td>
                    <td className="p-3">{p.data_prestacao ? format(new Date(p.data_prestacao), "dd/MM/yyyy", { locale: ptBR }) : "-"}</td>
                    <td className="p-3 text-right">
                      {(p.valor_total_comprovado || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="p-3 text-center"><StatusBadge status={p.status} /></td>
                    <td className="p-3 text-center">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={createPageUrl(p.status === "rascunho" || p.status === "glosa" ? `NovaPrestacao?id=${p.id}` : `DetalhePrestacao?id=${p.id}`)}>
                          {p.status === "rascunho" || p.status === "glosa" ? <Pencil className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                          {p.status === "rascunho" || p.status === "glosa" ? "Editar" : "Ver"}
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
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Proxima</Button>
            </div>
          </div>

          {sorted.length === 0 && (
            <EmptyState
              title="Nenhuma prestação encontrada"
              description="Registre uma nova prestação vinculada a uma solicitação."
              action={
                <Link to={createPageUrl("NovaPrestacao")}>
                  <Button className="bg-blue-600 hover:bg-blue-700">Nova Prestação</Button>
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
