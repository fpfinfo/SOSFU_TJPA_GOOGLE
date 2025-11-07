import { LogAuditoria } from "@/api/entities";
import { User } from "@/api/entities";

/**
 * Serviço centralizado para registro de auditoria
 */
export class AuditoriaService {
  
  /**
   * Registra uma ação de auditoria
   */
  static async registrarAcao({
    entidade,
    entidadeId,
    acao,
    detalhes = {},
    actorId = null,
    actorNome = null,
    actorEmail = null
  }) {
    try {
      // Se não foi fornecido actor, tentar obter do usuário logado
      if (!actorId || !actorNome || !actorEmail) {
        try {
          const user = await User.me();
          actorId = actorId || user.id || user.email;
          actorNome = actorNome || user.full_name || user.nome;
          actorEmail = actorEmail || user.email;
        } catch (error) {
          console.warn("Não foi possível obter dados do usuário para auditoria:", error);
          actorId = actorId || 'sistema';
          actorNome = actorNome || 'Sistema';
          actorEmail = actorEmail || 'sistema@tjpa.gov.br';
        }
      }

      await LogAuditoria.create({
        entidade,
        entidade_id: entidadeId,
        acao,
        detalhes,
        actor_id: actorId,
        actor_nome: actorNome,
        actor_email: actorEmail,
        ip_address: this.getClientIP(),
        user_agent: this.getUserAgent()
      });

    } catch (error) {
      console.error("Erro ao registrar auditoria:", error);
      // Não falhar a operação principal por erro de auditoria
    }
  }

  /**
   * Registra criação de entidade
   */
  static async registrarCriacao(entidade, entidadeId, dadosCompletos, actor = null) {
    await this.registrarAcao({
      entidade,
      entidadeId,
      acao: 'create',
      detalhes: {
        dados_criados: dadosCompletos,
        timestamp: new Date().toISOString()
      },
      ...actor
    });
  }

  /**
   * Registra atualização de entidade
   */
  static async registrarAtualizacao(entidade, entidadeId, dadosAnteriores, dadosNovos, actor = null) {
    const diff = this.calcularDiferenca(dadosAnteriores, dadosNovos);
    
    await this.registrarAcao({
      entidade,
      entidadeId,
      acao: 'update',
      detalhes: {
        dados_anteriores: dadosAnteriores,
        dados_novos: dadosNovos,
        diferenca: diff,
        timestamp: new Date().toISOString()
      },
      ...actor
    });
  }

  /**
   * Registra mudança de status
   */
  static async registrarMudancaStatus(entidade, entidadeId, statusAnterior, statusNovo, observacao, actor = null) {
    await this.registrarAcao({
      entidade,
      entidadeId,
      acao: 'status_change',
      detalhes: {
        status_anterior: statusAnterior,
        status_novo: statusNovo,
        observacao,
        timestamp: new Date().toISOString()
      },
      ...actor
    });
  }

  /**
   * Registra upload de anexo
   */
  static async registrarUpload(anexoId, nomeArquivo, categoria, ownerTipo, ownerId, actor = null) {
    await this.registrarAcao({
      entidade: 'Anexo',
      entidadeId: anexoId,
      acao: 'upload',
      detalhes: {
        nome_arquivo: nomeArquivo,
        categoria,
        owner_tipo: ownerTipo,
        owner_id: ownerId,
        timestamp: new Date().toISOString()
      },
      ...actor
    });
  }

  /**
   * Registra substituição de anexo
   */
  static async registrarSubstituicao(anexoId, nomeArquivoAntigo, nomeArquivoNovo, versaoAntiga, versaoNova, actor = null) {
    await this.registrarAcao({
      entidade: 'Anexo',
      entidadeId: anexoId,
      acao: 'replace',
      detalhes: {
        nome_arquivo_anterior: nomeArquivoAntigo,
        nome_arquivo_novo: nomeArquivoNovo,
        versao_anterior: versaoAntiga,
        versao_nova: versaoNova,
        timestamp: new Date().toISOString()
      },
      ...actor
    });
  }

  /**
   * Registra download de anexo
   */
  static async registrarDownload(anexoId, nomeArquivo, actor = null) {
    await this.registrarAcao({
      entidade: 'Anexo',
      entidadeId: anexoId,
      acao: 'download',
      detalhes: {
        nome_arquivo: nomeArquivo,
        timestamp: new Date().toISOString()
      },
      ...actor
    });
  }

  /**
   * Calcula diferenças entre dois objetos
   */
  static calcularDiferenca(anterior, novo) {
    const diff = {};
    const todasChaves = new Set([...Object.keys(anterior || {}), ...Object.keys(novo || {})]);
    
    for (const chave of todasChaves) {
      const valorAnterior = anterior?.[chave];
      const valorNovo = novo?.[chave];
      
      if (valorAnterior !== valorNovo) {
        diff[chave] = {
          de: valorAnterior,
          para: valorNovo
        };
      }
    }
    
    return diff;
  }

  /**
   * Obtém IP do cliente (placeholder - implementar conforme ambiente)
   */
  static getClientIP() {
    // Em um ambiente real, isso seria obtido do request
    return window.location.hostname || 'localhost';
  }

  /**
   * Obtém User Agent
   */
  static getUserAgent() {
    return navigator.userAgent;
  }
}