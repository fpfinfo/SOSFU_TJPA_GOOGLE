import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { SolicitacaoSuprimento } from '@/api/entities';
import { ItemDespesa } from '@/api/entities';
import { Anexo } from '@/api/entities';
import { UploadFile } from '@/api/integrations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Upload, FileText, Loader2, Save, Send } from 'lucide-react';

const formatCurrency = (value) => {
  if (typeof value !== 'string') {
    value = String(value);
  }
  const number = parseFloat(value.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const parseCurrency = (value) => {
  return parseFloat(value.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
};

export default function NovoSuprimento() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    numero_solicitacao: '',
    data_solicitacao: new Date().toISOString().split('T')[0],
    nome_servidor: '',
    cpf: '',
    cargo: '',
    lotacao: '',
    valor_solicitado: 0,
    justificativa: '',
    status: 'rascunho'
  });
  const [itens, setItens] = useState([]);
  const [anexos, setAnexos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    generateNumeroSolicitacao();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        nome_servidor: userData.full_name || '',
        cpf: userData.cpf || '',
        cargo: userData.cargo || '',
        lotacao: userData.lotacao || ''
      }));
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    }
  };

  const generateNumeroSolicitacao = () => {
    const ano = new Date().getFullYear();
    const timestamp = new Date().getTime();
    const randomSuffix = String(timestamp).slice(-4);
    setFormData(prev => ({ ...prev, numero_solicitacao: `SUP-${ano}-${randomSuffix}` }));
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleItemChange = (index, field, value) => {
    const newItens = [...itens];
    newItens[index][field] = value;

    if (field === 'quantidade' || field === 'valor_unitario') {
      const qtd = parseFloat(newItens[index].quantidade) || 0;
      const vlrUnit = parseCurrency(String(newItens[index].valor_unitario));
      newItens[index].valor_total = qtd * vlrUnit;
    }

    setItens(newItens);
    updateTotalValue(newItens);
  };
  
  const handleValorUnitarioChange = (index, value) => {
    const newItens = [...itens];
    const vlrUnit = parseCurrency(value);
    newItens[index].valor_unitario = value; // Keep formatted string in input
    const qtd = parseFloat(newItens[index].quantidade) || 0;
    newItens[index].valor_total = qtd * vlrUnit;
    setItens(newItens);
    updateTotalValue(newItens);
  };

  const updateTotalValue = (currentItens) => {
    const total = currentItens.reduce((sum, item) => sum + item.valor_total, 0);
    setFormData(prev => ({ ...prev, valor_solicitado: total }));
  };

  const addItem = () => {
    setItens([...itens, { id: Date.now(), codigo: '', descricao: '', quantidade: 1, valor_unitario: 'R$ 0,00', valor_total: 0 }]);
  };

  const removeItem = (index) => {
    const newItens = itens.filter((_, i) => i !== index);
    setItens(newItens);
    updateTotalValue(newItens);
  };
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      
      setAnexos([...anexos, {
        id: Date.now(),
        nome_arquivo: file.name,
        url_arquivo: file_url,
        tamanho: file.size,
      }]);

    } catch (error) {
      console.error("Erro no upload do arquivo:", error);
      alert("Falha no upload do arquivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAnexo = (id) => {
    setAnexos(anexos.filter(anexo => anexo.id !== id));
  };
  
  const saveOrSubmit = async (status) => {
    setLoading(true);

    const dataToSave = {
      ...formData,
      status: status,
      valor_solicitado: parseFloat(formData.valor_solicitado),
      itens: itens.map(item => ({
        ...item,
        valor_unitario: parseCurrency(String(item.valor_unitario)),
        valor_total: parseFloat(item.valor_total)
      })),
      anexos: anexos,
    };

    try {
      let solicitacaoId = formData.id;
      
      // Criar ou atualizar a solicitação
      if (solicitacaoId) {
        await SolicitacaoSuprimento.update(solicitacaoId, { ...dataToSave, itens: undefined, anexos: undefined });
      } else {
        const newSolicitacao = await SolicitacaoSuprimento.create({ ...dataToSave, itens: undefined, anexos: undefined });
        solicitacaoId = newSolicitacao.id;
        setFormData(prev => ({ ...prev, id: solicitacaoId }));
      }
      
      // Sincronizar itens e anexos
      await syncItens(solicitacaoId);
      await syncAnexos(solicitacaoId);

      alert(`Solicitação ${status === 'rascunho' ? 'salva como rascunho' : 'enviada'} com sucesso!`);
      if (status === 'pendente') {
        navigate('/MinhasSolicitacoes');
      }

    } catch (error) {
      console.error(`Erro ao ${status === 'rascunho' ? 'salvar' : 'enviar'} solicitação:`, error);
      alert("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const syncItens = async (solicitacaoId) => {
    const existingItens = await ItemDespesa.filter({ solicitacao_id: solicitacaoId });
    // Deletar itens que foram removidos
    for (const existingItem of existingItens) {
      if (!itens.find(item => item.id === existingItem.id)) {
        await ItemDespesa.delete(existingItem.id);
      }
    }
    // Criar ou atualizar itens
    for (const item of itens) {
      const itemData = {
        solicitacao_id: solicitacaoId,
        codigo: item.codigo,
        descricao: item.descricao,
        quantidade: parseInt(item.quantidade, 10),
        valor_unitario: parseCurrency(String(item.valor_unitario)),
        valor_total: item.valor_total
      };
      if (existingItens.find(ei => ei.id === item.id)) {
        await ItemDespesa.update(item.id, itemData);
      } else {
        await ItemDespesa.create(itemData);
      }
    }
  };

  const syncAnexos = async (solicitacaoId) => {
    const existingAnexos = await Anexo.filter({ solicitacao_id: solicitacaoId });
    // Deletar anexos removidos
    for (const existingAnexo of existingAnexos) {
      if (!anexos.find(anexo => anexo.id === existingAnexo.id)) {
        await Anexo.delete(existingAnexo.id);
      }
    }
    // Criar novos anexos
    for (const anexo of anexos) {
      if (!existingAnexos.find(ea => ea.id === anexo.id)) {
        await Anexo.create({
          solicitacao_id: solicitacaoId,
          nome_arquivo: anexo.nome_arquivo,
          url_arquivo: anexo.url_arquivo,
          tamanho: anexo.tamanho,
        });
      }
    }
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Nova Solicitação de Suprimento</h1>
          <p className="text-gray-600">Preencha os dados para solicitar suprimento de fundos</p>
        </div>
        <div className="text-right">
          <p className="font-semibold uppercase text-sm text-gray-500">Status</p>
          <p className="font-bold text-lg text-blue-600">{formData.status}</p>
        </div>
      </div>
      
      <form onSubmit={(e) => e.preventDefault()}>
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Dados Gerais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><Label>Número</Label><Input value={formData.numero_solicitacao} readOnly /></div>
            <div><Label>Data</Label><Input type="date" value={formData.data_solicitacao} onChange={(e) => handleInputChange('data_solicitacao', e.target.value)} required /></div>
            <div><Label>Nome Completo</Label><Input value={formData.nome_servidor} onChange={(e) => handleInputChange('nome_servidor', e.target.value)} required /></div>
            <div><Label>CPF</Label><Input value={formData.cpf} onChange={(e) => handleInputChange('cpf', e.target.value)} required /></div>
            <div><Label>Cargo</Label><Input value={formData.cargo} onChange={(e) => handleInputChange('cargo', e.target.value)} required /></div>
            <div><Label>Lotação</Label><Input value={formData.lotacao} onChange={(e) => handleInputChange('lotacao', e.target.value)} required /></div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mt-6">
          <CardHeader>
            <CardTitle>Justificativa</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Descreva o motivo e a finalidade da solicitação de suprimento de fundos..."
              value={formData.justificativa}
              onChange={(e) => handleInputChange('justificativa', e.target.value)}
              rows={4}
              required
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mt-6">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Elementos de Despesa</CardTitle>
            <Button type="button" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-2" />Adicionar Item</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[15%]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[10%]">Qtd.</TableHead>
                  <TableHead className="w-[15%] text-right">Vlr. Unitário</TableHead>
                  <TableHead className="w-[15%] text-right">Vlr. Total</TableHead>
                  <TableHead className="w-[10%]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.length > 0 ? (
                  itens.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell><Input placeholder="339030" value={item.codigo} onChange={(e) => handleItemChange(index, 'codigo', e.target.value)} /></TableCell>
                      <TableCell><Input placeholder="Material de Consumo" value={item.descricao} onChange={(e) => handleItemChange(index, 'descricao', e.target.value)} /></TableCell>
                      <TableCell><Input type="number" value={item.quantidade} onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)} className="text-center" /></TableCell>
                      <TableCell>
                        <Input 
                            value={item.valor_unitario} 
                            onChange={(e) => handleValorUnitarioChange(index, e.target.value)}
                            onBlur={(e) => handleValorUnitarioChange(index, formatCurrency(e.target.value))}
                            className="text-right" 
                         />
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.valor_total)}</TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhum item adicionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4 pr-4">
                <div className="text-right">
                    <Label className="text-sm font-normal text-gray-600">Total Previsto</Label>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(formData.valor_solicitado)}</p>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mt-6">
          <CardHeader>
            <CardTitle>Anexos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-6 border-2 border-dashed rounded-lg text-center">
              <Input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              <Button type="button" variant="outline" asChild>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : <><Upload className="w-4 h-4 mr-2" />Adicionar Arquivo</>}
                </Label>
              </Button>
              <p className="text-xs text-gray-500 mt-2">Envie orçamentos, cotações, etc.</p>
            </div>
            <div className="mt-4 space-y-2">
              {anexos.map(anexo => (
                <div key={anexo.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <p className="font-medium truncate text-sm">{anexo.nome_arquivo}</p>
                    <p className="text-xs text-gray-500">({(anexo.tamanho / 1024).toFixed(1)} KB)</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeAnexo(anexo.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-8">
          <Button type="button" variant="outline" onClick={() => saveOrSubmit('rascunho')} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar Rascunho
          </Button>
          <Button type="button" onClick={() => saveOrSubmit('pendente')} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} Enviar para Análise
          </Button>
        </div>
      </form>
    </div>
  );
}