import React, { useEffect, useState } from "react";
import { ChecklistReembolsoItem } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

const DEFAULT_ITEMS = [
  "Nota fiscal anexada",
  "Comprovante de pagamento anexado",
  "Despesa compatível com o objeto",
  "Valores conferem com comprovantes",
  "Dados legíveis e válidos"
];

export default function ReembolsoChecklist({ reembolsoId, canEdit = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoTitulo, setNovoTitulo] = useState("");

  const load = async () => {
    setLoading(true);
    const data = await ChecklistReembolsoItem.filter({ reembolso_id: reembolsoId }, "ordem");
    setItems(data.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)));
    setLoading(false);
  };

  useEffect(() => { if (reembolsoId) load(); }, [reembolsoId]);

  const addDefault = async () => {
    const payloads = DEFAULT_ITEMS.map((t, i) => ({
      reembolso_id: reembolsoId,
      titulo: t,
      status: "pendente",
      ordem: i + 1
    }));
    for (let p of payloads) await ChecklistReembolsoItem.create(p);
    load();
  };

  const addItem = async () => {
    if (!novoTitulo.trim()) return;
    await ChecklistReembolsoItem.create({
      reembolso_id: reembolsoId,
      titulo: novoTitulo.trim(),
      status: "pendente",
      ordem: (items[items.length - 1]?.ordem || 0) + 1
    });
    setNovoTitulo("");
    load();
  };

  const updateStatus = async (item, status) => {
    await ChecklistReembolsoItem.update(item.id, { status });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status } : i));
  };

  const updateObservacao = async (item, observacao) => {
    await ChecklistReembolsoItem.update(item.id, { observacao });
  };

  const removeItem = async (itemId) => {
    if (!window.confirm("Remover este item do checklist?")) return;
    await ChecklistReembolsoItem.delete(itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const statusBadge = (s) => {
    const map = { ok: "bg-emerald-100 text-emerald-800", pendente: "bg-yellow-100 text-yellow-800", glosado: "bg-red-100 text-red-800" };
    return <Badge className={map[s] || "bg-gray-100 text-gray-800"}>{s.toUpperCase()}</Badge>;
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Checklist de Reembolso</CardTitle>
          {items.length === 0 && canEdit && <Button onClick={addDefault} variant="outline">Carregar Itens Padrão</Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <div className="flex gap-2">
            <Input placeholder="Novo item..." value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} />
            <Button onClick={addItem}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
          </div>
        )}

        {loading ? (
          <div className="h-24 bg-gray-100 animate-pulse rounded" />
        ) : items.length === 0 ? (
          <p className="text-gray-500">Nenhum item no checklist.</p>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {statusBadge(it.status)}
                    <p className="font-medium">{it.titulo}</p>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <Select value={it.status} onValueChange={(v) => updateStatus(it, v)}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ok">OK</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="glosado">Glosado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(it.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <Textarea placeholder="Observações..." defaultValue={it.observacao || ""} onBlur={(e) => updateObservacao(it, e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}