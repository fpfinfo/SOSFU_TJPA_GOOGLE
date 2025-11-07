
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const placeholderLogo = "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=200&auto=format&fit=crop&q=60";

const ELEMENTOS_DESPESA_JURI = [
  "CONSUMO EM GERAL",
  "COMBUSTÍVEL",
  "TRANSPORTE E LOCOMOÇÃO",
  "PRESTAÇÃO DE SERVIÇO PF",
  "PRESTAÇÃO DE SERVIÇO PJ",
  "OUTROS"
];

export default function ProjecaoJuriForm({ value, onChange, readOnly = false }) {
  const data = value || { comarca: "", processo_numero: "", itens_projecao: [], observacoes_gerais: "", pessoas_envolvidas: [] };

  const update = (patch) => {
    const next = { ...data, ...patch };
    if (onChange) onChange(next);
  };

  const addItem = () => {
    if (readOnly) return;
    const novo = {
      elemento_despesa: "",
      descricao: "",
      valor_unitario: 0,
      quantidade_solicitada: 0,
      quantidade_aprovada: undefined,
      total_solicitado: 0,
      total_aprovado: 0
    };
    update({ itens_projecao: [...(data.itens_projecao || []), novo] });
  };

  const removeItem = (idx) => {
    if (readOnly) return;
    const next = [...(data.itens_projecao || [])];
    next.splice(idx, 1);
    update({ itens_projecao: next });
  };

  const handleItemChange = (idx, field, valueField) => {
    const next = [...(data.itens_projecao || [])];
    next[idx] = { ...next[idx], [field]: valueField };
    // Recalcular totais
    const vu = Number(next[idx].valor_unitario) || 0;
    const qs = Number(next[idx].quantidade_solicitada) || 0;
    const qaRaw = next[idx].quantidade_aprovada;
    const qa = qaRaw === undefined || qaRaw === null || Number.isNaN(Number(qaRaw))
      ? qs
      : Number(qaRaw);
    next[idx].total_solicitado = vu * qs;
    next[idx].total_aprovado = vu * qa;
    update({ itens_projecao: next });
  };

  const totalSolicitado = (data.itens_projecao || []).reduce((s, it) => s + (Number(it.total_solicitado) || 0), 0);
  const totalAprovado = (data.itens_projecao || []).reduce((s, it) => s + (Number(it.total_aprovado) || 0), 0);

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle>Projeção de Gastos com Sessão de Júri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Comarca</Label>
            <Input
              value={data.comarca || ""}
              onChange={(e) => update({ comarca: e.target.value })}
              placeholder="Digite a Comarca"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Processo nº</Label>
            <Input
              value={data.processo_numero || ""}
              onChange={(e) => update({ processo_numero: e.target.value })}
              placeholder="Nº do Processo"
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <Label className="font-semibold">Itens da Projeção</Label>
          {!readOnly && (
            <Button type="button" onClick={addItem} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Adicionar Linha
            </Button>
          )}
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Elemento de Despesa</TableHead>
                <TableHead className="min-w-[220px]">Descrição</TableHead>
                <TableHead className="text-right min-w-[120px]">Vr. Unit.</TableHead>
                <TableHead className="text-right min-w-[120px]">Qtd Solicitada</TableHead>
                <TableHead className="text-right min-w-[120px]">Qtd Aprovada</TableHead>
                <TableHead className="text-right min-w-[120px]">Total Solicitado</TableHead>
                <TableHead className="text-right min-w-[120px]">Total Aprovado</TableHead>
                {!readOnly && <TableHead className="w-12">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.itens_projecao || []).map((it, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Select
                      value={it.elemento_despesa || ""}
                      onValueChange={(v) => handleItemChange(idx, "elemento_despesa", v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {ELEMENTOS_DESPESA_JURI.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={it.descricao || ""}
                      onChange={(e) => handleItemChange(idx, "descricao", e.target.value)}
                      placeholder="Descrição do item"
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      value={it.valor_unitario ?? 0}
                      onChange={(e) => handleItemChange(idx, "valor_unitario", e.target.value)}
                      className="text-right"
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      value={it.quantidade_solicitada ?? 0}
                      onChange={(e) => handleItemChange(idx, "quantidade_solicitada", e.target.value)}
                      className="text-right"
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      value={
                        it.quantidade_aprovada === undefined || it.quantidade_aprovada === null
                          ? it.quantidade_solicitada || 0
                          : it.quantidade_aprovada
                      }
                      onChange={(e) => {
                        // Campo mostrado apenas para referência no formulário do suprido (readonly)
                        // O ajuste real é feito pelo Admin na aba de detalhes.
                      }}
                      className="text-right bg-gray-50"
                      disabled={true}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {(Number(it.total_solicitado || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell className="text-right">
                    {(Number(it.total_aprovado || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => removeItem(idx)}
                        title="Remover linha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {(!data.itens_projecao || data.itens_projecao.length === 0) && (
                <TableRow>
                  <TableCell colSpan={readOnly ? 7 : 8} className="text-center text-gray-500 py-6">
                    Nenhum item adicionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div /> {/* Empty div to push totals to the right on larger screens */}
          <div className="text-sm bg-gray-50 border rounded-lg p-3">
            <div className="flex justify-between">
              <span>Total Solicitado</span>
              <strong>{(Number(totalSolicitado)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Aprovado</span>
              <strong>{(Number(totalAprovado)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
            </div>
          </div>
        </div>

        <div>
          <Label>Observações (opcional)</Label>
          <Input
            value={data.observacoes_gerais || ""}
            onChange={(e) => update({ observacoes_gerais: e.target.value })}
            placeholder="Observações gerais sobre a projeção"
            disabled={readOnly}
          />
        </div>
      </CardContent>
    </Card>
  );
}
