import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Save, Plus } from "lucide-react";
import { PortariaReembolso } from "@/api/entities";

const tjpaLogoUrl = "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=600&auto=format&fit=crop"; // placeholder

export default function PortariaRB({ reembolso }) {
  const [portaria, setPortaria] = useState(null);
  const [chefeNome, setChefeNome] = useState("Fábio Pereira de Freitas");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!reembolso?.id) return;
      const existentes = await PortariaReembolso.filter({ reembolso_id: reembolso.id }, "-created_date");
      if (existentes && existentes.length > 0) {
        setPortaria(existentes[0]);
        setChefeNome(existentes[0].chefe_nome || "Fábio Pereira de Freitas");
      } else {
        setPortaria(null);
      }
    };
    load();
  }, [reembolso?.id]);

  const gerarNumero = async () => {
    const now = new Date();
    const ano = now.getFullYear();
    const lista = await PortariaReembolso.filter({ ano }, "-created_date");
    const maxSeq = lista.reduce((m, it) => Math.max(m, Number(it.sequencial || 0)), 0);
    const sequencial = maxSeq + 1;
    const numero_portaria = `PORT-RB-${ano}-${String(sequencial).padStart(4, "0")}`;
    const data_portaria = now.toISOString().split("T")[0];
    return { ano, sequencial, numero_portaria, data_portaria };
    };

  const criarPortaria = async () => {
    if (!reembolso?.id) return;
    const base = await gerarNumero();
    const payload = {
      reembolso_id: reembolso.id,
      ...base,
      chefe_nome: chefeNome || "Fábio Pereira de Freitas",
      servidor_nome: reembolso.created_by || "__________________",
      servidor_cpf: "" // opcional
    };
    const created = await PortariaReembolso.create(payload);
    setPortaria(created);
  };

  const salvarAlteracoes = async () => {
    if (!portaria?.id) return;
    setSaving(true);
    const updated = await PortariaReembolso.update(portaria.id, { chefe_nome: chefeNome });
    setPortaria(updated);
    setSaving(false);
  };

  const handlePrint = () => window.print();

  return (
    <Card className="border-none shadow-lg print:shadow-none">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-2xl">Portaria de Reembolso de Despesa</CardTitle>
        <div className="flex gap-2 no-print">
          {portaria ? (
            <>
              <Button variant="outline" size="sm" onClick={salvarAlteracoes} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={criarPortaria}>
              <Plus className="w-4 h-4 mr-2" />
              Gerar Portaria
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Configurações */}
        <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div>
            <p className="text-xs text-gray-500">Chefe do Serviço</p>
            <Input value={chefeNome} onChange={(e) => setChefeNome(e.target.value)} />
          </div>
        </div>

        {/* Documento - versão de impressão */}
        <div className="bg-white rounded-lg border p-6 print:border-0 print:p-0">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={tjpaLogoUrl} alt="Brasão TJPA" className="w-12 h-12 object-contain" />
            <div className="text-center">
              <p className="text-xs leading-tight">PODER JUDICIÁRIO DO ESTADO DO PARÁ</p>
              <p className="text-sm font-semibold leading-tight">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</p>
              <p className="text-xs leading-tight">SERVIÇO DE SUPRIMENTO DE FUNDOS</p>
            </div>
          </div>

          <div className="text-center my-4">
            <h2 className="text-lg font-bold">PORTARIA DE REEMBOLSO DE DESPESA</h2>
            {portaria && (
              <p className="text-sm text-gray-700">
                {portaria.numero_portaria} — {portaria.data_portaria}
              </p>
            )}
          </div>

          <div className="space-y-4 text-justify text-sm leading-relaxed">
            <p>
              O Chefe do Serviço de Suprimento de Fundos, no uso de suas atribuições, resolve aprovar o
              reembolso de despesas constantes no processo identificado pelo protocolo {reembolso.protocolo},
              no valor total de {formatCurrency(reembolso.valor_total_comprovado)}.
            </p>
            <p>
              Determino as providências necessárias para a efetivação do pagamento, conforme as normas
              internas, ficando esta Portaria como documento formal de autorização.
            </p>
          </div>

          {/* Assinaturas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12">
            <div className="text-center">
              <div className="h-16" />
              <div className="border-t border-gray-400 mx-auto w-64" />
              <p className="mt-1 font-semibold">{chefeNome || "_________________________"}</p>
              <p className="text-xs text-gray-600">Chefe do Serviço de Suprimento de Fundos</p>
            </div>
            <div className="text-center">
              <div className="h-16" />
              <div className="border-t border-gray-400 mx-auto w-64" />
              <p className="mt-1 font-semibold">{portaria?.servidor_nome || "_________________________"}</p>
              <p className="text-xs text-gray-600">Servidor Suprido</p>
            </div>
          </div>

          {/* Rodapé */}
          <div className="mt-10 text-center text-xs text-gray-500">
            {portaria ? `Documento gerado por ${portaria.numero_portaria}` : "Documento aguardando geração de número."}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(v) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}