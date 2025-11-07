
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Reembolso } from "@/api/entities";
import { DespesaReembolso } from "@/api/entities";
import { AnexoService } from "@/components/anexos/AnexoService";
import StatusBadge from "@/components/status/StatusBadge";
import PortariaRB from "@/components/portaria/PortariaRB";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { FileText, ArrowLeft, Eye, Download, MessageCircle, Printer, Paperclip, AlertCircle, RotateCcw } from "lucide-react";
import { createPageUrl } from "@/utils";

const formatCurrency = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DetalheReembolso() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const [reembolso, setReembolso] = useState(null);
  const [despesas, setDespesas] = useState([]);
  const [anexosSuprido, setAnexosSuprido] = useState([]);
  const [anexosAdmin, setAnexosAdmin] = useState([]);
  const [activeTab, setActiveTab] = useState("detalhes");

  // NEW: estados de robustez
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const totalDespesas = useMemo(() => despesas.reduce((s, d) => s + (Number(d.valor) || 0), 0), [despesas]);

  const load = useCallback(async () => {
    setErrorMsg("");
    setLoading(true);

    if (!id) {
      setErrorMsg("ID do reembolso não informado.");
      setLoading(false);
      return;
    }

    // Carrega tudo em paralelo e não falha a tela se algum item falhar (ex: rate limit de anexos)
    const [rRes, dsRes, axSupRes, axAdmRes] = await Promise.allSettled([
      Reembolso.get(id),
      DespesaReembolso.filter({ reembolso_id: id }),
      AnexoService.listarAnexos("reembolso", id, { origem: "suprido" }),
      AnexoService.listarAnexos("reembolso", id, { origem: "admin" }),
    ]);

    if (rRes.status === "fulfilled") {
      setReembolso(rRes.value);
    } else {
      setReembolso(null); // Ensure reembolso is null if it failed to load
      setErrorMsg("Não foi possível carregar o reembolso. Tente novamente em alguns instantes.");
    }

    if (dsRes.status === "fulfilled") setDespesas(dsRes.value); else setDespesas([]);
    if (axSupRes.status === "fulfilled") setAnexosSuprido(axSupRes.value); else setAnexosSuprido([]);
    if (axAdmRes.status === "fulfilled") setAnexosAdmin(axAdmRes.value); else setAnexosAdmin([]);

    setLoading(false);
  }, [id]); // id é uma dependência do useCallback para que a função seja recriada se o id mudar

  useEffect(() => {
    load();
  }, [load]); // load é uma dependência do useEffect para garantir que o efeito rode quando a função load mudar

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Carregando reembolso...</div>
      </div>
    );
  }

  // NEW: estado de erro com ações
  if (errorMsg && !reembolso) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg border bg-red-50 text-red-800">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-semibold">Falha ao carregar</p>
            <p className="text-sm">{errorMsg}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={load}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // If we reach here, `loading` is false. If `reembolso` is still null but no `errorMsg` was set (unlikely path),
  // or if errorMsg was set but reembolso did load (e.g. partial error but main object loaded)
  // the component will render using whatever data it has.
  // The primary error display case is handled above (`errorMsg && !reembolso`).
  // If `reembolso` is null here, it means it genuinely failed to load and the error message should have appeared.
  // For safety, though, if the component somehow renders without reembolso after loading, it will cause an error.
  // So, ensure `reembolso` is not null before proceeding.
  if (!reembolso) {
      return (
        <div className="p-6">
          <div className="text-gray-600">Reembolso não encontrado ou erro inesperado.</div>
        </div>
      );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild className="no-print">
          <Link to={createPageUrl("MeusReembolsos")}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Detalhe do Reembolso</h1>
          <p className="text-gray-600">{reembolso.protocolo}</p>
        </div>
        <StatusBadge status={reembolso.status} className="no-print" />
      </div>

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="no-print">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="anexos">Anexos</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="portaria">Portaria RB</TabsTrigger>
        </TabsList>

        {/* Detalhes */}
        <TabsContent value="detalhes">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resumo do Reembolso</CardTitle>
                <div className="flex gap-2 no-print">
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Protocolo</p>
                  <p className="font-medium">{reembolso.protocolo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data</p>
                  <p>{reembolso.data_reembolso || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Comprovado</p>
                  <p className="font-semibold text-emerald-700">{formatCurrency(totalDespesas)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Observações do Suprido</p>
                <p className="bg-gray-50 rounded-lg p-3 text-sm">{reembolso.observacoes_suprido || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg mt-6">
            <CardHeader>
              <CardTitle>Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Doc.</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Anexos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despesas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                        Nenhuma despesa encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                  {despesas.map((d) => {
                    const anexosItem = anexosSuprido.filter(a => a.despesa_reembolso_id && a.despesa_reembolso_id === d.id);
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="max-w-[280px]">{d.descricao || d.atividade_servico || "-"}</TableCell>
                        <TableCell>{d.categoria || "-"}</TableCell>
                        <TableCell>{d.data_despesa || "-"}</TableCell>
                        <TableCell>{d.documento_numero || "-"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d.valor)}</TableCell>
                        <TableCell className="text-center">
                          {anexosItem.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-gray-700">
                              <Paperclip className="w-4 h-4" /> {anexosItem.length}
                            </span>
                          ) : <span className="text-gray-400 text-sm">—</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-semibold text-lg">Total Comprovado</TableCell>
                    <TableCell className="text-right font-bold text-lg">{formatCurrency(totalDespesas)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anexos */}
        <TabsContent value="anexos">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Anexos do Reembolso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...anexosSuprido, ...anexosAdmin].length === 0 && (
                <div className="text-center text-gray-500 py-10">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  Nenhum anexo encontrado.
                </div>
              )}
              {[...anexosSuprido, ...anexosAdmin].map((a) => (
                <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <p className="truncate font-medium text-sm">{a.nome_original} {a.versao ? `(v${a.versao})` : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={a.url_assinada} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                    </a>
                    <a href={a.url_assinada} download>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat */}
        <TabsContent value="chat">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chat do Reembolso</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to={createPageUrl(`Chat?id=${reembolso.id}&tipo=reembolso`)}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Abrir Chat
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Conversem sobre este reembolso no chat dedicado. Clique em "Abrir Chat" para visualizar e enviar mensagens.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portaria RB */}
        <TabsContent value="portaria">
          <PortariaRB reembolso={reembolso} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
