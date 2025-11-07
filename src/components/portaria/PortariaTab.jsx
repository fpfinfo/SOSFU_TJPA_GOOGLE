
import React, { useState, useEffect } from 'react';
import { PortariaSuprimento } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { numeroParaExtenso } from '@/components/utils/extenso';
import { Printer, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tjpaLogoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png";

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = Number(value) || 0;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function PortariaTab({ solicitacao, itens, user, solicitante }) {
  const [portariaData, setPortariaData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isReadOnly = user.role !== 'admin';

  useEffect(() => {
    const fetchPortaria = async () => {
      setLoading(true);
      try {
        const existingPortarias = await PortariaSuprimento.filter({ solicitacao_suprimento_id: solicitacao.id });
        if (existingPortarias.length > 0) {
          setPortariaData(existingPortarias[0]);
        } else {
          setPortariaData(null);
        }
      } catch (error) {
        console.error("Erro ao buscar portaria:", error);
      } finally {
        setLoading(false);
      }
    };

    if (['aprovado','pago','confirmado'].includes(solicitacao.status)) {
      fetchPortaria();
    }
  }, [solicitacao.id, solicitacao.status]);

  const handleGeneratePortaria = async () => {
    setLoading(true);
    try {
      const ano = new Date().getFullYear();
      const portariasDoAno = await PortariaSuprimento.filter({ ano }, '-sequencial', 1);
      const ultimoSequencial = portariasDoAno.length > 0 ? portariasDoAno[0].sequencial : 0;
      const novoSequencial = ultimoSequencial + 1;

      const valorPorExtenso = numeroParaExtenso(solicitacao.valor_solicitado);

      const novaPortaria = {
        solicitacao_suprimento_id: solicitacao.id,
        // Changed numero_portaria format to PC-NNNN/YYYY as per "Portaria PC: número/ano"
        numero_portaria: `PC-${String(novoSequencial).padStart(4, '0')}/${ano}`,
        ano,
        sequencial: novoSequencial,
        ptres: '',
        dotacao: '',
        prazo_aplicacao_inicio: new Date().toISOString().split('T')[0],
        prazo_aplicacao_fim: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        prazo_prestacao_inicio: new Date(new Date().setDate(new Date().getDate() + 31)).toISOString().split('T')[0],
        prazo_prestacao_fim: new Date(new Date().setDate(new Date().getDate() + 60)).toISOString().split('T')[0],
        ordenador_despesa: 'Anailton Paulo de Alencar',
        valor_total_extenso: valorPorExtenso,
      };

      const createdPortaria = await PortariaSuprimento.create(novaPortaria);
      setPortariaData(createdPortaria);
    } catch (error) {
      console.error("Erro ao gerar portaria:", error);
      alert("Falha ao gerar portaria.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!portariaData || isReadOnly) return;
    setLoading(true);
    try {
      await PortariaSuprimento.update(portariaData.id, portariaData);
      alert("Portaria salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar portaria:", error);
      alert("Falha ao salvar portaria.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field, value) => {
    if (isReadOnly) return;
    setPortariaData(prev => ({ ...prev, [field]: value }));
  };
  
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-6 text-center">Carregando dados da portaria...</div>;
  }
  
  if (!solicitante) {
     return <div className="p-6 text-center">Carregando dados do solicitante...</div>;
  }

  if (!portariaData) {
    if (isReadOnly) {
      return <div className="p-6 text-center">A portaria para esta solicitação ainda não foi gerada.</div>;
    }
    return (
      <div className="text-center p-8">
        <Button onClick={handleGeneratePortaria} disabled={loading}>
          Gerar Portaria de Suprimento de Fundos
        </Button>
      </div>
    );
  }

  return (
    <Card className="mt-6 border-none shadow-none printable-area">
      <CardContent className="p-4 md:p-8 font-serif">
        <header className="text-center mb-8">
          {/* Brasão is already present as requested */}
          <img src={tjpaLogoUrl} alt="Logo TJPA" className="w-20 h-auto mx-auto mb-3" />
          <p className="font-bold text-sm">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</p>
          <p className="font-bold text-sm">SECRETARIA DE PLANEJAMENTO, COORDENAÇÃO E FINANÇAS</p>
          <p className="font-bold text-base mt-3">{portariaData.numero_portaria}</p>
        </header>

        <section className="space-y-4">
          {/* Dados do Suprido - Layout ajustado */}
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr><th colSpan="4" className="border border-black p-2 bg-gray-200 font-bold">DADOS DO SUPRIDO</th></tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-semibold" colSpan="1">Nome:</td>
                <td className="border border-black p-2" colSpan="3">{solicitante.nome}</td>
              </tr>
              <tr className="border-b border-black">
                {/* CPF is already in the body as requested */}
                <td colSpan="2" className="p-1 border border-black text-sm">
                  <strong>CPF:</strong> {solicitante.cpf}
                </td>
                <td colSpan="2" className="p-1 border border-black text-sm">
                  <strong>Cargo:</strong> {solicitante.cargo}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold">Lotação:</td>
                <td className="border border-black p-2">{solicitante.lotacao}</td>
                <td className="border border-black p-2 font-semibold">Município:</td>
                <td className="border border-black p-2">{solicitante.municipio}</td>
              </tr>
            </tbody>
          </table>

          {/* Dados Orçamentários - PTRES e Dotação lado a lado */}
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr><th colSpan="4" className="border border-black p-2 bg-gray-200 font-bold">DADOS ORÇAMENTÁRIOS</th></tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-semibold">PTRES:</td>
                <td className="border border-black p-2">
                  <Input value={portariaData.ptres} onChange={(e) => handleInputChange('ptres', e.target.value)} disabled={isReadOnly} className="h-8 border-gray-400" />
                </td>
                <td className="border border-black p-2 font-semibold">Dotação:</td>
                <td className="border border-black p-2">
                  <Input value={portariaData.dotacao} onChange={(e) => handleInputChange('dotacao', e.target.value)} disabled={isReadOnly} className="h-8 border-gray-400" />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Elementos de Despesa */}
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr><th colSpan="3" className="border border-black p-2 bg-gray-200 font-bold">ELEMENTOS DE DESPESA</th></tr>
              <tr>
                <th className="border border-black p-2 font-semibold">Código</th>
                <th className="border border-black p-2 font-semibold">Descrição</th>
                <th className="border border-black p-2 font-semibold">Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              {itens.map(item => (
                <tr key={item.id}>
                  <td className="border border-black p-2">{item.codigo}</td>
                  <td className="border border-black p-2">{item.descricao}</td>
                  <td className="border border-black p-2 text-right">{formatCurrency(item.valor_total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" className="border border-black p-2 font-bold text-right">VALOR TOTAL:</td>
                <td className="border border-black p-2 font-bold text-right">{formatCurrency(solicitacao.valor_solicitado)}</td>
              </tr>
              <tr>
                <td colSpan="3" className="border border-black p-2 text-sm italic">
                  ({portariaData.valor_total_extenso})
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Prazos - Aplicação e Prestação lado a lado em duas tabelas menores */}
          <div className="grid grid-cols-2 gap-4">
              <table className="w-full border-collapse border border-black text-sm">
                <thead><tr><th colSpan="4" className="border border-black p-2 bg-gray-200 font-bold">PRAZO DE APLICAÇÃO</th></tr></thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-semibold">Início:</td>
                    <td className="border border-black p-2"><Input type="date" value={portariaData.prazo_aplicacao_inicio} onChange={(e) => handleInputChange('prazo_aplicacao_inicio', e.target.value)} disabled={isReadOnly} className="h-8 border-gray-400" /></td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-semibold">Fim:</td>
                    <td className="border border-black p-2"><Input type="date" value={portariaData.prazo_aplicacao_fim} onChange={(e) => handleInputChange('prazo_aplicacao_fim', e.target.value)} disabled={isReadOnly} className="h-8 border-gray-400" /></td>
                  </tr>
                </tbody>
              </table>
              <table className="w-full border-collapse border border-black text-sm">
                <thead><tr><th colSpan="4" className="border border-black p-2 bg-gray-200 font-bold">PRAZO DE PRESTAÇÃO DE CONTAS</th></tr></thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-semibold">Início:</td>
                    <td className="border border-black p-2"><Input type="date" value={portariaData.prazo_prestacao_inicio} onChange={(e) => handleInputChange('prazo_prestacao_inicio', e.target.value)} disabled={isReadOnly} className="h-8 border-gray-400" /></td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-semibold">Fim:</td>
                    <td className="border border-black p-2"><Input type="date" value={portariaData.prazo_prestacao_fim} onChange={(e) => handleInputChange('prazo_prestacao_fim', e.target.value)} disabled={isReadOnly} className="h-8 border-gray-400" /></td>
                  </tr>
                </tbody>
              </table>
          </div>

          {/* Ordenador */}
          <div className="text-center pt-8">
            <Input 
                value={portariaData.ordenador_despesa} 
                onChange={(e) => handleInputChange('ordenador_despesa', e.target.value)} 
                disabled={isReadOnly} 
                className="w-1/2 mx-auto text-center border-0 border-b-2 border-black rounded-none"
            />
            <p className="text-sm font-bold mt-2">ORDENADOR DE DESPESA</p>
          </div>
          
          <div className="text-center pt-4 text-xs text-gray-500">
             {/* Changed date format to dd/MM/yyyy as requested */}
             Belém, {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}.
          </div>
        </section>

        <div className="flex gap-4 justify-end mt-6 no-print">
            {!isReadOnly && <Button onClick={handleSave} disabled={loading}><Save className="w-4 h-4 mr-2"/>Salvar Alterações</Button>}
            <Button onClick={handlePrint} variant="outline"><Printer className="w-4 h-4 mr-2"/>Imprimir</Button>
        </div>

        {/* Impressão: somente a .printable-area */}
        <style>{`
          @media print {
            @page { size: auto; margin: 12mm; }
            body * { visibility: hidden !important; }
            .printable-area, .printable-area * { visibility: visible !important; }
            .printable-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              box-shadow: none !important;
            }
            .no-print { display: none !important; }
            html, body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
