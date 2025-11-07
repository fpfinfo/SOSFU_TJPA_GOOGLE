import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import NovoSuprimento from "./NovoSuprimento";

import AnaliseSuprimento from "./AnaliseSuprimento";

import Chat from "./Chat";

import DetalheSolicitacao from "./DetalheSolicitacao";

import MinhasSolicitacoes from "./MinhasSolicitacoes";

import NovaSuprimento from "./NovaSuprimento";

import MeuPerfil from "./MeuPerfil";

import MinhasPrestacoes from "./MinhasPrestacoes";

import NovaPrestacao from "./NovaPrestacao";

import AnalisePrestacao from "./AnalisePrestacao";

import DetalhePrestacao from "./DetalhePrestacao";

import MeusReembolsos from "./MeusReembolsos";

import NovoReembolso from "./NovoReembolso";

import DetalheReembolso from "./DetalheReembolso";

import AnaliseReembolso from "./AnaliseReembolso";

import GerenciarComarcas from "./GerenciarComarcas";

import GerenciarUsuarios from "./GerenciarUsuarios";

import ImportarDados from "./ImportarDados";

import FAQ from "./FAQ";

import Manual from "./Manual";

import GerenciarFAQ from "./GerenciarFAQ";

import GerenciarManual from "./GerenciarManual";

import GestaoINSS from "./GestaoINSS";

import Relatorios from "./Relatorios";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    NovoSuprimento: NovoSuprimento,
    
    AnaliseSuprimento: AnaliseSuprimento,
    
    Chat: Chat,
    
    DetalheSolicitacao: DetalheSolicitacao,
    
    MinhasSolicitacoes: MinhasSolicitacoes,
    
    NovaSuprimento: NovaSuprimento,
    
    MeuPerfil: MeuPerfil,
    
    MinhasPrestacoes: MinhasPrestacoes,
    
    NovaPrestacao: NovaPrestacao,
    
    AnalisePrestacao: AnalisePrestacao,
    
    DetalhePrestacao: DetalhePrestacao,
    
    MeusReembolsos: MeusReembolsos,
    
    NovoReembolso: NovoReembolso,
    
    DetalheReembolso: DetalheReembolso,
    
    AnaliseReembolso: AnaliseReembolso,
    
    GerenciarComarcas: GerenciarComarcas,
    
    GerenciarUsuarios: GerenciarUsuarios,
    
    ImportarDados: ImportarDados,
    
    FAQ: FAQ,
    
    Manual: Manual,
    
    GerenciarFAQ: GerenciarFAQ,
    
    GerenciarManual: GerenciarManual,
    
    GestaoINSS: GestaoINSS,
    
    Relatorios: Relatorios,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/NovoSuprimento" element={<NovoSuprimento />} />
                
                <Route path="/AnaliseSuprimento" element={<AnaliseSuprimento />} />
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/DetalheSolicitacao" element={<DetalheSolicitacao />} />
                
                <Route path="/MinhasSolicitacoes" element={<MinhasSolicitacoes />} />
                
                <Route path="/NovaSuprimento" element={<NovaSuprimento />} />
                
                <Route path="/MeuPerfil" element={<MeuPerfil />} />
                
                <Route path="/MinhasPrestacoes" element={<MinhasPrestacoes />} />
                
                <Route path="/NovaPrestacao" element={<NovaPrestacao />} />
                
                <Route path="/AnalisePrestacao" element={<AnalisePrestacao />} />
                
                <Route path="/DetalhePrestacao" element={<DetalhePrestacao />} />
                
                <Route path="/MeusReembolsos" element={<MeusReembolsos />} />
                
                <Route path="/NovoReembolso" element={<NovoReembolso />} />
                
                <Route path="/DetalheReembolso" element={<DetalheReembolso />} />
                
                <Route path="/AnaliseReembolso" element={<AnaliseReembolso />} />
                
                <Route path="/GerenciarComarcas" element={<GerenciarComarcas />} />
                
                <Route path="/GerenciarUsuarios" element={<GerenciarUsuarios />} />
                
                <Route path="/ImportarDados" element={<ImportarDados />} />
                
                <Route path="/FAQ" element={<FAQ />} />
                
                <Route path="/Manual" element={<Manual />} />
                
                <Route path="/GerenciarFAQ" element={<GerenciarFAQ />} />
                
                <Route path="/GerenciarManual" element={<GerenciarManual />} />
                
                <Route path="/GestaoINSS" element={<GestaoINSS />} />
                
                <Route path="/Relatorios" element={<Relatorios />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}