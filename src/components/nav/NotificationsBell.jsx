import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ChatMensagem } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Bell, Check, ExternalLink, MailOpen } from "lucide-react";

function snippet(text, n = 80) {
  if (!text) return "";
  return text.length > n ? text.slice(0, n - 1) + "…" : text;
}

export default function NotificationsBell({ user }) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [notifEnabled, setNotifEnabled] = React.useState(
    typeof window !== "undefined" ? localStorage.getItem("chatNotifEnabled") === "true" : false
  );
  const lastSeenRef = React.useRef(
    typeof window !== "undefined" ? Number(localStorage.getItem("chatNotifLastSeenAt") || 0) : 0
  );
  const notifiedIdsRef = React.useRef(new Set());

  const buildMessageLinkAndTitle = (m) => {
    if (m.solicitacao_id) {
      return {
        link: createPageUrl(`Chat?id=${m.solicitacao_id}&tipo=solicitacao`),
        title: `Nova mensagem (Solicitação)`
      };
    }
    if (m.prestacao_id) {
      return {
        link: createPageUrl(`Chat?id=${m.prestacao_id}&tipo=prestacao`),
        title: `Nova mensagem (Prestação)`
      };
    }
    if (m.reembolso_id) {
      return {
        link: createPageUrl(`Chat?id=${m.reembolso_id}&tipo=reembolso`),
        title: `Nova mensagem (Reembolso)`
      };
    }
    return { link: createPageUrl("Chat"), title: "Nova mensagem" };
  };

  const fetchUnread = React.useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    const list = await ChatMensagem.filter(
      { destinatario: user.email, lida: false },
      "-created_date",
      20
    );
    setItems(list || []);

    // Notificações do navegador (apenas para novas mensagens desde o último "visto")
    if (notifEnabled && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      (list || []).forEach((m) => {
        if (notifiedIdsRef.current.has(m.id)) return;
        const createdAtMs = m.created_date ? new Date(m.created_date).getTime() : 0;
        if (createdAtMs <= lastSeenRef.current) return;

        const { link, title } = buildMessageLinkAndTitle(m);
        try {
          const n = new Notification(title, {
            body: snippet(m.mensagem, 100),
            icon: "/favicon.ico"
          });
          n.onclick = () => {
            window.focus();
            window.open(link, "_blank");
          };
          notifiedIdsRef.current.add(m.id);
        } catch {
          // Ignora erros de permissão/ambiente
        }
      });
    }
    setLoading(false);
  }, [user?.email, notifEnabled]);

  React.useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 15000);
    return () => clearInterval(id);
  }, [fetchUnread]);

  const unreadCount = items.length;

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const perm = await Notification.requestPermission();
      const ok = perm === "granted";
      setNotifEnabled(ok);
      localStorage.setItem("chatNotifEnabled", String(ok));
    } catch {
      // ignore
    }
  };

  const toggleNotifications = async () => {
    if (!notifEnabled) {
      await requestPermission();
    } else {
      setNotifEnabled(false);
      localStorage.setItem("chatNotifEnabled", "false");
    }
  };

  const markAsRead = async (msgId) => {
    await ChatMensagem.update(msgId, { lida: true });
    setItems((prev) => prev.filter((i) => i.id !== msgId));
  };

  const markAllAsRead = async () => {
    await Promise.all(items.map((m) => ChatMensagem.update(m.id, { lida: true })));
    setItems([]);
  };

  const nowMarkSeen = () => {
    if (typeof window === "undefined") return;
    const now = Date.now();
    lastSeenRef.current = now;
    localStorage.setItem("chatNotifLastSeenAt", String(now));
  };

  return (
    <DropdownMenu open={open} onOpenChange={(o) => { setOpen(o); if (o) nowMarkSeen(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Notificações">
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 p-0">
        <div className="p-3 border-b flex items-center justify-between">
          <DropdownMenuLabel className="p-0">Mensagens</DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleNotifications}>
              <MailOpen className="w-4 h-4 mr-1" />
              {notifEnabled ? "Desktop ON" : "Desktop OFF"}
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="w-4 h-4 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Sem novas mensagens.</div>
          ) : (
            items.map((m) => {
              const { link, title } = buildMessageLinkAndTitle(m);
              return (
                <div key={m.id} className="p-3 border-b last:border-b-0">
                  <div className="text-xs text-gray-500 mb-1">{title}</div>
                  <div className="font-medium text-sm truncate">{snippet(m.mensagem, 120)}</div>
                  <div className="mt-2 flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Abrir
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => markAsRead(m.id)}>
                      <Check className="w-4 h-4 mr-1" />
                      Lida
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}