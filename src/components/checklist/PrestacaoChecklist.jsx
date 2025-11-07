
import React, { useEffect, useState } from "react";
import { ChecklistPrestacaoItem } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

const DEFAULT_ITEMS = [
  "Comprovantes dentro do período de aplicação?",
  "Prestação dentro do período correto?",
  "Retenções tributárias adequadas (INSS/ISS)?",
  "Documentação do prestador completa?",
  "Documentos fiscais legíveis e válidos?",
  "Despesas compatíveis com o objeto autorizado?",
  "Saldo devolvido corretamente (se aplicável)?",
  "Certidão de Atesto enviada?",
];

export default function PrestacaoChecklist({ prestacaoId, canEdit = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoTitulo, setNovoTitulo] = useState("");

  const load = async () => {
    setLoading(true);
    const data = await ChecklistPrestacaoItem.filter({ prestacao_id: prestacaoId }, "ordem");
    setItems(data.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)));
    setLoading(false);
  };

  useEffect(() => { if (prestacaoId) load(); }, [prestacaoId]);

  const addDefault = async () => {
    const payloads = DEFAULT_ITEMS.map((t, i) => ({
      prestacao_id: prestacaoId,
      titulo: t,
      status: "pendente",
      ordem: i + 1,
    }));
    // criar em sequência para garantir ordem
    for (let p of payloads) await ChecklistPrestacaoItem.create(p);
    load();
  };

  const addItem = async () => {
    if (!novoTitulo.trim()) return;
    await ChecklistPrestacaoItem.create({
      prestacao_id: prestacaoId,
      titulo: novoTitulo.trim(),
      status: "pendente",
      ordem: (items[items.length - 1]?.ordem || 0) + 1,
    });
    setNovoTitulo("");
    load();
  };

  const updateStatus = async (item, status) => {
    await ChecklistPrestacaoItem.update(item.id, { status });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status } : i));
  };

  const updateObservacao = async (item, observacao) => {
    await ChecklistPrestacaoItem.update(item.id, { observacao });
  };

  const removeItem = async (itemId) => {
    if (!window.confirm("Remover este item do checklist?")) return;
    await ChecklistPrestacaoItem.delete(itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const normalizeStatus = (s) => {
    if (s === "ok") return "sim";
    if (s === "glosado") return "nao";
    return s;
  };

  const statusBadge = (s) => {
    const normalized = normalizeStatus(s);
    const map = {
      sim: "bg-emerald-100 text-emerald-800",
      nao: "bg-red-100 text-red-800",
      "n/a": "bg-gray-100 text-gray-800",
      pendente: "bg-yellow-100 text-yellow-800",
    };
    const label = (normalized || "pendente").toUpperCase();
    return <Badge className={map[normalized] || "bg-gray-100 text-gray-800"}>{label}</Badge>;
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Checklist de Análise</CardTitle>
          <div className="flex gap-2">
            {items.length === 0 && canEdit && (
              <Button onClick={addDefault} variant="outline">Carregar Itens Padrão</Button>
            )}
          </div>
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
                      <Select value={normalizeStatus(it.status)} onValueChange={(v) => updateStatus(it, v)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">SIM</SelectItem>
                          <SelectItem value="nao">NÃO</SelectItem>
                          <SelectItem value="n/a">N/A</SelectItem>
                          <SelectItem value="pendente">PENDENTE</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(it.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <Textarea
                    placeholder="Observações..."
                    defaultValue={it.observacao || ""}
                    onBlur={(e) => updateObservacao(it, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
