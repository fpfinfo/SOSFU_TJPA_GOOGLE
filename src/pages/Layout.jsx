

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/components/utils/UserContext";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import ThemeToggle from "@/components/ui/ThemeToggle";
import NotificationsBell from "@/components/nav/NotificationsBell";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  DollarSign,
  Menu,
  LogOut,
  User as UserIcon,
  Search,
  ClipboardList as ClipboardListIcon,
  FileText as FileTextIcon,
  HelpCircle,
  BookOpen,
  Settings,
  BarChart3
} from 'lucide-react';

const SidebarContent = ({ user, currentPageName, onLinkClick }) => {
  const location = useLocation();
  const roleLabel = user?.role === 'admin' ? 'GESTOR' : 'SUPRIDO';

  // Atualiza itens de navegação incluindo Prestação e Análise Prestação
  const navigationItems = user?.role === 'admin' ? [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "Análise Suprimento", url: createPageUrl("AnaliseSuprimento"), icon: FileText },
  { title: "Análise Prestação", url: createPageUrl("AnalisePrestacao"), icon: FileTextIcon },
  { title: "Análise Reembolso", url: createPageUrl("AnaliseReembolso"), icon: ClipboardList },
  { title: "Relatórios", url: createPageUrl("Relatorios"), icon: BarChart3 },
  { title: "FAQ", url: createPageUrl("FAQ"), icon: HelpCircle },
  { title: "Manual de Uso", url: createPageUrl("Manual"), icon: BookOpen }] :
  [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "Minhas Solicitações", url: createPageUrl("MinhasSolicitacoes"), icon: ClipboardListIcon },
  { title: "Minhas Prestações", url: createPageUrl("MinhasPrestacoes"), icon: FileTextIcon },
  { title: "Meus Reembolsos", url: createPageUrl("MeusReembolsos"), icon: DollarSign },
  { title: "Meu Perfil", url: createPageUrl("MeuPerfil"), icon: UserIcon },
  { title: "FAQ", url: createPageUrl("FAQ"), icon: HelpCircle },
  { title: "Manual de Uso", url: createPageUrl("Manual"), icon: BookOpen }];

  const isActive = (item) => {
    if (item.url === location.pathname) return true;

    const params = new URLSearchParams(location.search);
    const tipoParam = params.get("tipo");

    // Suprido (não admin): subpáginas e Chat contextual
    if (user?.role !== 'admin') {
      if (item.title === "Minhas Solicitações" && ["DetalheSolicitacao", "Chat", "NovoSuprimento", "NovaSuprimento"].includes(currentPageName)) {
        if (currentPageName === "Chat" && tipoParam && tipoParam !== "solicitacao") return false;
        return true;
      }
      if (item.title === "Minhas Prestações" && (["NovaPrestacao", "DetalhePrestacao"].includes(currentPageName) || currentPageName === "Chat" && tipoParam === "prestacao")) {
        return true;
      }
      if (item.title === "Meus Reembolsos" && (["NovoReembolso", "DetalheReembolso"].includes(currentPageName) || currentPageName === "Chat" && tipoParam === "reembolso")) {
        return true;
      }
    }

    // Admin: subpáginas e Chat contextual
    if (user?.role === 'admin') {
      if ((item.title === "Análise Suprimento" || item.title === "Dashboard") && ["DetalheSolicitacao", "Chat"].includes(currentPageName)) {
        if (currentPageName === "Chat" && tipoParam && tipoParam !== "solicitacao") return false;
        return true;
      }
      if (item.title === "Análise Prestação" && (["AnalisePrestacao"].includes(item.title) || currentPageName === "Chat" && tipoParam === "prestacao" || currentPageName === "AnalisePrestacao")) {
        return true;
      }
      if (item.title === "Análise Reembolso" && (["AnaliseReembolso"].includes(item.title) || currentPageName === "Chat" && tipoParam === "reembolso" || currentPageName === "AnaliseReembolso" || currentPageName === "DetalheReembolso")) {
        return true;
      }
      if (item.title === "Relatórios" && currentPageName === "Relatorios") {
        return true;
      }
    }

    return false;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Cabeçalho com novo ícone SOSFU e rótulo por perfil */}
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm ring-1 ring-blue-500/20">
          <span className="text-white font-extrabold tracking-widest text-[12px]">
            SOSFU
          </span>
        </div>
        <div className="leading-tight">
          <h1 className="text-lg font-bold text-gray-900">
            {roleLabel}
          </h1>
          <p className="text-xs text-gray-500 hidden sm:block">Gestão de Suprimento de Fundos</p>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-3">
        <div className="space-y-1">
          {navigationItems.map((item) =>
          <Link
            key={item.title}
            to={item.url}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive(item) ?
            'bg-blue-50 text-blue-700 border border-blue-200' :
            'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
            }
            onClick={onLinkClick}>
              <item.icon className="w-5 h-5" />
              {item.title}
            </Link>
          )}
        </div>
      </nav>
      <div className="p-4 border-t mt-auto">
        <div className="flex items-center gap-3">
          {user?.avatar_url ?
          <img src={user.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover border" /> :
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-gray-600" />
            </div>
          }
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold text-sm text-gray-800 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => User.logout()} title="Sair">
            <LogOut className="w-5 h-5 text-gray-500 hover:text-red-500" />
          </Button>
        </div>
      </div>
    </div>);

};

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    User.me()
      .then(setUser)
      .catch(() => {
        User.login();
      });
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex" style={{ background: "var(--app-bg)", color: "var(--app-text)" }}>
      <style>{`
        :root{
          --app-bg:#f5f7fb;
          --app-text:#0f172a;
          --card-bg:#ffffff;
          --border:#e5e7eb;
          --muted:#6b7280;
          --brand:#2563eb;
          --selection:#dbeafe;
          --scrollbar:#c7d2fe;
        }
        [data-theme='dark']{
          --app-bg:#0b1220;
          --app-text:#e5e7eb;
          --card-bg:#0f172a;
          --border:#1f2937;
          --muted:#9ca3af;
          --brand:#60a5fa;
          --selection:#1f2937;
          --scrollbar:#334155;
        }
        ::selection{ background: var(--selection); }
        [data-theme='dark'] .bg-white{ background-color: var(--card-bg) !important; }
        [data-theme='dark'] .border, 
        [data-theme='dark'] .border-b, 
        [data-theme='dark'] .border-t, 
        [data-theme='dark'] .border-l, 
        [data-theme='dark'] .border-r{ border-color: var(--border) !important; }
        [data-theme='dark'] .text-gray-900{ color: var(--app-text) !important; }
        [data-theme='dark'] .text-gray-600{ color: var(--muted) !important; }
        ::-webkit-scrollbar{ width:10px; height:10px; }
        ::-webkit-scrollbar-thumb{ background: var(--scrollbar); border-radius: 8px; }
        ::-webkit-scrollbar-track{ background: transparent; }
      `}</style>

      <aside className="hidden lg:block w-64 border-r print:hidden">
        <SidebarContent user={user} currentPageName={currentPageName} />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72 print:hidden">
          <SidebarContent user={user} currentPageName={currentPageName} onLinkClick={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between lg:justify-end h-16 bg-white border-b px-6 sticky top-0 z-10 print:hidden">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationsBell user={user} />
          </div>
        </header>

        <Breadcrumbs currentPageName={currentPageName} />

        <main className="flex-1 overflow-y-auto print:p-0">
          <UserProvider user={user}>
            {children}
          </UserProvider>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

