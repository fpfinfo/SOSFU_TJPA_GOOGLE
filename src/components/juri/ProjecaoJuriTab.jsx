import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Save, Clipboard, Loader2 } from "lucide-react";
import { ProjecaoJuri } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUser } from "@/components/utils/UserContext";

const formatCurrency = (v) => {
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function ProjecaoJuriTab({ solicitacao }) {
  const { toast } = useToast();
  const user = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pj, setPj] = useState(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!solicitacao?.id) return;
      setLoading(true);
      try {
        const rs = await ProjecaoJuri.filter({ solicitacao_id: solicitacao.id });
        if (!mounted) return;
        setPj((rs || [])[0] || null);
      } catch (e) {
        console.error("Erro ao carregar Projeção Júri:", e);
        toast({
          title: "Erro ao carregar Projeção",
          description: "Não foi possível carregar os dados da projeção do júri.",
          variant: "destructive",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [solicitacao?.id, toast]);

  const itens = useMemo(() => Array.isArray(pj?.itens_projecao) ? pj.itens_projecao : [], [pj]);

  const totals = useMemo(() => {
    let solicitado = 0;
    let aprovado = 0;
    itens.forEach((it) => {
      const vu = Number(it.valor_unitario) || 0;
      const qs = Number(it.quantidade_solicitada) || 0;
      const qaRaw = it.quantidade_aprovada;
      const qa = qaRaw === undefined || qaRaw === null || Number.isNaN(Number(qaRaw)) ? qs : Number(qaRaw);
      solicitado += vu * qs;
      aprovado += vu * qa;
    });
    return { solicitado, aprovado };
  }, [itens]);

  const updateItem = (idx, field, value) => {
    if (!pj) return;
    const next = { ...pj };
    next.itens_projecao = [...(pj.itens_projecao || [])];
    const item = { ...next.itens_projecao[idx] };
    const vu = Number(item.valor_unitario) || 0;
    if (field === "quantidade_aprovada") {
      const qa = Math.max(0, Number(value) || 0);
      item.quantidade_aprovada = qa;
      item.total_aprovado = vu * qa;
    }
    // recalcula espelhos mínimos
    const qs = Number(item.quantidade_solicitada) || 0;
    item.total_solicitado = vu * qs;
    next.itens_projecao[idx] = item;
    setPj(next);
  };

  const handleSave = async () => {
    if (!pj?.id) return;
    setSaving(true);
    try {
      // Normaliza itens antes de salvar
      const normalized = (pj.itens_projecao || []).map((it) => {
        const vu = Number(it.valor_unitario) || 0;
        const qs = Number(it.quantidade_solicitada) || 0;
        const qaRaw = it.quantidade_aprovada;
        const qa = qaRaw === undefined || qaRaw === null || Number.isNaN(Number(qaRaw)) ? qs : Number(qaRaw);
        return {
          ...it,
          quantidade_solicitada: qs,
          quantidade_aprovada: qa,
          total_solicitado: vu * qs,
          total_aprovado: vu * qa,
        };
      });

      const updated = await ProjecaoJuri.update(pj.id, { itens_projecao: normalized });
      setPj(updated);

      toast({
        title: "Ajustes salvos",
        description: "Os valores aprovados da Projeção do Júri foram atualizados.",
      });
    } catch (e) {
      console.error("Erro ao salvar Projeção Júri:", e);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os ajustes. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-blue-600" />
            Projeção do Júri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-24 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!pj) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-blue-600" />
            Projeção do Júri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Nenhuma Projeção de Júri cadastrada para esta solicitação.
          </p>
        </CardContent>
      </Card>
    );
  }

  const aprovadoDisabled = !isAdmin;

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-blue-600" />
            Projeção do Júri
          </CardTitle>
          <div className="mt-1 text-sm text-gray-600">
            <span className="mr-3">Comarca: <strong>{pj.comarca || "-"}</strong></span>
            {pj.processo_numero && (
              <span>
                Processo nº <strong>{pj.processo_numero}</strong>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Total Aprovado: {formatCurrency(totals.aprovado)}</Badge>
          <Button onClick={handleSave} disabled={saving || !isAdmin} className="bg-black hover:bg-gray-900 text-white">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Ajustes
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Descrição</TableHead>
                <TableHead className="text-right min-w-[120px]">Vr. Unit.</TableHead>
                <TableHead className="text-right min-w-[120px]">Qtd Solicitada</TableHead>
                <TableHead className="text-right min-w-[120px]">Qtd Aprovada</TableHead>
                <TableHead className="text-right min-w-[140px]">Total Solicitado</TableHead>
                <TableHead className="text-right min-w-[140px]">Total Aprovado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((it, idx) => {
                const vu = Number(it.valor_unitario) || 0;
                const qs = Number(it.quantidade_solicitada) || 0;
                const qa = it.quantidade_aprovada === undefined || it.quantidade_aprovada === null
                  ? qs
                  : Number(it.quantidade_aprovada) || 0;
                const totalSolic = vu * qs;
                const totalAprov = vu * qa;

                return (
                  <TableRow key={idx}>
                    <TableCell className="whitespace-pre-wrap">{it.descricao}</TableCell>
                    <TableCell className="text-right">{formatCurrency(vu)}</TableCell>
                    <TableCell className="text-right">{qs}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={qa}
                        onChange={(e) => updateItem(idx, "quantidade_aprovada", e.target.value)}
                        className="text-right"
                        disabled={aprovadoDisabled}
                      />
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(totalSolic)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalAprov)}</TableCell>
                  </TableRow>
                );
              })}
              {itens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-6">
                    Nenhum item na projeção.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 border-t pt-3 flex flex-wrap items-center justify-end gap-6">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Total Solicitado: </span>
            <span className="font-bold">{formatCurrency(totals.solicitado)}</span>
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Total Aprovado: </span>
            <span className="font-bold">{formatCurrency(totals.aprovado)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}