
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight, Home } from "lucide-react";
import { useCurrentUser } from "@/components/utils/UserContext";

const MAP = {
  Dashboard: { label: "Dashboard", url: createPageUrl("Dashboard") },
  MinhasSolicitacoes: { label: "Minhas Solicitações", url: createPageUrl("MinhasSolicitacoes") },
  MinhasPrestacoes: { label: "Minhas Prestações", url: createPageUrl("MinhasPrestacoes") },
  MeusReembolsos: { label: "Meus Reembolsos", url: createPageUrl("MeusReembolsos") },
  AnaliseSuprimento: { label: "Análise de Suprimento", url: createPageUrl("AnaliseSuprimento") },
  AnalisePrestacao: { label: "Análise de Prestação", url: createPageUrl("AnalisePrestacao") },
  AnaliseReembolso: { label: "Análise de Reembolso", url: createPageUrl("AnaliseReembolso") },
  NovoSuprimento: { label: "Nova Solicitação", url: createPageUrl("NovoSuprimento") },
  NovaPrestacao: { label: "Nova Prestação", url: createPageUrl("NovaPrestacao") },
  NovoReembolso: { label: "Novo Reembolso", url: createPageUrl("NovoReembolso") },
  DetalheSolicitacao: { label: "Detalhe da Solicitação" },
  DetalhePrestacao: { label: "Detalhe da Prestação" },
  DetalheReembolso: { label: "Detalhe do Reembolso" },
  GerenciarComarcas: { label: "Gerenciar Comarcas", url: createPageUrl("GerenciarComarcas") },
  GerenciarUsuarios: { label: "Gerenciar Usuários", url: createPageUrl("GerenciarUsuarios") },
  MeuPerfil: { label: "Meu Perfil", url: createPageUrl("MeuPerfil") },
  FAQ: { label: "FAQ", url: createPageUrl("FAQ") },
  Manual: { label: "Manual de Uso", url: createPageUrl("Manual") },
  GerenciarFAQ: { label: "Gerenciar FAQ", url: createPageUrl("GerenciarFAQ") },
  GerenciarManual: { label: "Gerenciar Manual", url: createPageUrl("GerenciarManual") },
};

export default function Breadcrumbs({ currentPageName }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const user = useCurrentUser();

  // Base sempre começa em Dashboard
  const trail = [MAP.Dashboard];

  // Acrescenta seção pai quando apropriado
  const add = (item) => { if (item) trail.push(item); };

  switch (currentPageName) {
    case "MinhasSolicitacoes":
    case "NovoSuprimento":
      add(MAP.MinhasSolicitacoes);
      if (currentPageName === "NovoSuprimento") add(MAP.NovoSuprimento);
      break;
    case "DetalheSolicitacao":
      add(MAP.MinhasSolicitacoes);
      add(MAP.DetalheSolicitacao);
      break;

    case "MinhasPrestacoes":
    case "NovaPrestacao":
      add(MAP.MinhasPrestacoes);
      if (currentPageName === "NovaPrestacao") add(MAP.NovaPrestacao);
      break;
    case "DetalhePrestacao":
      add(MAP.MinhasPrestacoes);
      add(MAP.DetalhePrestacao);
      break;

    case "MeusReembolsos":
    case "NovoReembolso":
      add(MAP.MeusReembolsos);
      if (currentPageName === "NovoReembolso") add(MAP.NovoReembolso);
      break;
    case "DetalheReembolso":
      add(user?.role === 'admin' ? MAP.AnaliseReembolso : MAP.MeusReembolsos);
      add(MAP.DetalheReembolso);
      break;

    case "AnaliseSuprimento":
      add(MAP.AnaliseSuprimento);
      break;
    case "AnalisePrestacao":
      add(MAP.AnalisePrestacao);
      break;
    case "AnaliseReembolso":
      add(MAP.AnaliseReembolso);
      break;

    case "GerenciarComarcas":
      add(MAP.GerenciarComarcas);
      break;
    case "GerenciarUsuarios":
      add(MAP.GerenciarUsuarios);
      break;
    case "MeuPerfil":
      add(MAP.MeuPerfil);
      break;
    case "FAQ":
      add(MAP.FAQ);
      break;
    case "Manual":
      add(MAP.Manual);
      break;
    case "GerenciarFAQ":
      add(MAP.GerenciarFAQ);
      break;
    case "GerenciarManual":
      add(MAP.GerenciarManual);
      break;
    default:
      break;
  }

  // Opcional: detalhe com ID
  const id = params.get("id");
  if (id && trail.length > 1) {
    const last = trail[trail.length - 1];
    if (!last.url) {
      last.label = `${last.label} (${id.slice(0, 6)}...)`;
    }
  }

  return (
    <nav className="w-full py-2 px-4 text-sm text-gray-600 bg-white border-b sticky top-16 z-[9] hidden print:hidden md:block">
      <ol className="flex items-center gap-1">
        <li>
          <Link to={createPageUrl("Dashboard")} className="inline-flex items-center gap-1 hover:text-gray-900">
            <Home className="w-4 h-4" />
            Início
          </Link>
        </li>
        {trail.slice(1).map((item, idx) => (
          <li key={idx} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {item.url ? (
              <Link to={item.url} className="hover:text-gray-900">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-800">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
