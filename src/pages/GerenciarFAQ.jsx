import React, { useEffect, useMemo, useState } from "react";
import { FaqItem } from "@/api/entities";
import { useCurrentUser } from "@/components/utils/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, HelpCircle, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function GerenciarFAQ() {
  const user = useCurrentUser();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "", order: 0, is_published: true, tags: [] });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await FaqItem.list("order");
    setItems(data);
  };

  if (!user || user.role !== "admin") {
    return <div className="p-6 text-gray-600">Acesso restrito aos administradores.</div>;
  }

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean));
    return ["todas", ...Array.from(set)];
  }, [items]);

  const filtered = items.filter(i => {
    const text = `${i.question} ${i.answer} ${(i.tags || []).join(" ")}`.toLowerCase();
    const okSearch = text.includes(search.toLowerCase());
    const okCat = category === "todas" || i.category === category;
    return okSearch && okCat;
  });

  const openNew = () => {
    setEditing(null);
    setForm({ question: "", answer: "", category: "", order: 0, is_published: true, tags: [] });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ question: item.question || "", answer: item.answer || "", category: item.category || "", order: item.order || 0, is_published: !!item.is_published, tags: item.tags || [] });
    setModalOpen(true);
  };

  const save = async () => {
    const payload = { ...form, order: Number(form.order) || 0, tags: (form.tags || []).filter(Boolean) };
    if (editing) {
      await FaqItem.update(editing.id, payload);
      toast({ title: "FAQ atualizado" });
    } else {
      await FaqItem.create(payload);
      toast({ title: "FAQ criado" });
    }
    setModalOpen(false);
    await load();
  };

  const onDelete = async () => {
    if (!confirmDelete.id) return;
    await FaqItem.delete(confirmDelete.id);
    toast({ title: "FAQ excluído" });
    setConfirmDelete({ open: false, id: null });
    await load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar FAQ</h1>
            <p className="text-gray-600">Crie, edite e publique perguntas frequentes</p>
          </div>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Pergunta</Button>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input className="pl-10" placeholder="Buscar..." value={search} onChange={(e)=>setSearch(e.target.value)} />
            </div>
            <select className="border rounded-md px-3 py-2" value={category} onChange={(e)=>setCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.map((i) => (
              <div key={i.id} className="flex items-start justify-between p-3 rounded-lg border hover:shadow-sm">
                <div className="pr-4">
                  <div className="font-medium">{i.question}</div>
                  <div className="text-sm text-gray-600 line-clamp-2">{i.answer}</div>
                  <div className="mt-1 flex gap-2 flex-wrap">
                    {i.category && <Badge variant="outline">{i.category}</Badge>}
                    {(i.tags || []).map((t, idx) => <Badge key={idx} variant="secondary">#{t}</Badge>)}
                    <Badge variant="outline">ordem {i.order ?? 0}</Badge>
                    <Badge className={i.is_published ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}>
                      {i.is_published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={()=>openEdit(i)}><Pencil className="w-4 h-4 mr-1" />Editar</Button>
                  <Button variant="destructive" size="sm" onClick={()=>setConfirmDelete({ open: true, id: i.id })}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-gray-500 p-4">Nenhum item encontrado.</div>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Pergunta" : "Nova Pergunta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Pergunta</Label>
              <Input value={form.question} onChange={(e)=>setForm(f=>({...f, question: e.target.value}))} />
            </div>
            <div>
              <Label>Resposta</Label>
              <textarea className="w-full border rounded-md px-3 py-2 min-h-[120px]" value={form.answer} onChange={(e)=>setForm(f=>({...f, answer: e.target.value}))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e)=>setForm(f=>({...f, category: e.target.value}))} />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input type="number" value={form.order} onChange={(e)=>setForm(f=>({...f, order: e.target.value}))} />
              </div>
              <div className="flex items-end gap-2">
                <input id="pub" type="checkbox" checked={form.is_published} onChange={(e)=>setForm(f=>({...f, is_published: e.target.checked}))} />
                <Label htmlFor="pub">Publicado</Label>
              </div>
            </div>
            <div>
              <Label>Tags (separe por vírgula)</Label>
              <Input value={(form.tags || []).join(", ")} onChange={(e)=>setForm(f=>({...f, tags: e.target.value.split(",").map(x=>x.trim()).filter(Boolean)}))} />
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
        title="Excluir pergunta"
        description="Tem certeza que deseja excluir esta pergunta do FAQ?"
        confirmLabel="Excluir"
        confirmVariant="destructive"
        onConfirm={onDelete}
      />
    </div>
  );
}