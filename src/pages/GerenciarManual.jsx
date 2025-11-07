import React, { useEffect, useState } from "react";
import { ManualSection } from "@/api/entities";
import { useCurrentUser } from "@/components/utils/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Pencil, Trash2, Save, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ReactQuill from "react-quill";

export default function GerenciarManual() {
  const user = useCurrentUser();
  const { toast } = useToast();
  const [sections, setSections] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", slug: "", category: "", order: 0, is_published: true, content: "" });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  useEffect(() => { load(); }, []);
  const load = async () => {
    const data = await ManualSection.list("order");
    setSections(data);
  };

  if (!user || user.role !== "admin") {
    return <div className="p-6 text-gray-600">Acesso restrito aos administradores.</div>;
  }

  const filtered = sections
    .filter(s => {
      const t = `${s.title} ${s.category} ${s.content}`.toLowerCase();
      return search.trim() === "" || t.includes(search.toLowerCase());
    })
    .sort((a,b) => (a.order ?? 0) - (b.order ?? 0));

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", slug: "", category: "", order: 0, is_published: true, content: "" });
    setModalOpen(true);
  };
  const openEdit = (sec) => {
    setEditing(sec);
    setForm({ title: sec.title || "", slug: sec.slug || "", category: sec.category || "", order: sec.order || 0, is_published: !!sec.is_published, content: sec.content || "" });
    setModalOpen(true);
  };
  const save = async () => {
    const payload = { ...form, order: Number(form.order) || 0 };
    if (!payload.slug) {
      payload.slug = payload.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]+/g, "-").replace(/(^-|-$)/g, "");
    }
    if (editing) {
      await ManualSection.update(editing.id, payload);
      toast({ title: "Seção atualizada" });
    } else {
      await ManualSection.create(payload);
      toast({ title: "Seção criada" });
    }
    setModalOpen(false);
    await load();
  };
  const onDelete = async () => {
    if (!confirmDelete.id) return;
    await ManualSection.delete(confirmDelete.id);
    toast({ title: "Seção excluída" });
    setConfirmDelete({ open: false, id: null });
    await load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Manual</h1>
            <p className="text-gray-600">Crie, edite e publique seções do manual</p>
          </div>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Seção</Button>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input className="pl-10" placeholder="Buscar seções..." value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s.id} className="flex items-start justify-between p-3 rounded-lg border hover:shadow-sm">
                <div className="pr-4">
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-gray-500">slug: {s.slug || "-"}</div>
                  <div className="mt-1 flex gap-2 flex-wrap">
                    {s.category && <Badge variant="outline">{s.category}</Badge>}
                    <Badge variant="outline">ordem {s.order ?? 0}</Badge>
                    <Badge className={s.is_published ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}>
                      {s.is_published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={()=>openEdit(s)}><Pencil className="w-4 h-4 mr-1" />Editar</Button>
                  <Button variant="destructive" size="sm" onClick={()=>setConfirmDelete({ open: true, id: s.id })}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-gray-500 p-4">Nenhuma seção encontrada.</div>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Seção" : "Nova Seção"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e)=>setForm(f=>({...f, title: e.target.value}))} />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input type="number" value={form.order} onChange={(e)=>setForm(f=>({...f, order: e.target.value}))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Slug (opcional)</Label>
                <Input value={form.slug} onChange={(e)=>setForm(f=>({...f, slug: e.target.value}))} placeholder="ex: introducao" />
              </div>
              <div>
                <Label>Categoria (opcional)</Label>
                <Input value={form.category} onChange={(e)=>setForm(f=>({...f, category: e.target.value}))} />
              </div>
              <div className="flex items-end gap-2">
                <input id="pub" type="checkbox" checked={form.is_published} onChange={(e)=>setForm(f=>({...f, is_published: e.target.checked}))} />
                <Label htmlFor="pub">Publicado</Label>
              </div>
            </div>
            <div>
              <Label>Conteúdo</Label>
              <div className="border rounded-md">
                <ReactQuill theme="snow" value={form.content} onChange={(val)=>setForm(f=>({...f, content: val}))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}><Save className="w-4 h-4 mr-1" />Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open)=> setConfirmDelete(prev => ({...prev, open}))}
        title="Excluir seção"
        description="Tem certeza que deseja excluir esta seção do manual?"
        confirmLabel="Excluir"
        confirmVariant="destructive"
        onConfirm={onDelete}
      />
    </div>
  );
}