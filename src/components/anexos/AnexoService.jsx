
import { Anexo } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { AuditoriaService } from "../utils/AuditoriaService";

/**
 * Serviço para gerenciamento avançado de anexos com versionamento e permissões
 */
export class AnexoService {
  
  /**
   * Lista anexos com controle de visibilidade
   */
  static async listarAnexos(ownerTipo, ownerId, options = {}) {
    const {
      incluirInvisiveis = false,
      origem = null,
      categoria = null,
      ativo = true
    } = options;

    try {
      const filtros = {
        owner_tipo: ownerTipo,
        owner_id: ownerId
      };

      if (origem) filtros.origem = origem;
      if (categoria) filtros.categoria = categoria;

      let anexos = await Anexo.filter(filtros, '-created_date');

      // Filtrar por soft delete
      if (ativo) {
        anexos = anexos.filter(anexo => !anexo.deleted_at);
      }

      // Filtrar por visibilidade (se não for admin)
      if (!incluirInvisiveis) {
        // Verificar se usuário é admin (implementar lógica de permissão)
        const isAdmin = await this.isUserAdmin();
        if (!isAdmin) {
          anexos = anexos.filter(anexo => anexo.visivel_para_suprido !== false);
        }
      }

      return anexos;
    } catch (error) {
      console.error("Erro ao listar anexos:", error);
      throw error;
    }
  }

  /**
   * Upload de novo anexo, com detecção de versão.
   */
  static async uploadAnexo({
    arquivo,
    ownerTipo,
    ownerId,
    origem = 'suprido',
    categoria = 'documento',
    descricao = '',
    visivelParaSuprido = true,
    despesa_prestacao_id = null
  }) {
    try {
      // Verificar se já existe um anexo com o mesmo nome para este owner
      const anexosExistentes = await Anexo.filter({
        owner_tipo: ownerTipo,
        owner_id: ownerId,
        nome_original: arquivo.name,
      }, '-created_date'); // Ordenar para pegar o mais recente
      
      // Filtrar os que não foram deletados logicamente
      const anexosAtivos = anexosExistentes.filter(a => !a.deleted_at);

      if (anexosAtivos.length > 0) {
        // Encontrou, então é uma nova versão. Vamos substituir o mais recente.
        const anexoParaSubstituir = anexosAtivos[0];
        return await this.substituirAnexo(anexoParaSubstituir.id, arquivo);
      } else {
        // Não encontrou, é um arquivo novo (versão 1)
        const { file_url } = await UploadFile({ file: arquivo });

        const anexoData = {
          owner_tipo: ownerTipo,
          owner_id: ownerId,
          origem,
          categoria,
          nome_original: arquivo.name,
          url_assinada: file_url,
          content_type: arquivo.type,
          tamanho_bytes: arquivo.size,
          versao: 1,
          visivel_para_suprido: visivelParaSuprido,
          descricao,
          despesa_prestacao_id,
        };

        const anexo = await Anexo.create(anexoData);

        await AuditoriaService.registrarUpload(
          anexo.id,
          arquivo.name,
          categoria,
          ownerTipo,
          ownerId
        );

        return anexo;
      }
    } catch (error) {
      console.error("Erro ao fazer upload do anexo:", error);
      throw error;
    }
  }


  /**
   * Substituir anexo existente (incrementa versão)
   */
  static async substituirAnexo(anexoId, novoArquivo) {
    try {
      // Buscar anexo existente
      const anexoExistente = await Anexo.get(anexoId);
      if (!anexoExistente) {
        throw new Error("Anexo não encontrado");
      }

      // Upload do novo arquivo
      const { file_url } = await UploadFile({ file: novoArquivo });

      // Atualizar anexo incrementando versão
      const anexoAtualizado = await Anexo.update(anexoId, {
        nome_original: novoArquivo.name,
        url_assinada: file_url,
        content_type: novoArquivo.type,
        tamanho_bytes: novoArquivo.size,
        versao: (anexoExistente.versao || 1) + 1
      });

      // Registrar auditoria
      await AuditoriaService.registrarSubstituicao(
        anexoId,
        anexoExistente.nome_original,
        novoArquivo.name,
        anexoExistente.versao || 1,
        anexoAtualizado.versao
      );

      return anexoAtualizado;
    } catch (error) {
      console.error("Erro ao substituir anexo:", error);
      throw error;
    }
  }

  /**
   * Exclusão lógica de anexo
   */
  static async excluirAnexo(anexoId) {
    try {
      const anexo = await Anexo.get(anexoId);
      if (!anexo) {
        throw new Error("Anexo não encontrado");
      }

      await Anexo.update(anexoId, {
        deleted_at: new Date().toISOString()
      });

      // Registrar auditoria
      await AuditoriaService.registrarAcao({
        entidade: 'Anexo',
        entidadeId: anexoId,
        acao: 'delete',
        detalhes: {
          nome_arquivo: anexo.nome_original,
          soft_delete: true,
          timestamp: new Date().toISOString()
        }
      });

      return true;
    } catch (error) {
      console.error("Erro ao excluir anexo:", error);
      throw error;
    }
  }

  /**
   * Atualiza metadados de um anexo
   */
  static async updateMetadados(anexoId, metadata) {
    try {
      const anexo = await Anexo.get(anexoId);
      if (!anexo) {
        throw new Error("Anexo não encontrado");
      }

      // Filtrar apenas campos permitidos para atualização
      const camposPermitidos = ['categoria', 'descricao', 'visivel_para_suprido', 'despesa_prestacao_id'];
      const dadosParaAtualizar = {};
      for (const campo of camposPermitidos) {
        if (metadata[campo] !== undefined) {
          dadosParaAtualizar[campo] = metadata[campo];
        }
      }

      if (Object.keys(dadosParaAtualizar).length === 0) {
        return anexo; // Nenhum dado para atualizar
      }

      const anexoAtualizado = await Anexo.update(anexoId, dadosParaAtualizar);

      // Registrar auditoria
      await AuditoriaService.registrarAcao({
        entidade: 'Anexo',
        entidadeId: anexoId,
        acao: 'update',
        detalhes: {
          metadados_alterados: dadosParaAtualizar,
          timestamp: new Date().toISOString()
        }
      });

      return anexoAtualizado;
    } catch (error) {
      console.error("Erro ao atualizar metadados do anexo:", error);
      throw error;
    }
  }

  /**
   * Alterar visibilidade do anexo para o suprido (só admin)
   */
  static async alterarVisibilidade(anexoId, visivel) {
    try {
      // Verificar se é admin
      const isAdmin = await this.isUserAdmin();
      if (!isAdmin) {
        throw new Error("Apenas administradores podem alterar visibilidade");
      }

      await Anexo.update(anexoId, {
        visivel_para_suprido: visivel
      });

      // Registrar auditoria
      await AuditoriaService.registrarAcao({
        entidade: 'Anexo',
        entidadeId: anexoId,
        acao: 'update',
        detalhes: {
          visibilidade_alterada: visivel,
          timestamp: new Date().toISOString()
        }
      });

      return true;
    } catch (error) {
      console.error("Erro ao alterar visibilidade:", error);
      throw error;
    }
  }

  /**
   * Registrar download de anexo
   */
  static async registrarDownload(anexoId) {
    try {
      const anexo = await Anexo.get(anexoId);
      if (anexo) {
        await AuditoriaService.registrarDownload(anexoId, anexo.nome_original);
      }
    } catch (error) {
      console.warn("Erro ao registrar download:", error);
      // Não falhar o download por erro de auditoria
    }
  }

  /**
   * Verifica se usuário é admin (placeholder - implementar lógica real)
   */
  static async isUserAdmin() {
    try {
      const { User } = await import("@/api/entities");
      const user = await User.me();
      return user?.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  /**
   * Obter anexos por categoria e origem
   */
  static async obterAnexosOficiais(ownerTipo, ownerId) {
    return this.listarAnexos(ownerTipo, ownerId, {
      origem: 'admin',
      incluirInvisiveis: true
    });
  }

  /**
   * Obter anexos do suprido
   */
  static async obterAnexosSuprido(ownerTipo, ownerId) {
    return this.listarAnexos(ownerTipo, ownerId, {
      origem: 'suprido'
    });
  }
}
