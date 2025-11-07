import { User } from "@/api/entities";

/**
 * Serviço para capturar e gerenciar snapshots de dados do solicitante.
 */
export class SolicitanteService {
  /**
   * Captura um snapshot dos dados do usuário atual ou de um usuário específico.
   * @param {object} user - Objeto de usuário (ex.: retornado por User.me()).
   * @param {string} fonte - Origem do snapshot (ex.: 'solicitacao_enviada').
   * @returns {object|null}
   */
  static async criarSnapshot(user, fonte) {
    if (!user) {
      console.warn("[SolicitanteService] user nulo/indefinido ao criar snapshot.");
      return null;
    }

    return {
      nome: user.nome_completo_customizado || user.full_name || user.email || null,
      cpf: user.cpf ?? null,
      cargo: user.cargo ?? null,
      lotacao: user.lotacao ?? null,
      departamento: user.setor ?? user.departamento ?? null,
      telefone: user.telefone ?? null,
      gestor_responsavel: user.gestor_responsavel ?? null,
      municipio: user.municipio ?? null,
      congelado_em: new Date().toISOString(),
      fonte: fonte || "desconhecida",
    };
  }
}

// Compatibilidade: named e default
export default SolicitanteService;