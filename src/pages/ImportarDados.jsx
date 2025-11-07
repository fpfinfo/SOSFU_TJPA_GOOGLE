import React, { useState } from "react";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { SolicitacaoSuprimento } from "@/api/entities";
import { PrestacaoContas } from "@/api/entities";
import { Reembolso } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FileSpreadsheet, FileText } from "lucide-react";

function Section({ title, description, onImport, loading }) {
  const [fileName, setFileName] = useState("");
  const fileRef = React.useRef(null);

  const pick = () => fileRef.current?.click();

  const handleChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    await onImport(f);
    e.target.value = "";
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          {title}
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <input type="file" ref={fileRef} accept=".csv" className="hidden" onChange={handleChange} />
        <Button onClick={pick} disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</> : "Selecionar CSV"}
        </Button>
        {fileName && <span className="text-sm text-gray-600">{fileName}</span>}
      </CardContent>
    </Card>
  );
}

export default function ImportarDados() {
  const { toast } = useToast();
  const [loading, setLoading] = useState({ solic: false, prest: false, reemb: false });

  const extractRows = async (file, json_schema) => {
    const { file_url } = await UploadFile({ file });
    const res = await ExtractDataFromUploadedFile({ file_url, json_schema });
    if (res.status !== "success" || !res.output) throw new Error(res.details || "Falha ao processar CSV");
    return Array.isArray(res.output) ? res.output : [res.output];
  };

  const normalizeStatus = (s, allowed) => {
    const v = String(s || "").toLowerCase().trim().replace(/\s+/g, "_");
    return allowed.includes(v) ? v : undefined;
  };

  const importSolicitacoes = async (file) => {
    setLoading((p) => ({ ...p, solic: true }));
    try {
      const schema = {
        type: "object",
        properties: {
          numero_solicitacao: { type: "string" },
          data_solicitacao: { type: "string" },
          valor_solicitado: { type: "number" },
          justificativa: { type: "string" },
          status: { type: "string" },
          created_by: { type: "string" },
          nome_servidor: { type: "string" },
          cpf: { type: "string" },
          cargo: { type: "string" },
          lotacao: { type: "string" },
          telefone: { type: "string" },
          gestor_responsavel: { type: "string" },
          municipio_snapshot: { type: "string" },
          analista_responsavel: { type: "string" },
          data_analise: { type: "string" },
          preferencia_pagamento: { type: "string" }
        }
      };
      const rows = await extractRows(file, schema);
      let created = 0, updated = 0, errors = 0;

      for (const row of rows) {
        try {
          if (!row.numero_solicitacao) { errors++; continue; }
          const existing = await SolicitacaoSuprimento.filter({ numero_solicitacao: row.numero_solicitacao }, "-created_date", 1);
          const payload = {
            numero_solicitacao: row.numero_solicitacao,
            data_solicitacao: row.data_solicitacao,
            valor_solicitado: Number(row.valor_solicitado) || 0,
            justificativa: row.justificativa || "",
            status: normalizeStatus(row.status, ["rascunho","pendente","em_analise","aprovado","rejeitado","cancelado","pago","confirmado"]) || "pendente",
            nome_servidor: row.nome_servidor || undefined,
            cpf: row.cpf || undefined,
            cargo: row.cargo || undefined,
            lotacao: row.lotacao || undefined,
            telefone: row.telefone || undefined,
            gestor_responsavel: row.gestor_responsavel || undefined,
            municipio_snapshot: row.municipio_snapshot || undefined,
            analista_responsavel: row.analista_responsavel || undefined,
            data_analise: row.data_analise || undefined,
            preferencia_pagamento: row.preferencia_pagamento || undefined,
            tipo: "suprimento",
            solicitante_id: row.created_by || undefined // referencia por email
          };
          if (existing.length > 0) {
            await SolicitacaoSuprimento.update(existing[0].id, payload);
            updated++;
          } else {
            await SolicitacaoSuprimento.create(payload);
            created++;
          }
        } catch (e) {
          console.error("Erro importando solicitação:", e);
          errors++;
        }
      }
      toast({ title: "Importação de Solicitações concluída", description: `Criadas: ${created} • Atualizadas: ${updated} • Erros: ${errors}` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro na importação de Solicitações", description: e.message || String(e) });
    } finally {
      setLoading((p) => ({ ...p, solic: false }));
    }
  };

  const importPrestacoes = async (file) => {
    setLoading((p) => ({ ...p, prest: true }));
    try {
      const schema = {
        type: "object",
        properties: {
          protocolo: { type: "string" },
          data_prestacao: { type: "string" },
          valor_total_comprovado: { type: "number" },
          status: { type: "string" },
          solicitacao_numero: { type: "string" } // para link opcional
        }
      };
      const rows = await extractRows(file, schema);
      let created = 0, updated = 0, errors = 0;

      for (const row of rows) {
        try {
          if (!row.protocolo) { errors++; continue; }
          const existing = await PrestacaoContas.filter({ protocolo: row.protocolo }, "-created_date", 1);

          let solicitacao_suprimento_id = undefined;
          if (row.solicitacao_numero) {
            const s = await SolicitacaoSuprimento.filter({ numero_solicitacao: row.solicitacao_numero }, "-created_date", 1);
            if (s.length > 0) solicitacao_suprimento_id = s[0].id;
          }

          const payload = {
            protocolo: row.protocolo,
            data_prestacao: row.data_prestacao,
            valor_total_comprovado: Number(row.valor_total_comprovado) || 0,
            status: normalizeStatus(row.status, ["rascunho","pendente","em_analise","aprovado","glosa","rejeitado","concluido"]) || "pendente",
            solicitacao_suprimento_id
          };

          if (existing.length > 0) {
            await PrestacaoContas.update(existing[0].id, payload);
            updated++;
          } else {
            // Campos obrigatórios: solicitacao_suprimento_id, protocolo, data_prestacao, valor_total_comprovado
            await PrestacaoContas.create({
              solicitacao_suprimento_id: payload.solicitacao_suprimento_id || "",
              protocolo: payload.protocolo,
              data_prestacao: payload.data_prestacao,
              valor_total_comprovado: payload.valor_total_comprovado,
              status: payload.status
            });
            created++;
          }
        } catch (e) {
          console.error("Erro importando prestação:", e);
          errors++;
        }
      }
      toast({ title: "Importação de Prestações concluída", description: `Criadas: ${created} • Atualizadas: ${updated} • Erros: ${errors}` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro na importação de Prestações", description: e.message || String(e) });
    } finally {
      setLoading((p) => ({ ...p, prest: false }));
    }
  };

  const importReembolsos = async (file) => {
    setLoading((p) => ({ ...p, reemb: true }));
    try {
      const schema = {
        type: "object",
        properties: {
          protocolo: { type: "string" },
          data_reembolso: { type: "string" },
          valor_total_comprovado: { type: "number" },
          status: { type: "string" }
        }
      };
      const rows = await extractRows(file, schema);
      let created = 0, updated = 0, errors = 0;

      for (const row of rows) {
        try {
          if (!row.protocolo) { errors++; continue; }
          const existing = await Reembolso.filter({ protocolo: row.protocolo }, "-created_date", 1);
          const payload = {
            protocolo: row.protocolo,
            data_reembolso: row.data_reembolso,
            valor_total_comprovado: Number(row.valor_total_comprovado) || 0,
            status: normalizeStatus(row.status, ["rascunho","pendente","em_analise","aprovado","glosa","rejeitado","concluido"]) || "pendente"
          };
          if (existing.length > 0) {
            await Reembolso.update(existing[0].id, payload);
            updated++;
          } else {
            await Reembolso.create(payload);
            created++;
          }
        } catch (e) {
          console.error("Erro importando reembolso:", e);
          errors++;
        }
      }
      toast({ title: "Importação de Reembolsos concluída", description: `Criadas: ${created} • Atualizadas: ${updated} • Erros: ${errors}` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro na importação de Reembolsos", description: e.message || String(e) });
    } finally {
      setLoading((p) => ({ ...p, reemb: false }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Importar Dados (CSV)</h1>
        <p className="text-gray-600 mt-1">Carregue arquivos CSV separados para cada tipo de dado. Para anexos históricos, utilize a interface de Anexos.</p>
      </div>

      <Section
        title="Solicitações de Suprimento"
        description="Campos recomendados: numero_solicitacao, data_solicitacao (YYYY-MM-DD), valor_solicitado, justificativa, status, created_by (email), nome_servidor, cpf, lotacao..."
        onImport={importSolicitacoes}
        loading={loading.solic}
      />

      <Section
        title="Prestações de Contas"
        description="Campos recomendados: protocolo, data_prestacao (YYYY-MM-DD), valor_total_comprovado, status, solicitacao_numero (para vincular)."
        onImport={importPrestacoes}
        loading={loading.prest}
      />

      <Section
        title="Reembolsos"
        description="Campos recomendados: protocolo, data_reembolso (YYYY-MM-DD), valor_total_comprovado, status."
        onImport={importReembolsos}
        loading={loading.reemb}
      />
    </div>
  );
}