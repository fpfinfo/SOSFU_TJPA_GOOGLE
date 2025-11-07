import { Anexo } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { AuditoriaService } from "../utils/AuditoriaService";

export async function uploadAnexo({
  file,
  prestacaoId,
  origem = 'suprido',
  categoria = 'comprovante',
  despesaPrestacaoId = null,
  visivelParaSuprido = true,
  descricao = null,
}) {
  if (!prestacaoId) {
    throw new Error('owner_id (prestacaoId) é obrigatório para upload de anexo.');
  }

  try {
    // Verificar se já existe um anexo com o mesmo nome para versionamento
    const anexosExistentes = await Anexo.filter({
      owner_tipo: 'prestacao',
      owner_id: prestacaoId,
      nome_original: file.name,
    }, '-created_date');
    
    const anexosAtivos = anexosExistentes.filter(a => !a.deleted_at);

    // Upload do arquivo
    const { file_url } = await UploadFile({ file: file });

    const anexoData = {
      owner_tipo: 'prestacao',           // snake_case
      owner_id: prestacaoId,             // snake_case
      origem,
      categoria,
      nome_original: file.name,
      url_assinada: file_url,            // snake_case
      content_type: file.type || 'application/octet-stream',
      tamanho_bytes: file.size,
      versao: anexosAtivos.length > 0 ? (anexosAtivos[0].versao || 1) + 1 : 1,
      visivel_para_suprido: visivelParaSuprido,  // snake_case
      descricao,
      despesa_prestacao_id: despesaPrestacaoId,  // snake_case
    };

    const anexo = await Anexo.create(anexoData);

    // Registrar auditoria
    await AuditoriaService.registrarUpload(
      anexo.id,
      file.name,
      categoria,
      'prestacao',
      prestacaoId
    );

    return anexo;
  } catch (error) {
    console.error("Erro ao fazer upload do anexo:", error);
    throw error;
  }
}

export async function listarAnexosPrestacao(prestacaoId, options = {}) {
  const {
    incluirInvisiveis = false,
    origem = null,
    categoria = null,
    ativo = true
  } = options;

  try {
    const filtros = {
      owner_tipo: 'prestacao',
      owner_id: prestacaoId
    };

    if (origem) filtros.origem = origem;
    if (categoria) filtros.categoria = categoria;

    let anexos = await Anexo.filter(filtros, '-created_date');

    // Filtrar por soft delete
    if (ativo) {
      anexos = anexos.filter(anexo => !anexo.deleted_at);
    }

    // Filtrar por visibilidade
    if (!incluirInvisiveis) {
      anexos = anexos.filter(anexo => anexo.visivel_para_suprido !== false);
    }

    return anexos;
  } catch (error) {
    console.error("Erro ao listar anexos:", error);
    throw error;
  }
}

export async function excluirAnexo(anexoId) {
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

export async function registrarDownload(anexoId) {
  try {
    const anexo = await Anexo.get(anexoId);
    if (anexo) {
      await AuditoriaService.registrarDownload(anexoId, anexo.nome_original);
    }
  } catch (error) {
    console.warn("Erro ao registrar download:", error);
  }
}