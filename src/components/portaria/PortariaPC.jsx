
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Save, Plus } from "lucide-react";
import { PortariaPrestacao } from "@/api/entities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCurrentUser } from "@/components/utils/UserContext";
import { DespesaPrestacao } from "@/api/entities"; // NEW: para calcular total real de despesas
import { numeroParaExtenso } from "@/components/utils/extenso"; // NEW: valor por extenso

const tjpaLogoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/7d627b202_brasao-tjpa.png";

// NEW: util para moeda
const formatBRL = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PortariaPC({ prestacao, solicitacao, portariaSF }) {
  const [portariaPC, setPortariaPC] = useState(null);
  const [chefeNome, setChefeNome] = useState("Fábio Pereira de Freitas");
  const [saving, setSaving] = useState(false);
  const user = useCurrentUser();

  // NEW: total comprovado calculado das despesas
  const [totalComprovado, setTotalComprovado] = useState(null);

  // NEW: carregar e somar despesas sempre que a prestação mudar
  useEffect(() => {
    const loadTotal = async () => {
      if (!prestacao?.id) return;
      const itens = await DespesaPrestacao.filter({ prestacao_id: prestacao.id });
      const total = (itens || []).reduce((s, d) => s + (Number(d.valor) || 0), 0);
      setTotalComprovado(total);
    };
    loadTotal();
  }, [prestacao?.id]);

  // NEW: memo do valor exibido
  const valorDisplay = formatBRL(
    totalComprovado != null ? totalComprovado : (prestacao?.valor_total_comprovado || 0)
  );

  const handlePrint = () => {
    window.print();
  };

  // CHANGED: loadOrInit com useCallback e dependência estável
  const loadOrInit = React.useCallback(async () => {
    if (!prestacao?.id) return;
    const existing = await PortariaPrestacao.filter({ prestacao_id: prestacao.id }, "-created_date");
    const pc = existing[0] || null;
    setPortariaPC(pc || null);
    setChefeNome(pc?.chefe_nome || "Fábio Pereira de Freitas");
  }, [prestacao?.id]);

  useEffect(() => {
    loadOrInit();
  }, [loadOrInit]);

  const gerarNumero = async () => {
    const now = new Date();
    const ano = now.getFullYear();
    const existentes = await PortariaPrestacao.filter({ ano }, "-created_date");
    const maxSeq = existentes.reduce((m, r) => Math.max(m, Number(r.sequencial || 0)), 0);
    const sequencial = maxSeq + 1;
    const numero = `PORT-PC-${ano}-${String(sequencial).padStart(4, "0")}`;
    return { numero, ano, sequencial, data: now.toISOString().split("T")[0] };
  };

  const gerarPortaria = async () => {
    if (!prestacao?.id || prestacao.status !== "aprovado") return;
    const { numero, ano, sequencial, data } = await gerarNumero();

    const baseValor = totalComprovado != null ? totalComprovado : (prestacao.valor_total_comprovado || 0);
    const valorExtenso = numeroParaExtenso(Number(baseValor) || 0);

    const payload = {
      prestacao_id: prestacao.id,
      solicitacao_suprimento_id: prestacao.solicitacao_suprimento_id || null,
      numero_portaria: numero,
      ano,
      sequencial,
      data_portaria: data,
      chefe_nome: chefeNome || "Fábio Pereira de Freitas",
      servidor_nome: solicitacao?.nome_servidor || "__________________",
      servidor_cpf: solicitacao?.cpf || "__________",
      portaria_sf_numero: portariaSF?.numero_portaria || null,
      valor_total_extenso: valorExtenso
    };
    const created = await PortariaPrestacao.create(payload);
    setPortariaPC(created);
    setChefeNome(created.chefe_nome || "Fábio Pereira de Freitas");
  };

  const salvarAlteracoes = async () => {
    if (!portariaPC?.id) return;
    setSaving(true);
    const updated = await PortariaPrestacao.update(portariaPC.id, { chefe_nome: chefeNome });
    setPortariaPC(updated);
    setSaving(false);
  };

  // NEW: agora o retorno antecipado ocorre após os hooks
  if (!prestacao) return null;

  return (
    <Card className="border-none shadow-lg print:shadow-none">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-2xl font-semibold leading-none tracking-tight">Portaria de Prestação de Contas</CardTitle>
        <div className="flex gap-2 no-print">
          {portariaPC ?
          <>
              <Button variant="outline" onClick={salvarAlteracoes} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Imprimir</Button>
            </> :

          <Button onClick={gerarPortaria} disabled={prestacao?.status !== "aprovado"}>
              <Plus className="w-4 h-4 mr-2" />
              Gerar Portaria PC
            </Button>
          }
        </div>
      </CardHeader>

      {/* Aviso quando ainda não aprovado */}
      {!portariaPC && prestacao?.status !== "aprovado" && (
        <div className="no-print px-6 pb-2 text-sm text-gray-600">
          A Portaria PC só pode ser gerada após a prestação estar APROVADA.
        </div>
      )}

      <CardContent className="max-w-none">
        {/* Cabeçalho informativo com número/ano e data formatada */}
        {portariaPC &&
        <div className="no-print flex flex-col md:flex-row md:items-start md:justify-between gap-3 text-sm text-gray-600 mb-4">
            <div>
              <p><span className="text-gray-500">Número:</span> {portariaPC.numero_portaria}</p>
              <p>
                <span className="text-gray-500">Data:</span>{" "}
                {portariaPC.data_portaria ? format(new Date(portariaPC.data_portaria), "dd/MM/yyyy", { locale: ptBR }) : "—"}
              </p>
            </div>
            <div className="w-full md:w-72">
              <label className="block text-xs text-gray-500 mb-1">Chefe do Serviço de Suprimento de Fundos</label>
              <Input value={chefeNome} onChange={(e) => setChefeNome(e.target.value)} className="print:hidden" />
            </div>
          </div>
        }

        <div className="bg-white p-6 rounded-lg border printable-area">
          {/* Brasão e título */}
          <header className="text-center mb-6">
            <img src={tjpaLogoUrl} alt="Brasão TJPA" className="w-20 h-auto mx-auto mb-3" />
            <p className="font-semibold text-sm">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</p>
            <p className="font-semibold text-sm">SECRETARIA DE PLANEJAMENTO, COORDENAÇÃO E FINANÇAS</p>
            <p className="font-semibold text-base mt-2">
              PORTARIA Nº {portariaPC?.sequencial ? String(portariaPC.sequencial).padStart(4, "0") : "____"}/{portariaPC?.ano || new Date().getFullYear()} – SEPLAN
            </p>
          </header>

          {/* Corpo */}
          <div className="prose max-w-none">
            <p>O Chefe do Serviço de Suprimento de Fundos, no uso de suas atribuições, e considerando a legislação vigente,</p>
            <p className="font-semibold">RESOLVE:</p>

            <p className="mt-4">
              Art. 1º – Aprovar a prestação de contas do servidor {solicitacao?.nome_servidor || "__________________"}, CPF nº {solicitacao?.cpf || "__________"}, referente ao suprimento de fundos concedido pela Portaria nº {portariaSF?.numero_portaria || "____/____"}.
            </p>
            <p className="mt-3">
              {/* UPDATED: usa total comprovado calculado */}
              Art. 2º – A despesa totalizada em {valorDisplay} foi analisada e considerada REGULAR, conforme comprovantes apresentados.
            </p>
            <p className="mt-3">
              Art. 3º – Determinar o arquivamento da presente prestação de contas após os registros contábeis e auditoria interna.
            </p>

            <div className="mt-8">
              <p>Publique-se.</p>
              <p>
                Belém,{" "}
                {portariaPC?.data_portaria ?
                format(new Date(portariaPC.data_portaria), "dd/MM/yyyy", { locale: ptBR }) :
                format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                .
              </p>
            </div>

            <div className="mt-12 text-center">
              <p className="uppercase">_________________________________________</p>
              <p>{chefeNome}</p>
              <p className="text-sm text-gray-600">Chefe do Serviço de Suprimento de Fundos</p>
            </div>
          </div>
        </div>

        {/* Estilos de impressão: imprime SOMENTE a área .printable-area */}
        <style>{`
          @media print {
            @page { size: auto; margin: 12mm; }
            /* Esconde tudo */
            body * { visibility: hidden !important; }
            /* Mostra apenas a área imprimível */
            .printable-area, .printable-area * { visibility: visible !important; }
            /* Garante que a área imprimível ocupe a página */
            .printable-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              box-shadow: none !important;
            }
            /* Oculta elementos marcados explicitamente */
            .no-print { display: none !important; }
            html, body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>
      </CardContent>
    </Card>);

}
