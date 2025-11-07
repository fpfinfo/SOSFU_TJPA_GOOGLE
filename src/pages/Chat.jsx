import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChatMensagem } from "@/api/entities";
import { SolicitacaoSuprimento } from "@/api/entities";
import { PrestacaoContas } from "@/api/entities";
import { Reembolso } from "@/api/entities";
import { useCurrentUser } from "@/components/utils/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Util: lê query params conforme guideline
const getParams = () => new URLSearchParams(window.location.search);

export default function ChatPage() {
  const user = useCurrentUser();
  const { toast } = useToast();
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [assunto, setAssunto] = useState(null); // registro da entidade (solicitação, prestação, reembolso)
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const lastCountRef = useRef(0);
  const listRef = useRef(null);

  const params = getParams();
  const tipo = (params.get("tipo") || "solicitacao").toLowerCase(); // solicitacao | prestacao | reembolso
  const contextoId = params.get("id");

  const filterKey = useMemo(() => {
    if (tipo === "prestacao") return "prestacao_id";
    if (tipo === "reembolso") return "reembolso_id";
    return "solicitacao_id";
  }, [tipo]);

  const tituloChat = useMemo(() => {
    if (tipo === "prestacao") return "Chat da Prestação de Contas";
    if (tipo === "reembolso") return "Chat do Reembolso";
    return "Chat da Solicitação";
  }, [tipo]);

  const backUrl = useMemo(() => {
    const isAdmin = user?.role === "admin";
    if (tipo === "prestacao") return createPageUrl(isAdmin ? "AnalisePrestacao" : "MinhasPrestacoes");
    if (tipo === "reembolso") return createPageUrl(isAdmin ? "AnaliseReembolso" : "MeusReembolsos");
    return createPageUrl(isAdmin ? "AnaliseSuprimento" : "MinhasSolicitacoes");
  }, [tipo, user]);

  const carregarAssunto = async () => {
    if (!contextoId) return;
    if (tipo === "prestacao") {
      const r = await PrestacaoContas.get(contextoId);
      setAssunto(r);
    } else if (tipo === "reembolso") {
      const r = await Reembolso.get(contextoId);
      setAssunto(r);
    } else {
      const r = await SolicitacaoSuprimento.get(contextoId);
      setAssunto(r);
    }
  };

  const carregarMensagens = async () => {
    if (!contextoId) return;
    const filtro = { [filterKey]: contextoId };
    const msgs = await ChatMensagem.filter(filtro, "created_date"); // crescente por data
    setMensagens(msgs);
    // Notificação de novas mensagens (se aumentou e a última não é minha)
    if (lastCountRef.current > 0 && msgs.length > lastCountRef.current) {
      const ultima = msgs[msgs.length - 1];
      if (ultima && ultima.remetente !== user?.email) {
        toast({ title: "Nova mensagem", description: "Você recebeu uma nova mensagem no chat." });
      }
    }
    lastCountRef.current = msgs.length;
    // scroll bottom
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 0);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([carregarAssunto(), carregarMensagens()]).finally(() => setLoading(false));
    const interval = setInterval(() => {
      carregarMensagens();
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextoId, filterKey]);

  const obterDestinatario = () => {
    // Regras simples: admin fala com o criador do registro; usuário fala com "admin"
    const criador = assunto?.created_by || "";
    if (user?.role === "admin" && criador) return criador;
    return "admin";
  };

  const enviar = async () => {
    const texto = (novaMensagem || "").trim();
    if (!texto || !contextoId || !user) return;
    setEnviando(true);
    try {
      const destinatario = obterDestinatario();
      const payload = {
        [filterKey]: contextoId,
        remetente: user.email,
        destinatario,
        mensagem: texto,
        tipo: "texto",
        lida: false
      };
      await ChatMensagem.create(payload);
      setNovaMensagem("");
      await carregarMensagens();
      toast({ title: "Enviado", description: "Sua mensagem foi enviada." });
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      enviar();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <Button asChild variant="outline" size="icon">
          <Link to={backUrl}><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tituloChat}</h1>
          {assunto && (
            <p className="text-sm text-gray-600">
              {tipo === "reembolso" && <>Protocolo: <span className="font-medium">{assunto.protocolo}</span></>}
              {tipo === "prestacao" && <>Protocolo: <span className="font-medium">{assunto.protocolo}</span></>}
              {tipo === "solicitacao" && <>Solicitação: <span className="font-medium">{assunto.numero_solicitacao}</span></>}
            </p>
          )}
        </div>
      </div>

      <Card className="flex-1 border-none shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-gray-700">Conversa</CardTitle>
        </CardHeader>
        <CardContent className="h-full flex flex-col">
          <div ref={listRef} className="flex-1 overflow-y-auto space-y-2 pr-2">
            {loading ? (
              <div className="h-24 bg-gray-100 animate-pulse rounded" />
            ) : mensagens.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Nenhuma mensagem até o momento.</div>
            ) : (
              mensagens.map((m) => {
                const isMinha = m.remetente === user?.email;
                return (
                  <div key={m.id} className={`flex ${isMinha ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMinha ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                      <div className="whitespace-pre-wrap break-words">{m.mensagem}</div>
                      <div className={`mt-1 text-[10px] ${isMinha ? "text-blue-100" : "text-gray-500"}`}>
                        {m.created_date ? format(new Date(m.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR }) : ""}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 border-t pt-3">
            <div className="flex items-center gap-2">
              <Textarea
                placeholder="Escreva sua mensagem..."
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[44px]"
              />
              <Button onClick={enviar} disabled={enviando || !novaMensagem.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
            <div className="text-xs text-gray-400 mt-1">Dica: use Ctrl+Enter para enviar.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}