
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { SolicitacaoSuprimento } from '@/api/entities';
import { ItemDespesa } from '@/api/entities';
import { User } from '@/api/entities';
import { ProjecaoJuri } from "@/api/entities"; // Moved to top-level import
import { createPageUrl } from '@/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Printer, FileText, DollarSign, Calendar, User as UserIcon, Building, Hash, Eye, Download, ShieldCheck, UserCheck, MapPin, Landmark, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast"; // New import

import StatusBadge from '../components/status/StatusBadge';
import StatusControl from '../components/status/StatusControl';
import StatusTimeline from '../components/status/StatusTimeline';
import PortariaTab from '../components/portaria/PortariaTab';
import { AnexoService } from '../components/anexos/AnexoService';
import AdminAnexosSection from '../components/anexos/AdminAnexosSection';
import ChatTab from '../components/chat/ChatTab';
import ProjecaoJuriTab from "../components/juri/ProjecaoJuriTab";
import PessoasEnvolvidas from "@/components/juri/PessoasEnvolvidas"; // New import

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = Number(value) || 0;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const AnexoItem = ({ anexo }) => {
  const handleDownload = async () => {
    await AnexoService.registrarDownload(anexo.id);
  };

  return (
    <a key={anexo.id} href={anexo.url_assinada} target="_blank" rel="noopener noreferrer" onClick={handleDownload} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 border">
      <div className="flex items-center gap-3 truncate">
        <FileText className="w-5 h-5 text-blue-600 shrink-0"/>
        <div className="truncate">
          <p className="text-sm font-medium truncate">{anexo.nome_original}</p>
          <p className="text-xs text-gray-500">v{anexo.versao} • {(anexo.tamanho_bytes / 1024).toFixed(1)} KB</p>
        </div>
      </div>
      <Download className="w-4 h-4 text-gray-500 shrink-0"/>
    </a>
  );
};

// Função auxiliar para obter dados do solicitante de forma robusta e segura
const obterDadosSolicitante = async (solicitacao, currentUser) => {
  // Prioridade 1: Se o usuário logado é o próprio solicitante, use os dados do usuário logado.
  // Isso garante que o nome_completo_customizado atualizado seja sempre exibido para o próprio usuário.
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

  // Prioridade 2: Se o usuário logado é um admin, tente buscar os dados do perfil do solicitante.
  // Isso é importante para que admins vejam os dados mais recentes de qualquer usuário.
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

  // Prioridade 3: CAMPO LEGADO nome_servidor da própria solicitação
  // Este é o ponto crucial para solicitações existentes onde o nome_servidor já está correto
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

  // Prioridade 4: Usar o snapshot se ele existir e tiver um nome.
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
  
  // Prioridade 5: Fallback final usando o created_by como nome
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

export default function DetalheSolicitacao() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const solicitacaoId = searchParams.get('id');

  const [solicitacao, setSolicitacao] = useState(null);
  const [solicitante, setSolicitante] = useState(null);
  const [itens, setItens] = useState([]);
  const [anexosSuprido, setAnexosSuprido] = useState([]);
  const [anexosAdmin, setAnexosAdmin] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasProjecaoJuri, setHasProjecaoJuri] = useState(false);
  const [projecaoJuri, setProjecaoJuri] = useState(null); // Novo estado para Projeção Júri
  const { toast } = useToast(); // Initialize useToast hook

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (!solicitacaoId) {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      
      const [userData, solicitacaoData] = await Promise.all([
        User.me(),
        SolicitacaoSuprimento.get(solicitacaoId)
      ]);
      setUser(userData);
      setSolicitacao(solicitacaoData);
      
      // Obter dados do solicitante usando a nova função assíncrona
      const dadosSolicitante = await obterDadosSolicitante(solicitacaoData, userData);
      setSolicitante(dadosSolicitante);
      
      const [itensData, anexosSupridoData, anexosAdminData] = await Promise.all([
        ItemDespesa.filter({ solicitacao_id: solicitacaoId }),
        AnexoService.listarAnexos('solicitacao', solicitacaoId, { origem: 'suprido' }),
        AnexoService.listarAnexos('solicitacao', solicitacaoId, { 
          origem: 'admin', 
          incluirInvisiveis: userData.role === 'admin' 
        })
      ]);
      setItens(itensData);
      setAnexosSuprido(anexosSupridoData);
      setAnexosAdmin(anexosAdminData);

      // Checar e carregar Projeção de Júri vinculada
      try {
        const rs = await ProjecaoJuri.filter({ solicitacao_id: solicitacaoData.id });
        const pj = (rs || [])[0] || null;
        setHasProjecaoJuri((rs || []).length > 0);
        setProjecaoJuri(pj);
      } catch (e) {
        setHasProjecaoJuri(false);
        setProjecaoJuri(null);
        console.error("Erro ao verificar/carregar Projeção de Júri:", e); // Log the error for debugging
      }
      
    } catch (error) {
      console.error(`Erro ao carregar detalhes da solicitação:`, error);
      // idealmente, mostrar uma mensagem de erro para o usuário
    } finally {
      setLoading(false);
    }
  }, [solicitacaoId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChanged = (newStatus) => {
    // Apenas atualiza o estado local. O histórico e o chat são atualizados no backend.
    setSolicitacao(prev => ({ ...prev, status: newStatus }));
    // Recarrega os dados para garantir consistência, especialmente o histórico
    loadData(); 
  };
  
  // Handler para salvar alterações em Pessoas Envolvidas (admin)
  const handlePessoasEnvolvidasChange = useCallback(async (nextList) => {
    if (!projecaoJuri?.id) return;
    // Atualiza estado imediatamente para feedback instantâneo
    setProjecaoJuri((prev) => ({ ...(prev || {}), pessoas_envolvidas: nextList }));
    // Persiste no banco
    try {
      const updated = await ProjecaoJuri.update(projecaoJuri.id, { pessoas_envolvidas: nextList });
      setProjecaoJuri(updated);
      toast({ title: "Pessoas Envolvidas", description: "Quantidades aprovadas atualizadas." });
    } catch (error) {
      console.error("Erro ao atualizar Pessoas Envolvidas:", error);
      toast({ title: "Erro", description: "Falha ao atualizar pessoas envolvidas. Tente novamente.", variant: "destructive" });
      // Optionally, re-fetch data or revert state if the update fails
      // loadData(); 
    }
  }, [projecaoJuri, toast]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-gray-200 rounded-xl"></div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!solicitacao || !user || !solicitante) { 
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl text-red-600">Solicitação não encontrada ou erro ao carregar dados.</h2>
        <Button asChild className="mt-4"><Link to={createPageUrl("Dashboard")}>Voltar ao Dashboard</Link></Button>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `}</style>

      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header com botões de ação */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 no-print">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              {user && (
                <StatusControl
                  solicitacao={solicitacao}
                  onStatusChanged={handleStatusChanged}
                  disabled={loading}
                />
              )}
            </div>
          </div>
          
          {/* Main content area, keeping the white background and shadow */}
          <div className="bg-white p-8 rounded-2xl shadow-lg printable-area">
            {/* Cabeçalho do documento */}
            <header className="flex items-start justify-between pb-6 border-b">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Solicitação de Suprimento</h1>
                  <p className="text-gray-500">Tribunal de Justiça do Estado do Pará - TJPA</p>
                </div>
              </div>
              <StatusBadge status={solicitacao.status} showDescription />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
              {/* Coluna principal */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="detalhes" className="w-full">
                  <TabsList className={`grid w-full ${hasProjecaoJuri ? 'grid-cols-6' : 'grid-cols-5'} no-print`}>
                    <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                    <TabsTrigger value="anexos">Anexos</TabsTrigger>
                    {hasProjecaoJuri && ( // Conditionally render Projeção Júri tab and Pessoas Envolvidas
                      <>
                        <TabsTrigger value="juri">Projeção Júri</TabsTrigger>
                        <TabsTrigger value="pessoas">Pessoas Envolvidas</TabsTrigger>
                      </>
                    )}
                    <TabsTrigger value="portaria" disabled={!['aprovado','pago','confirmado'].includes(solicitacao.status)}>Portaria SF</TabsTrigger>
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="detalhes">
                    <div className="space-y-8 mt-6">
                      {/* Dados da Solicitação */}
                      <Card className="border-gray-200">
                        <CardHeader><CardTitle>Identificação da Solicitação</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                          <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-blue-500"/><div><Label className="text-xs">Número</Label><p className="font-semibold">{solicitacao.numero_solicitacao}</p></div></div>
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500"/><div><Label className="text-xs">Data</Label><p>{format(new Date(solicitacao.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}</p></div></div>
                          <div className="flex items-center gap-2 col-span-2 md:col-span-1"><DollarSign className="w-4 h-4 text-green-500"/><div><Label className="text-xs">Valor Total</Label><p className="font-bold text-base text-green-600">{formatCurrency(solicitacao.valor_solicitado)}</p></div></div>
                          <div className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-blue-500"/><div><Label className="text-xs">Servidor</Label><p>{solicitante.nome}</p></div></div>
                          <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-blue-500"/><div><Label className="text-xs">CPF</Label><p>{solicitante.cpf}</p></div></div>
                          <div className="flex items-center gap-2"><Building className="w-4 h-4 text-blue-500"/><div><Label className="text-xs">Lotação</Label><p>{solicitante.lotacao}</p></div></div>
                          {/* Município */}
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500"/>
                            <div>
                              <Label className="text-xs">Município</Label>
                              <p>{solicitante.municipio || 'Não informado'}</p>
                            </div>
                          </div>
                          {/* Gestor Responsável */}
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-green-600"/>
                            <div>
                              <Label className="text-xs">Gestor Responsável</Label>
                              <p>{solicitante.gestor_responsavel || 'Não informado'}</p>
                            </div>
                          </div>
                          {/* Dados Bancários */}
                          <div className="flex items-start gap-2 col-span-2 md:col-span-3">
                            <Landmark className="w-4 h-4 text-purple-600 mt-1"/>
                            <div className="flex-1">
                              <Label className="text-xs">Dados Bancários do Suprido</Label>
                              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                <p><span className="text-gray-500">Banco:</span> {solicitante.banco_nome || solicitante.banco_codigo || 'Não informado'}</p>
                                <p><span className="text-gray-500">Agência:</span> {solicitante.agencia || 'Não informado'}</p>
                                <p><span className="text-gray-500">Conta:</span> {solicitante.conta || 'Não informado'}</p>
                                <p><span className="text-gray-500">Tipo:</span> {solicitante.tipo_conta || 'Não informado'}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Justificativa */}
                      <Card className="border-gray-200">
                        <CardHeader><CardTitle>Justificativa</CardTitle></CardHeader>
                        <CardContent>
                          <p className="text-sm whitespace-pre-wrap">{solicitacao.justificativa || "Nenhuma justificativa informada."}</p>
                        </CardContent>
                      </Card>

                      {/* Elementos de Despesa */}
                      <Card className="border-gray-200">
                        <CardHeader><CardTitle>Elementos de Despesa</CardTitle></CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                  <thead>
                                  <tr className="border-b">
                                      <th className="py-2 px-3 text-left font-semibold">Código</th>
                                      <th className="py-2 px-3 text-left font-semibold">Descrição</th>
                                      <th className="py-2 px-3 text-right font-semibold">Qtd</th>
                                      <th className="py-2 px-3 text-right font-semibold">Vlr. Unitário</th>
                                      <th className="py-2 px-3 text-right font-semibold">Vlr. Total</th>
                                  </tr>
                                  </thead>
                                  <tbody>
                                  {itens.map(item => (
                                      <tr key={item.id} className="border-b">
                                      <td className="py-3 px-3">{item.codigo}</td>
                                      <td className="py-3 px-3">{item.descricao}</td>
                                      <td className="py-3 px-3 text-right">{item.quantidade}</td>
                                      <td className="py-3 px-3 text-right">{formatCurrency(item.valor_unitario)}</td>
                                      <td className="py-3 px-3 text-right font-medium">{formatCurrency(item.valor_total)}</td>
                                      </tr>
                                  ))}
                                  </tbody>
                                  <tfoot>
                                  <tr className="border-t-2">
                                      <td colSpan="4" className="py-3 px-3 text-right font-bold text-base">Total Geral</td>
                                      <td className="py-3 px-3 text-right font-bold text-base">{formatCurrency(solicitacao.valor_solicitado)}</td>
                                  </tr>
                                  </tfoot>
                              </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="anexos">
                     <div className="space-y-8 mt-6">
                        <Card className="border-gray-200">
                          <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="text-blue-600"/>Documentos do Suprido</CardTitle></CardHeader>
                          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {anexosSuprido.length > 0 ? anexosSuprido.map(anexo => (
                              <AnexoItem key={anexo.id} anexo={anexo} />
                            )) : <p className="text-sm text-gray-500 col-span-2">Nenhum documento enviado pelo suprido.</p>}
                          </CardContent>
                        </Card>
                        
                        {/* Seção de Anexos do Administrador */}
                        <AdminAnexosSection
                          ownerTipo="solicitacao"
                          ownerId={solicitacao.id}
                          anexos={anexosAdmin}
                          onAnexosChange={setAnexosAdmin}
                          user={user}
                        />
                     </div>
                  </TabsContent>

                  {hasProjecaoJuri && ( // Conditionally render Projeção Júri content
                    <>
                      <TabsContent value="juri">
                        <div className="mt-6">
                          <ProjecaoJuriTab solicitacao={solicitacao} />
                        </div>
                      </TabsContent>

                      <TabsContent value="pessoas">
                        <div className="mt-6">
                          <PessoasEnvolvidas
                            value={projecaoJuri?.pessoas_envolvidas}
                            onChange={handlePessoasEnvolvidasChange}
                            isAdmin={user?.role === 'admin'}
                            readOnly={user?.role !== 'admin'}
                          />
                        </div>
                      </TabsContent>
                    </>
                  )}

                  <TabsContent value="portaria">
                    <PortariaTab 
                      solicitacao={solicitacao} 
                      itens={itens} 
                      user={user} 
                      solicitante={solicitante}
                    />
                  </TabsContent>

                  <TabsContent value="chat">
                    <div className="mt-6">
                      <ChatTab solicitacao={solicitacao} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Coluna lateral */}
              <div className="space-y-8">
                <div className="sticky top-24">
                  <StatusTimeline solicitacaoId={solicitacao.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
