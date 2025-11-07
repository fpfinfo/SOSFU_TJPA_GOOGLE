import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

const FIXED_DESCRICOES = [
  "Servidor do Fórum",
  "Réus",
  "Jurados",
  "Testemunhas",
  "Defensor Público (max. 2)",
  "Promotor (max. 2)",
  "Policiais"
];

export default function PessoasEnvolvidas({ value = [], onChange, readOnly = false, isAdmin = false }) {
  // Normaliza o array recebido para conter SEMPRE as linhas fixas (na mesma ordem)
  const linhasFixas = React.useMemo(() => {
    const map = new Map((value || []).map(v => [v?.descricao, v]));
    return FIXED_DESCRICOES.map(desc => {
      const existe = map.get(desc);
      return {
        descricao: desc,
        quantidade_solicitada: Number(existe?.quantidade_solicitada) || 0,
        quantidade_aprovada: existe?.quantidade_aprovada !== undefined && existe?.quantidade_aprovada !== null
          ? Number(existe?.quantidade_aprovada)
          : (Number(existe?.quantidade_solicitada) || 0)
      };
    });
  }, [value]);

  // Se vier vazio, inicializa com as linhas fixas
  React.useEffect(() => {
    if ((value || []).length === 0 && onChange) {
      onChange(linhasFixas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // roda só na montagem

  const update = (idx, field, val) => {
    if (!onChange) return;
    const next = [...linhasFixas];
    next[idx] = { ...next[idx], [field]: val };
    // Se quantidade_aprovada não informada, espeilha a solicitada
    if (field === "quantidade_solicitada" && (next[idx].quantidade_aprovada === undefined || next[idx].quantidade_aprovada === null)) {
      next[idx].quantidade_aprovada = val;
    }
    onChange(next);
  };

  // Totais das colunas
  const totals = React.useMemo(() => {
    const solicitada = linhasFixas.reduce((sum, it) => sum + (Number(it?.quantidade_solicitada) || 0), 0);
    const aprovada = linhasFixas.reduce((sum, it) => {
      const qa = it?.quantidade_aprovada;
      return sum + (qa === undefined || qa === null ? (Number(it?.quantidade_solicitada) || 0) : (Number(qa) || 0));
    }, 0);
    return { solicitada, aprovada };
  }, [linhasFixas]);

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle>Pessoas Envolvidas no Júri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Label className="font-semibold">Quantitativos</Label>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Descrição</TableHead>
                <TableHead className="text-right min-w-[140px]">Qtd Solicitada</TableHead>
                <TableHead className="text-right min-w-[140px]">Qtd Aprovada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhasFixas.map((l, idx) => (
                <TableRow key={l.descricao}>
                  <TableCell>
                    <Input value={l.descricao} readOnly disabled />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      className="text-right"
                      value={l.quantidade_solicitada ?? 0}
                      onChange={(e) => update(idx, "quantidade_solicitada", Number(e.target.value))}
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      className="text-right"
                      value={l.quantidade_aprovada ?? l.quantidade_solicitada ?? 0}
                      onChange={(e) => update(idx, "quantidade_aprovada", Number(e.target.value))}
                      disabled={readOnly || !isAdmin}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totais das colunas */}
        <div className="mt-4 border-t pt-3 flex flex-wrap items-center justify-end gap-6">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Total Solicitada: </span>
            <span className="font-bold">{totals.solicitada}</span>
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Total Aprovada: </span>
            <span className="font-bold">{totals.aprovada}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}