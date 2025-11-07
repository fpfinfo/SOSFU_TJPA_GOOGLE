import React, { useEffect, useRef, useState } from "react";
import { ChatMensagem } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useCurrentUser } from "@/components/utils/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, FileText, Download, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ChatTab({ solicitacao, height = 520 }) {
  const user = useCurrentUser();
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!solicitacao?.id) return;

    const loadMensagens = async () => {
      const data = await ChatMensagem.filter({ solicitacao_id: solicitacao.id }, "created_date");
      setMensagens(data);

      // Marcar como lidas as mensagens recebidas
      const unread = data.filter((m) => m.destinatario === user?.email && !m.lida);
      for (const msg of unread) {
        await ChatMensagem.update(msg.id, { lida: true });
      }
    };

    loadMensagens();
    const interval = setInterval(loadMensagens, 5000);
    return () => clearInterval(interval);
  }, [solicitacao?.id, user?.email]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const handleSend = async (e) => {
    e?.preventDefault?.();
    if (!novaMensagem.trim() || !user || !solicitacao?.id) return;

    setLoading(true);
    try {
      const destinatario = user.role === "admin" ? solicitacao.created_by : solicitacao.analista_responsavel || "admin@tjpa.gov.br";
      await ChatMensagem.create({
        remetente: user.email,
        destinatario,
        mensagem: novaMensagem.trim(),
        tipo: "texto",
        solicitacao_id: solicitacao.id,
      });
      setNovaMensagem("");
      const data = await ChatMensagem.filter({ solicitacao_id: solicitacao.id }, "created_date");
      setMensagens(data);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user || !solicitacao?.id) return;
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const destinatario = user.role === "admin" ? solicitacao.created_by : solicitacao.analista_responsavel || "admin@tjpa.gov.br";
      await ChatMensagem.create({
        remetente: user.email,
        destinatario,
        mensagem: `Arquivo enviado: ${file.name}`,
        tipo: "arquivo",
        url_arquivo: file_url,
        nome_arquivo: file.name,
        solicitacao_id: solicitacao.id,
      });
      const data = await ChatMensagem.filter({ solicitacao_id: solicitacao.id }, "created_date");
      setMensagens(data);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white rounded-xl border" style={{ height }}>
      <div className="h-12 border-b px-4 flex items-center justify-between">
        <div className="font-semibold">Chat da Solicitação</div>
        <Badge variant="outline">{solicitacao?.numero_solicitacao}</Badge>
      </div>

      <div className="px-4 py-3 overflow-y-auto" style={{ height: height - 120 }}>
        <div className="max-w-3xl mx-auto space-y-4">
          {mensagens.map((mensagem) => {
            const isMine = mensagem.remetente === user?.email;
            const bubble =
              mensagem.tipo === "arquivo" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {/\.(png|jpg|jpeg|gif|webp)$/i.test(mensagem.nome_arquivo || "") ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{mensagem.nome_arquivo}</span>
                  </div>
                  <Button variant={isMine ? "secondary" : "outline"} size="sm" asChild>
                    <a href={mensagem.url_arquivo} target="_blank" rel="noopener noreferrer">
                      <Download className="w-3 h-3 mr-2" />
                      Baixar
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{mensagem.mensagem}</p>
              );

            return (
              <div key={mensagem.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${isMine ? "order-2" : "order-1"}`}>
                  <div className={`px-4 py-2 rounded-lg ${isMine ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-900 border"}`}>
                    {bubble}
                    <p className={`text-[11px] mt-2 ${isMine ? "text-blue-100" : "text-gray-500"}`}>
                      {format(new Date(mensagem.created_date), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <p className={`text-[11px] mt-1 ${isMine ? "text-right text-gray-500" : "text-left text-gray-500"}`}>
                    {isMine ? "Você" : user?.role === "admin" ? "Funcionário" : "Analista"}
                  </p>
                </div>
              </div>
            );
          })}

          {mensagens.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">Inicie a conversa sobre esta solicitação.</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="h-[72px] border-t px-3 lg:px-4 flex items-center">
        <form onSubmit={handleSend} className="w-full flex items-center gap-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />
          <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            placeholder="Digite sua mensagem..."
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !novaMensagem.trim()} className="bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}