
import React, { useEffect, useMemo, useState } from "react";
import { PrestacaoContas } from "@/api/entities";
import { DespesaPrestacao } from "@/api/entities";
import { DevolucaoPrestacao } from "@/api/entities";
import { PortariaSuprimento } from "@/api/entities";
import { SolicitacaoSuprimento } from "@/api/entities";
import { AnexoService } from "@/components/anexos/AnexoService";
import AdminAnexosSection from "@/components/anexos/AdminAnexosSection";
import PrestacaoChecklist from "@/components/checklist/PrestacaoChecklist";
import PrestacaoStatusTimeline from "@/components/status/PrestacaoStatusTimeline";
import PrestacaoStatusControl from "@/components/status/PrestacaoStatusControl";
import StatusBadge from "@/components/status/StatusBadge";
import PortariaPC from "@/components/portaria/PortariaPC";
import PortariaTab from "@/components/portaria/PortariaTab";
import { ItemDespesa } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Eye, FileText, MessageCircle, Printer } from "lucide-react";
import { useCurrentUser } from "@/components/utils/UserContext";

const formatCurrency = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Helper para obter dados do solicitante (mesma lógica do DetalheSolicitacao)
const obterDadosSolicitante = async (solicitacao, currentUser) => {
  if (currentUser && currentUser.email === solicitacao.created_by) {
    return {
      nome: currentUser.nome_completo_customizado || currentUser.full_name || 'Não informado',
      cpf: currentUser.cpf || 'Não informado',
      cargo: currentUser.cargo || 'Não informado',
      lotacao: currentUser.lotacao || 'Não informado',
      telefone: currentUser.telefone || 'Não informado',
      gestor_responsavel: currentUser.gestor_responsavel || 'Não informado',
      municipio: currentUser.municipio || 'Não informado',
      banco_nome: currentUser.banco_nome || '',
      banco_codigo: currentUser.banco_codigo || '',
      agencia: currentUser.agencia || '',
      conta: currentUser.conta || '',
      tipo_conta: currentUser.tipo_conta || '',
      pix_chave: currentUser.pix_chave || ''
    };
  }
  if (currentUser && currentUser.role === 'admin' && solicitacao.created_by) {
    try {
      const solicitanteUsers = await User.filter({ email: solicitacao.created_by });
      if (solicitanteUsers.length > 0) {
        const solicitanteData = solicitanteUsers[0];
        const nomeCompleto = solicitanteData.nome_completo_customizado || solicitanteData.full_name;
        if (nomeCompleto && nomeCompleto !== 'undefined' && nomeCompleto.trim() !== '') {
          return {
            nome: nomeCompleto,
            cpf: solicitanteData.cpf || 'Não informado',
            cargo: solicitanteData.cargo || 'Não informado',
            lotacao: solicitanteData.lotacao || 'Não informado',
            telefone: solicitanteData.telefone || 'Não informado',
            gestor_responsavel: solicitanteData.gestor_responsavel || 'Não informado',
            municipio: solicitanteData.municipio || 'Não informado',
            banco_nome: solicitanteData.banco_nome || '',
            banco_codigo: solicitanteData.banco_codigo || '',
            agencia: solicitanteData.agencia || '',
            conta: solicitanteData.conta || '',
            tipo_conta: solicitanteData.tipo_conta || '',
            pix_chave: solicitanteData.pix_chave || ''
          };
        }
      }
    } catch (error) {
      console.error("Erro ao buscar perfil do solicitante:", error);
    }
  }
  if (solicitacao.nome_servidor && solicitacao.nome_servidor.trim() !== '') {
    return {
      nome: solicitacao.nome_servidor,
      cpf: solicitacao.cpf || 'Não informado',
      cargo: solicitacao.cargo || 'Não informado',
      lotacao: solicitacao.lotacao || 'Não informado',
      telefone: solicitacao.telefone || 'Não informado',
      gestor_responsavel: solicitacao.gestor_responsavel || 'Não informado',
      municipio: solicitacao.municipio_snapshot || 'Não informado',
      banco_nome: '',
      banco_codigo: '',
      agencia: '',
      conta: '',
      tipo_conta: '',
      pix_chave: ''
    };
  }
  if (solicitacao.solicitante_snapshot && solicitacao.solicitante_snapshot.nome) {
    return {
      nome: solicitacao.solicitante_snapshot.nome,
      cpf: solicitacao.solicitante_snapshot.cpf || 'Não informado',
      cargo: solicitacao.solicitante_snapshot.cargo || 'Não informado',
      lotacao: solicitacao.solicitante_snapshot.lotacao || 'Não informado',
      telefone: solicitacao.solicitante_snapshot.telefone || 'Não informado',
      gestor_responsavel: solicitacao.solicitante_snapshot.gestor_responsavel || 'Não informado',
      municipio: solicitacao.solicitante_snapshot.municipio || 'Não informado',
      banco_nome: '',
      banco_codigo: '',
      agencia: '',
      conta: '',
      tipo_conta: '',
      pix_chave: ''
    };
  }
  return {
    nome: solicitacao.created_by || 'Desconhecido',
    cpf: solicitacao.cpf || 'Não informado',
    cargo: solicitacao.cargo || 'Não informado',
    lotacao: solicitacao.lotacao || 'Não informado',
    telefone: solicitacao.telefone || 'Não informado',
    gestor_responsavel: solicitacao.gestor_responsavel || 'Não informado',
    municipio: solicitacao.municipio_snapshot || 'Não informado',
    banco_nome: '',
    banco_codigo: '',
    agencia: '',
    conta: '',
    tipo_conta: '',
    pix_chave: ''
  };
};

export default function DetalhePrestacao() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const user = useCurrentUser();

  const [prestacao, setPrestacao] = useState(null);
  const [despesas, setDespesas] = useState([]);
  const [devolucoes, setDevolucoes] = useState([]);
  const [anexosSuprido, setAnexosSuprido] = useState([]);
  const [anexosAdmin, setAnexosAdmin] = useState([]);
  const [portariaSF, setPortariaSF] = useState(null);
  const [loading, setLoading] = useState(true);
  const [solicitacao, setSolicitacao] = useState(null);
  const [itensSolicitacao, setItensSolicitacao] = useState([]);
  const [solicitante, setSolicitante] = useState(null);

  // NOVO: valor recebido da solicitação vinculada
  const [valorRecebido, setValorRecebido] = useState(0);

  // NOVO: carregar valor recebido quando a prestação estiver disponível
  useEffect(() => {
    const loadValorRecebido = async () => {
      // garante que há vínculo com solicitação
      if (!prestacao?.solicitacao_suprimento_id) {
        setValorRecebido(0);
        return;
      }
      const sol = await SolicitacaoSuprimento.get(prestacao.solicitacao_suprimento_id);
      setValorRecebido(sol?.valor_solicitado || 0);
    };
    if (prestacao) { // Only attempt to load if prestacao object is available
      loadValorRecebido();
    }
  }, [prestacao?.solicitacao_suprimento_id, prestacao]); // Added prestacao to dependency array

  // NOVO: totais e saldo corretos
  const totalDespesas = useMemo(
    () => (despesas || []).reduce((s, d) => s + (Number(d.valor) || 0), 0),
    [despesas]
  );
  const totalDevolucoes = useMemo(
    () => (devolucoes || []).reduce((s, d) => s + (Number(d.valor) || 0), 0),
    [devolucoes]
  );
  const saldoPrestacao = useMemo(
    () => (Number(valorRecebido) || 0) - totalDespesas - totalDevolucoes,
    [valorRecebido, totalDespesas, totalDevolucoes]
  );

  // Substituir a definição de 'load' por uma versão memoizada
  const load = React.useCallback(async () => {
    setLoading(true);
    const p = await PrestacaoContas.get(id);
    const d = await DespesaPrestacao.filter({ prestacao_id: id });
    const dv = await DevolucaoPrestacao.filter({ prestacao_id: id });
    const axSup = await AnexoService.listarAnexos("prestacao", id, { origem: "suprido" });
    const axAdm = await AnexoService.listarAnexos("prestacao", id, { origem: "admin", incluirInvisiveis: true });
    let port = null;
    let solic = null;
    let itensSol = [];
    if (p?.solicitacao_suprimento_id) {
      const arr = await PortariaSuprimento.filter({ solicitacao_suprimento_id: p.solicitacao_suprimento_id });
      port = arr[0] || null;
      solic = await SolicitacaoSuprimento.get(p.solicitacao_suprimento_id);
      itensSol = await ItemDespesa.filter({ solicitacao_id: p.solicitacao_suprimento_id });
    }
    setPrestacao(p);
    setDespesas(d);
    setDevolucoes(dv);
    setAnexosSuprido(axSup);
    setAnexosAdmin(axAdm);
    setPortariaSF(port);
    setSolicitacao(solic);
    setItensSolicitacao(itensSol);
    if (solic) {
      const dadosSolic = await obterDadosSolicitante(solic, user);
      setSolicitante(dadosSolic);
    } else {
      setSolicitante(null);
    }
    setLoading(false);
  }, [id, user]); // Dependências para useCallback: id e user

  // Atualizar o useEffect para incluir 'load' na lista de dependências
  useEffect(() => { if (id) load(); }, [id, load]); // Adicionado 'load' às dependências

  if (loading || !prestacao) {
    return <div className="p-6"><div className="h-32 bg-gray-100 rounded animate-pulse" /></div>;
  }

  const canAdmin = user?.role === "admin";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prestação {prestacao.protocolo}</h1>
          <div className="mt-2">
            <StatusBadge status={prestacao.status} showDescription />
          </div>
        </div>
        <div className="flex gap-2">
          {canAdmin && <PrestacaoStatusControl prestacao={prestacao} onStatusChanged={load} />}
          <Link to={createPageUrl("MinhasPrestacoes")}><Button variant="outline">Voltar</Button></Link>
        </div>
      </div>

      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="anexos">Anexos</TabsTrigger>
          <TabsTrigger value="portaria_sf">Portaria SF</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          {canAdmin && prestacao.status === "em_analise" && <TabsTrigger value="checklist">Checklist</TabsTrigger>}
          {(canAdmin || prestacao.status === "aprovado") && <TabsTrigger value="portaria_pc">Portaria PC</TabsTrigger>}
        </TabsList>

        <TabsContent value="detalhes">
          {/* NOVO BLOCO: Resumo Financeiro corrigido */}
          <div className="mb-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-sm text-gray-600">Valor Recebido</p>
                    <p className="text-2xl font-bold text-indigo-700">{formatCurrency(valorRecebido)}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-sm text-gray-600">Total Despesas</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalDespesas)}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-sm text-gray-600">Total Devoluções</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalDevolucoes)}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-sm text-gray-600">Saldo para Prestação</p>
                    <p className={`text-2xl font-bold ${saldoPrestacao < 0 ? 'text-red-600' : saldoPrestacao === 0 ? 'text-emerald-700' : 'text-gray-800'}`}>
                      {formatCurrency(saldoPrestacao)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* The previous "Resumo" card was removed from here. */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <PrestacaoStatusTimeline prestacaoId={prestacao.id} />
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle>Despesas</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despesas.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.descricao || d.atividade_servico || "-"}</TableCell>
                        <TableCell>{d.categoria || "-"}</TableCell>
                        <TableCell>{d.data_despesa || "-"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d.valor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="font-semibold text-lg">Total</TableCell>
                      <TableCell className="text-right font-bold text-lg">{formatCurrency(totalDespesas)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle>Devoluções</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devolucoes.map((dv) => (
                      <TableRow key={dv.id}>
                        <TableCell>{dv.descricao || "-"}</TableCell>
                        <TableCell>{dv.categoria || "-"}</TableCell>
                        <TableCell>{dv.data_devolucao || "-"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(dv.valor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="font-semibold text-lg">Total</TableCell>
                      <TableCell className="text-right font-bold text-lg">{formatCurrency(totalDevolucoes)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="anexos">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle>Comprovantes do Suprido</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {anexosSuprido.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <p className="truncate font-medium text-sm">{a.nome_original}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a href={a.url_assinada} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4 mr-2" />Ver
                      </a>
                    </Button>
                  </div>
                ))}
                {anexosSuprido.length === 0 && <p className="text-gray-500">Nenhum anexo enviado pelo suprido.</p>}
              </CardContent>
            </Card>

            <AdminAnexosSection
              ownerTipo="prestacao"
              ownerId={prestacao.id}
              anexos={anexosAdmin}
              onAnexosChange={setAnexosAdmin}
              user={{ role: canAdmin ? "admin" : "user" }}
            />
          </div>
        </TabsContent>

        <TabsContent value="portaria_sf">
          {solicitacao ? (
            <PortariaTab
              solicitacao={solicitacao}
              itens={itensSolicitacao}
              user={user}
              solicitante={solicitante}
            />
          ) : (
            <Card className="border-none shadow-lg">
              <CardContent>
                <p className="text-gray-500">Nenhuma solicitação vinculada para exibir Portaria SF.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat">
          <Card className="border-none shadow-lg">
            <CardHeader><CardTitle>Comunicação</CardTitle></CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Abra o chat para conversar sobre esta prestação.</p>
              <Button asChild variant="outline">
                <Link to={createPageUrl(`Chat?id=${prestacao.id}&tipo=prestacao`)}><MessageCircle className="w-4 h-4 mr-2" />Abrir Chat</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {canAdmin && prestacao.status === "em_analise" && (
          <TabsContent value="checklist">
            <PrestacaoChecklist prestacaoId={prestacao.id} canEdit />
          </TabsContent>
        )}

        {(canAdmin || prestacao.status === "aprovado") && (
          <TabsContent value="portaria_pc">
            <PortariaPC prestacao={prestacao} solicitacao={solicitacao} portariaSF={portariaSF} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
