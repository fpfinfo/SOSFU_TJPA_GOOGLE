
import React, { useEffect, useState, useCallback } from "react";
import { Reembolso } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Eye, Plus, Search, Pencil, Filter, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCurrentUser } from "@/components/utils/UserContext";
import EmptyState from "@/components/ui/EmptyState";
import { useAppToasts } from "@/components/utils/toastUtils";

const formatCurrency = (value) => (Number(value) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Helper to get status specific styling
const getStatusBadgeClass = (status) => {
  const baseClasses = "rounded-full px-2 py-0.5 text-xs font-medium inline-block whitespace-nowrap";
  switch (status) {
    case "rascunho":
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case "pendente":
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case "em_analise":
      return `${baseClasses} bg-purple-100 text-purple-800`;
    case "aprovado":
      return `${baseClasses} bg-green-100 text-green-800`;
    case "glosa":
      return `${baseClasses} bg-orange-100 text-orange-800`;
    case "rejeitado":
      return `${baseClasses} bg-red-100 text-red-800`;
    case "concluido":
      return `${baseClasses} bg-gray-100 text-gray-800`;
    default:
      return `${baseClasses} bg-gray-200 text-gray-700`; // Default for unknown status
  }
};

export default function MeusReembolsos() {
  const user = useCurrentUser();
  const [reembolsos, setReembolsos] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState("data"); // 'data' | 'valor' | 'protocolo'
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  // const toasts = useAppToasts();  // mantido import, mas não usado aqui para não afetar dependências

  // NEW: guards para single-flight + throttling
  const inFlightRef = React.useRef(false);
  const lastFetchAtRef = React.useRef(0);
  const lastEmailRef = React.useRef(null);
  const MIN_FETCH_INTERVAL = 8000; // 8s

  // NEW: redireciona admin para página correta
  useEffect(() => {
    if (user?.role === "admin") {
      window.location.href = createPageUrl("AnaliseReembolso");
    }
  }, [user?.role]);

  // CHANGED: fetch estável (não depende de objetos mutáveis)
  const fetchReembolsos = useCallback(async (email) => {
    if (!email) return;
    const data = await Reembolso.filter({ created_by: email }, "-created_date");
    setReembolsos(data);
  }, []);

  // CHANGED: effect robusto, com single-flight + throttle, dispara só quando o email muda
  useEffect(() => {
    const email = user?.email;
    if (!email) return;

    const now = Date.now();
    if (inFlightRef.current) return;
    if (lastEmailRef.current === email && now - lastFetchAtRef.current < MIN_FETCH_INTERVAL) {
      return; // throttle: já buscamos recentemente para este email
    }

    inFlightRef.current = true;
    // opcional: setLoading visual — aqui mantemos a UX atual
    // se quiser, habilite um loading local
    // setLoading(true);

    fetchReembolsos(email)
      .catch((e) => {
        // Evita loops de re-render por toast; apenas logamos
        console.error("[MeusReembolsos] Falha ao carregar reembolsos:", e?.message || e);
      })
      .finally(() => {
        inFlightRef.current = false;
        lastFetchAtRef.current = Date.now();
        lastEmailRef.current = email;
        // setLoading(false);
      });
  }, [user?.email, fetchReembolsos]);

  const filtered = reembolsos.filter((r) => {
    const s = status === "all" || r.status === status;
    const q = search === "" || (r.protocolo || "").toLowerCase().includes(search.toLowerCase());
    const df = !dateFrom || (r.data_reembolso && r.data_reembolso >= dateFrom);
    const dt = !dateTo || (r.data_reembolso && r.data_reembolso <= dateTo);
    return s && q && df && dt;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av, bv;
    if (sortKey === "data") {
      av = a.data_reembolso || "";
      bv = b.data_reembolso || "";
    } else if (sortKey === "valor") {
      av = Number(a.valor_total_comprovado) || 0;
      bv = Number(b.valor_total_comprovado) || 0;
    } else { // sortKey === "protocolo"
      av = a.protocolo || "";
      bv = b.protocolo || "";
    }

    // Handle empty values for string sorting to ensure consistency
    if (typeof av === 'string' && typeof bv === 'string') {
        const compareResult = av.localeCompare(bv);
        return sortDir === "asc" ? compareResult : -compareResult;
    }

    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize);

  const switchSort = (key) => {
    setPage(1); // Reset page to 1 when sort changes
    if (sortKey === key) setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  // Effect to reset page number if filters change and current page becomes invalid
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
    if (page < 1 && totalPages >= 1) { // If totalPages is 0, page remains 1 which is fine
        setPage(1);
    }
  }, [totalPages, page]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Reembolsos</h1>
          <p className="text-gray-600 mt-1">Solicite e acompanhe seus reembolsos de despesa</p>
        </div>
        <Link to={createPageUrl("NovoReembolso")}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Reembolso
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Buscar por protocolo..." value={search} onChange={(e) => {setSearch(e.target.value); setPage(1);}} className="pl-10" />
            </div>
            <select className="border rounded px-3 py-2" value={status} onChange={(e) => {setStatus(e.target.value); setPage(1);}}>
              <option value="all">Todos status</option>
              <option value="rascunho">Rascunho</option>
              <option value="pendente">Pendente</option>
              <option value="em_analise">Em Análise</option>
              <option value="aprovado">Aprovado</option>
              <option value="glosa">Glosa</option>
              <option value="rejeitado">Rejeitado</option>
              <option value="concluido">Concluído</option>
            </select>
            <div className="flex gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => {setDateFrom(e.target.value); setPage(1);}} />
              <Input type="date" value={dateTo} onChange={(e) => {setDateTo(e.target.value); setPage(1);}} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-semibold">
                    <button className="inline-flex items-center gap-1" onClick={() => switchSort("protocolo")}>
                      Protocolo
                      {sortKey === "protocolo" ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                    </button>
                  </th>
                  <th className="p-3 text-left font-semibold">
                    <button className="inline-flex items-center gap-1" onClick={() => switchSort("data")}>
                      Data
                      {sortKey === "data" ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                    </button>
                  </th>
                  <th className="p-3 text-right font-semibold">
                    <button className="inline-flex items-center gap-1" onClick={() => switchSort("valor")}>
                      Total
                      {sortKey === "valor" ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                    </button>
                  </th>
                  <th className="p-3 text-center font-semibold">Status</th>
                  <th className="p-3 text-center font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{r.protocolo}</td>
                    <td className="p-3">{r.data_reembolso || "-"}</td>
                    <td className="p-3 text-right">{formatCurrency(r.valor_total_comprovado)}</td>
                    <td className="p-3 text-center">
                        <span className={getStatusBadgeClass(r.status)}>
                            {r.status}
                        </span>
                    </td>
                    <td className="p-3 text-center">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={createPageUrl(r.status === "rascunho" || r.status === "glosa" ? `NovoReembolso?id=${r.id}` : `DetalheReembolso?id=${r.id}`)}>
                          {r.status === "rascunho" || r.status === "glosa" ? <Pencil className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                          {r.status === "rascunho" || r.status === "glosa" ? "Editar" : "Ver"}
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
              title="Nenhum reembolso encontrado"
              description="Crie um novo pedido de reembolso."
              action={
                <Link to={createPageUrl("NovoReembolso")}>
                  <Button className="bg-blue-600 hover:bg-blue-700">Novo Reembolso</Button>
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
