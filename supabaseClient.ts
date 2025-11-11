import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * --- Configuração do Cliente Supabase ---
 *
 * Para conectar esta aplicação ao seu projeto Supabase, você precisa
 * configurar as seguintes variáveis de ambiente no seu ambiente de deployment:
 *
 * 1. `SUPABASE_URL`: Encontrado em "Project Settings" > "API" no seu painel Supabase.
 * 2. `SUPABASE_ANON_KEY`: A chave `anon` (pública), encontrada na mesma página de API.
 *
 * Se estas variáveis não estiverem presentes, a aplicação funcionará em
 * "modo demonstração", utilizando um conjunto de dados de exemplo local,
 * sem conectar a um banco de dados real.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

// Inicializa o cliente Supabase apenas se as variáveis de ambiente estiverem definidas.
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export default supabase;