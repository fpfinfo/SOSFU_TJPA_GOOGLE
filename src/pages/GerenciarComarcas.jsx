
import React, { useEffect, useState } from "react";
import { Comarca } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Save, Trash2, Upload, Loader2, Search } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { maskCNPJ, onlyDigits } from "@/components/utils/masks";
import PaginationControls from "@/components/ui/PaginationControls";

export default function GerenciarComarcas() {
  const { toast } = useToast();
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(() => {
    try {
      const savedForm = localStorage.getItem('comarcaFormDraft');
      return savedForm ? JSON.parse(savedForm) : { nome: "", municipio: "", cnpj: "", banco_nome: "", banco_codigo: "", agencia: "", conta: "", tipo_conta: "" };
    } catch (error) {
      console.error("Failed to parse local storage draft:", error);
      return { nome: "", municipio: "", cnpj: "", banco_nome: "", banco_codigo: "", agencia: "", conta: "", tipo_conta: "" };
    }
  });
  const [editingId, setEditingId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [isDragging, setIsDragging] = useState(false);
  // Novos estados para UX de lista
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    try {
      const data = await Comarca.list("-created_date");
      setLista(data);
    } catch (error) {
      console.error("Erro ao carregar comarcas:", error);
      toast({ variant: "destructive", title: "Erro ao carregar", description: "Não foi possível carregar a lista de comarcas." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    try {
      localStorage.setItem('comarcaFormDraft', JSON.stringify(form));
    } catch (error) {
      console.error("Failed to save form to local storage:", error);
    }
  }, [form]);

  const salvar = async () => {
    setLoading(true);
    try {
      if (editingId) {
        await Comarca.update(editingId, form);
        toast({ title: "Comarca atualizada", description: "Dados da comarca foram salvos." });
      } else {
        await Comarca.create(form);
        toast({ title: "Comarca criada", description: "Nova comarca adicionada com sucesso." });
      }
      setForm({ nome: "", municipio: "", cnpj: "", banco_nome: "", banco_codigo: "", agencia: "", conta: "", tipo_conta: "" });
      localStorage.removeItem('comarcaFormDraft'); // Clear draft after successful save
      setEditingId(null);
      await load();
    } catch (error) {
      console.error("Erro ao salvar comarca:", error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Ocorreu um erro ao salvar a comarca." });
    } finally {
      setLoading(false);
    }
  };

  const editar = (c) => {
    setEditingId(c.id);
    setForm({
      nome: c.nome || "",
      municipio: c.municipio || "",
      cnpj: c.cnpj || "",
      banco_nome: c.banco_nome || "",
      banco_codigo: c.banco_codigo || "",
      agencia: c.agencia || "",
      conta: c.conta || "",
      tipo_conta: c.tipo_conta || ""
    });
  };

  const excluir = async (id) => {
    setConfirm({ open: true, id });
  };

  const onConfirmDelete = async () => {
    if (!confirm.id) return;
    setConfirm({ open: false, id: null });
    setLoading(true);
    try {
      await Comarca.delete(confirm.id);
      toast({ title: "Comarca excluída", description: "A comarca foi removida com sucesso." });
      await load();
    } catch (error) {
      console.error("Erro ao excluir comarca:", error);
      toast({ variant: "destructive", title: "Erro ao excluir", description: "Ocorreu um erro ao excluir a comarca." });
    } finally {
      setLoading(false);
    }
  };

  const processImportFile = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const { file_url } = await UploadFile({ file });
      const schema = {
        type: "object",
        properties: {
          nome: { type: "string" },
          municipio: { type: "string" },
          cnpj: { type: "string" },
          banco_nome: { type: "string" },
          banco_codigo: { type: "string" },
          agencia: { type: "string" },
          conta: { type: "string" },
          tipo_conta: { type: "string" }
        }
      };
      const res = await ExtractDataFromUploadedFile({ file_url, json_schema: schema });
      if (res.status !== "success" || !res.output) throw new Error(res.details || "Falha ao processar CSV");
      const rows = Array.isArray(res.output) ? res.output : [res.output];

      const existentes = await Comarca.list();
      const byCnpj = new Map();
      const byNomeMunicipio = new Map();
      for (const c of existentes) {
        if (c.cnpj) byCnpj.set((c.cnpj || "").trim(), c);
        const key = `${(c.nome || "").trim().toLowerCase()}|${(c.municipio || "").trim().toLowerCase()}`;
        byNomeMunicipio.set(key, c);
      }

      let created = 0, updated = 0;
      for (const r of rows) {
        const payload = {
          nome: (r.nome || "").trim(),
          municipio: (r.municipio || "").trim(),
          cnpj: (r.cnpj || "").trim(),
          banco_nome: (r.banco_nome || "").trim(),
          banco_codigo: (r.banco_codigo || "").trim(),
          agencia: (r.agencia || "").trim(),
          conta: (r.conta || "").trim(),
          tipo_conta: (r.tipo_conta || "").trim(),
        };

        let target = null;
        if (payload.cnpj) {
          target = byCnpj.get(payload.cnpj);
        }
        if (!target) {
          const k = `${payload.nome.toLowerCase()}|${payload.municipio.toLowerCase()}`;
          target = byNomeMunicipio.get(k);
        }

        if (target) {
          await Comarca.update(target.id, payload);
          updated += 1;
        } else {
          await Comarca.create(payload);
          created += 1;
        }
      }

      toast({ title: "Importação concluída", description: `${created} criada(s), ${updated} atualizada(s).` });
      await load();
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erro na importação", description: "Verifique o arquivo e tente novamente." });
    } finally {
      setImporting(false);
    }
  };

  const handleImportCsv = (e) => {
    const file = e.target.files?.[0];
    processImportFile(file);
    e.target.value = ""; // Clear the input value
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processImportFile(file);
  };

  // Derivados: filtro e paginação
  const filtered = lista.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const fields = [
      c.nome || "",
      c.municipio || "",
      c.cnpj || "",
      c.banco_nome || "",
      c.banco_codigo || "",
      c.agencia || "",
      c.conta || "",
      c.tipo_conta || "",
    ].join(" ").toLowerCase();
    return fields.includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6 space-y-6">
      <LoadingOverlay show={loading || importing} text={importing ? "Importando CSV..." : "Carregando..."} />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Comarcas</h1>
      </div>

      {/* Import CSV */}
      <Card className="border-none shadow-lg">
        <CardHeader><CardTitle>Importar CSV</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">Colunas aceitas: nome, municipio, cnpj, banco_nome, banco_codigo, agencia, conta, tipo_conta.</div>
          <label
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors block ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-500"}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
            {importing ? "Processando CSV..." : (isDragging ? "Solte o arquivo aqui..." : "Clique para selecionar ou arraste o arquivo CSV")}
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCsv} disabled={importing || loading} />
          </label>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader><CardTitle>{editingId ? "Editar Comarca" : "Nova Comarca"}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} disabled={loading || importing} />
          <Input placeholder="Município" value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} disabled={loading || importing} />
          <Input placeholder="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: maskCNPJ(e.target.value) })} disabled={loading || importing} />
          <Input placeholder="Banco" value={form.banco_nome} onChange={(e) => setForm({ ...form, banco_nome: e.target.value })} disabled={loading || importing} />
          <Input placeholder="Código Banco" value={form.banco_codigo} onChange={(e) => setForm({ ...form, banco_codigo: onlyDigits(e.target.value) })} disabled={loading || importing} />
          <Input placeholder="Agência" value={form.agencia} onChange={(e) => setForm({ ...form, agencia: e.target.value })} disabled={loading || importing} />
          <Input placeholder="Conta" value={form.conta} onChange={(e) => setForm({ ...form, conta: e.target.value })} disabled={loading || importing} />
          <Input placeholder="Tipo Conta" value={form.tipo_conta} onChange={(e) => setForm({ ...form, tipo_conta: e.target.value })} disabled={loading || importing} />
          <div className="col-span-full flex justify-end">
            <Button onClick={salvar} disabled={importing || loading}>
              {(importing || loading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editingId ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Comarcas Cadastradas</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, município, CNPJ..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-10"
                  disabled={loading || importing}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">{filtered.length} registro(s)</span>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  disabled={loading || importing}
                  title="Itens por página"
                >
                  <option value={10}>10/página</option>
                  <option value={20}>20/página</option>
                  <option value={50}>50/página</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Município</th>
                  <th className="p-3 text-left">CNPJ</th>
                  <th className="p-3 text-left">Banco</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{c.nome}</td>
                    <td className="p-3">{c.municipio || "-"}</td>
                    <td className="p-3">{c.cnpj || "-"}</td>
                    <td className="p-3">{c.banco_nome || "-"}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => editar(c)} disabled={loading || importing}>Editar</Button>
                        <Button variant="outline" size="sm" className="text-red-600" onClick={() => excluir(c.id)} disabled={loading || importing}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td className="p-6 text-center text-gray-500" colSpan={5}>Nenhuma comarca encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="mt-4"
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(open) => setConfirm((prev) => ({ ...prev, open }))}
        title="Excluir comarca"
        description="Esta ação não poderá ser desfeita. Deseja realmente excluir esta comarca?"
        confirmLabel="Excluir"
        confirmVariant="destructive"
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
