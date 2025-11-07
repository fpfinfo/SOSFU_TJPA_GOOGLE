
import React, { useEffect, useMemo, useState } from "react";
import { User } from "@/api/entities";
import { Comarca } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Search, Pencil, Upload, Save, Loader2, User as UserIcon } from "lucide-react";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import PaginationControls from "@/components/ui/PaginationControls"; // Added import

export default function GerenciarUsuarios() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [comarcas, setComarcas] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Edição
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome_completo_customizado: "",
    cpf: "",
    cargo: "",
    lotacao: "",
    telefone: "",
    setor: "",
    gestor_responsavel: "",
    municipio: "",
    banco_nome: "",
    banco_codigo: "",
    agencia: "",
    conta: "",
    tipo_conta: "",
    comarca_id: ""
  });

  // Importação CSV
  const [importing, setImporting] = useState(false);

  // Paginação (novos estados)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, c] = await Promise.all([
        User.list(), // lista todos os usuários disponíveis
        Comarca.list("nome"),
      ]);
      setUsers(u || []);
      setComarcas(c || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return users;
    return users.filter(u =>
      (u.full_name || "").toLowerCase().includes(t) ||
      (u.email || "").toLowerCase().includes(t) ||
      (u.cpf || "").toLowerCase().includes(t) ||
      (u.lotacao || "").toLowerCase().includes(t)
    );
  }, [users, search]);

  // Paginação a partir do filtro atual
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      nome_completo_customizado: u.nome_completo_customizado || "",
      cpf: u.cpf || "",
      cargo: u.cargo || "",
      lotacao: u.lotacao || "",
      telefone: u.telefone || "",
      setor: u.setor || "",
      gestor_responsavel: u.gestor_responsavel || "",
      municipio: u.municipio || "",
      banco_nome: u.banco_nome || "",
      banco_codigo: u.banco_codigo || "",
      agencia: u.agencia || "",
      conta: u.conta || "",
      tipo_conta: u.tipo_conta || "",
      comarca_id: u.comarca_id || ""
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = { ...form };
      const updated = await User.update(editing.id, payload);
      toast({ title: "Salvo!", description: `Dados de ${editing.full_name || editing.email} atualizados.` });
      setEditing(null);
      // Atualiza na lista local
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível atualizar o usuário." });
    } finally {
      setSaving(false);
    }
  };

  const handleImportCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const { file_url } = await UploadFile({ file });
      const schema = {
        type: "object",
        properties: {
          email: { type: "string" },
          nome_completo_customizado: { type: "string" },
          cpf: { type: "string" },
          cargo: { type: "string" },
          lotacao: { type: "string" },
          telefone: { type: "string" },
          setor: { type: "string" },
          gestor_responsavel: { type: "string" },
          municipio: { type: "string" },
          banco_nome: { type: "string" },
          banco_codigo: { type: "string" },
          agencia: { type: "string" },
          conta: { type: "string" },
          tipo_conta: { type: "string" },
          comarca_id: { type: "string" }
        },
      };
      const res = await ExtractDataFromUploadedFile({ file_url, json_schema: schema });
      if (res.status !== "success" || !res.output) throw new Error(res.details || "Falha ao processar CSV");
      const rows = Array.isArray(res.output) ? res.output : [res.output];

      // Recarrega usuários para garantir base atual
      const allUsers = await User.list();
      let updatedCount = 0;
      let notFoundEmails = [];

      for (const row of rows) {
        const email = (row.email || "").toLowerCase().trim();
        if (!email) continue;
        const target = allUsers.find(u => (u.email || "").toLowerCase() === email);
        if (!target) {
          notFoundEmails.push(email);
          continue;
        }
        const payload = { ...row };
        delete payload.email; // não atualiza email/role
        await User.update(target.id, payload);
        updatedCount += 1;
      }

      toast({ title: "Importação concluída", description: `Atualizados ${updatedCount} usuário(s).${notFoundEmails.length ? ` Não encontrados: ${notFoundEmails.slice(0,3).join(", ")}${notFoundEmails.length > 3 ? "..." : ""}` : ""}` });
      await loadData();
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erro na importação", description: "Verifique o arquivo e tente novamente." });
    } finally {
      setImporting(false);
      e.target.value = ""; // reset input
    }
  };

  return (
    <div className="p-6 space-y-6">
      <LoadingOverlay show={loading || importing || saving} text={importing ? "Importando CSV..." : (saving ? "Salvando alterações..." : "Carregando dados...")} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-600 mt-1">Administre os dados complementares de todos os usuários</p>
        </div>
      </div>

      {/* Import CSV */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Importar CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">
            Colunas aceitas: email, nome_completo_customizado, cpf, cargo, lotacao, telefone, setor, gestor_responsavel, municipio, banco_nome, banco_codigo, agencia, conta, tipo_conta, comarca_id.
          </div>
          <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors block">
            <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
            {importing ? "Processando CSV..." : "Clique para selecionar o arquivo CSV"}
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCsv} disabled={importing} />
          </label>
        </CardContent>
      </Card>

      {/* Filtro */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
            placeholder="Buscar por nome, email, CPF ou lotação..."
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden sm:inline">{filtered.length} resultado(s)</span>
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
        </div>
      </div>

      {/* Tabela */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Nome</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Função</th>
                    <th className="p-3 text-left">CPF</th>
                    <th className="p-3 text-left">Cargo</th>
                    <th className="p-3 text-left">Lotação</th>
                    <th className="p-3 text-left">Município</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                          <span className="font-medium">{u.nome_completo_customizado || u.full_name || "-"}</span>
                        </div>
                      </td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.role === "admin" ? "Administrador" : "Usuário"}</td>
                      <td className="p-3">{u.cpf || "-"}</td>
                      <td className="p-3">{u.cargo || "-"}</td>
                      <td className="p-3">{u.lotacao || "-"}</td>
                      <td className="p-3">{u.municipio || "-"}</td>
                      <td className="p-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr><td className="p-6 text-center text-gray-500" colSpan={8}>Nenhum usuário encontrado.</td></tr>
                  )}
                </tbody>
              </table>

              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="mt-4"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Edição */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo</Label>
                  <Input value={form.nome_completo_customizado} onChange={e => setForm(f => ({...f, nome_completo_customizado: e.target.value}))} />
                </div>
                <div>
                  <Label>CPF</Label>
                  <Input value={form.cpf} onChange={e => setForm(f => ({...f, cpf: e.target.value}))} placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label>Cargo</Label>
                  <Input value={form.cargo} onChange={e => setForm(f => ({...f, cargo: e.target.value}))} />
                </div>
                <div>
                  <Label>Lotação</Label>
                  <Input value={form.lotacao} onChange={e => setForm(f => ({...f, lotacao: e.target.value}))} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={e => setForm(f => ({...f, telefone: e.target.value}))} />
                </div>
                <div>
                  <Label>Setor</Label>
                  <Input value={form.setor} onChange={e => setForm(f => ({...f, setor: e.target.value}))} />
                </div>
                <div className="md:col-span-2">
                  <Label>Gestor Responsável</Label>
                  <Input value={form.gestor_responsavel} onChange={e => setForm(f => ({...f, gestor_responsavel: e.target.value}))} />
                </div>
                <div>
                  <Label>Município</Label>
                  <Input value={form.municipio} onChange={e => setForm(f => ({...f, municipio: e.target.value}))} />
                </div>
                <div>
                  <Label>Comarca</Label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.comarca_id}
                    onChange={e => setForm(f => ({...f, comarca_id: e.target.value}))}
                  >
                    <option value="">Selecione</option>
                    {comarcas.map(c => <option key={c.id} value={c.id}>{c.nome}{c.municipio ? ` - ${c.municipio}` : ""}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div><Label>Banco</Label><Input value={form.banco_nome} onChange={e => setForm(f => ({...f, banco_nome: e.target.value}))} /></div>
                <div><Label>Código</Label><Input value={form.banco_codigo} onChange={e => setForm(f => ({...f, banco_codigo: e.target.value}))} /></div>
                <div><Label>Agência</Label><Input value={form.agencia} onChange={e => setForm(f => ({...f, agencia: e.target.value}))} /></div>
                <div><Label>Conta</Label><Input value={form.conta} onChange={e => setForm(f => ({...f, conta: e.target.value}))} /></div>
                <div><Label>Tipo</Label><Input value={form.tipo_conta} onChange={e => setForm(f => ({...f, tipo_conta: e.target.value}))} /></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
