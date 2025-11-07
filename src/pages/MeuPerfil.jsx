
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, User as UserIcon, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadFile } from "@/api/integrations";
import { Comarca } from "@/api/entities";
import { maskCPF, maskPhone, onlyDigits } from "@/components/utils/masks";

export default function MeuPerfil() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [comarcas, setComarcas] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    loadUserData();
    loadComarcas();
  }, []);

  const loadComarcas = async () => {
    try {
      const data = await Comarca.list("nome");
      setComarcas(data);
    } catch (e) {
      console.error("Erro ao carregar comarcas:", e);
    }
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
      // Preencher os valores do formulário com os dados do usuário
      setValue('nome_completo_customizado', userData.nome_completo_customizado || userData.full_name || '');
      setValue('cpf', userData.cpf || '');
      setValue('cargo', userData.cargo || '');
      setValue('lotacao', userData.lotacao || '');
      setValue('telefone', userData.telefone || '');
      setValue('setor', userData.setor || '');
      setValue('gestor_responsavel', userData.gestor_responsavel || '');
      setValue('municipio', userData.municipio || '');
      // New fields for bank details
      setValue('banco_nome', userData.banco_nome || '');
      setValue('banco_codigo', userData.banco_codigo || '');
      setValue('agencia', userData.agencia || '');
      setValue('conta', userData.conta || '');
      setValue('tipo_conta', userData.tipo_conta || '');
      // Removed: setValue('pix_chave', userData.pix_chave || '');
      setValue('comarca_id', userData.comarca_id || '');
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os dados do perfil." });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { file_url } = await UploadFile({ file });
      await User.updateMyUserData({ avatar_url: file_url });
      toast({ title: "Avatar atualizado!", description: "Sua foto foi alterada com sucesso." });
      const updated = await User.me();
      setUser(updated);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível enviar a imagem." });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      // Remover qualquer referência a pix_chave antes de salvar
      const { pix_chave, ...payload } = data;
      await User.updateMyUserData(payload);
      toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" });
      const updatedUser = await User.me(); // Recarrega para garantir a sincronia
      setUser(updatedUser);
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar o perfil. Tente novamente." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4"/>
        <p className="text-gray-600">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Cabeçalho com Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover border" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl">
              {(user?.full_name || 'U').slice(0,1)}
            </div>
          )}
          <label className="absolute -bottom-2 -right-2 bg-white border rounded-full px-2 py-1 text-xs cursor-pointer shadow">
            {uploadingAvatar ? 'Enviando...' : 'Trocar'}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-1">Gerencie suas informações pessoais e de contato</p>
        </div>
      </div>

      <Alert className="mb-8 border-yellow-500 text-yellow-800">
        <AlertTriangle className="h-4 w-4 !text-yellow-600" />
        <AlertTitle>Atenção!</AlertTitle>
        <AlertDescription>
          Manter seus dados de perfil atualizados é fundamental para a correta emissão de portarias e outros documentos.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(handleSave)} className="space-y-8">
        {/* Informações de Login (somente leitura) */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <p className="text-sm text-gray-600">Estas informações são gerenciadas pelo sistema e não podem ser alteradas</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email de Login</Label>
              <Input value={user?.email || ''} readOnly className="bg-gray-50 cursor-not-allowed" />
            </div>
            <div>
              <Label>Nome do Perfil (Google/Microsoft)</Label>
              <Input value={user?.full_name || ''} readOnly className="bg-gray-50 cursor-not-allowed" />
            </div>
            <div>
              <Label>Função no Sistema</Label>
              <Input value={user?.role === 'admin' ? 'Administrador' : 'Usuário'} readOnly className="bg-gray-50 cursor-not-allowed" />
            </div>
          </CardContent>
        </Card>

        {/* Informações Editáveis */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <p className="text-sm text-gray-600">Estas informações aparecerão em suas solicitações e documentos</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <Label htmlFor="nome_completo_customizado">Nome Completo para Exibição *</Label>
              <Input 
                id="nome_completo_customizado"
                {...register('nome_completo_customizado', { required: "O nome completo é obrigatório." })}
                placeholder="Digite seu nome completo"
                className={`text-lg ${errors.nome_completo_customizado ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {errors.nome_completo_customizado && <p className="text-red-500 text-xs mt-1">{errors.nome_completo_customizado.message}</p>}
              <p className="text-xs text-gray-500 mt-1">Este nome aparecerá em suas solicitações, portarias e outros documentos oficiais.</p>
            </div>
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input 
                id="cpf"
                {...register('cpf', { 
                  required: "O CPF é obrigatório.",
                  pattern: {
                    value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                    message: "Formato inválido. Use 000.000.000-00"
                  }
                })}
                onChange={(e) => {
                  const v = maskCPF(e.target.value);
                  setValue('cpf', v, { shouldValidate: true });
                }}
                placeholder="000.000.000-00"
                className={errors.cpf ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf.message}</p>}
            </div>
            <div>
              <Label htmlFor="cargo">Cargo *</Label>
              <Input 
                id="cargo"
                {...register('cargo', { required: "O cargo é obrigatório." })}
                placeholder="Ex: Analista Judiciário"
                className={errors.cargo ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.cargo && <p className="text-red-500 text-xs mt-1">{errors.cargo.message}</p>}
            </div>
            <div>
              <Label htmlFor="lotacao">Lotação *</Label>
              <Input 
                id="lotacao"
                {...register('lotacao', { required: "A lotação é obrigatória." })}
                placeholder="Ex: SOSFU"
                className={errors.lotacao ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.lotacao && <p className="text-red-500 text-xs mt-1">{errors.lotacao.message}</p>}
            </div>
            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input 
                id="telefone"
                {...register('telefone', { required: "O telefone é obrigatório." })}
                onChange={(e) => setValue('telefone', maskPhone(e.target.value), { shouldValidate: true })}
                placeholder="(00) 00000-0000"
                className={errors.telefone ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone.message}</p>}
            </div>
            <div>
              <Label htmlFor="setor">Setor *</Label>
              <Input 
                id="setor"
                {...register('setor', { required: "O setor é obrigatório." })}
                placeholder="Ex: SEPLAN"
                className={errors.setor ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.setor && <p className="text-red-500 text-xs mt-1">{errors.setor.message}</p>}
            </div>
            <div>
              <Label htmlFor="municipio">Município</Label>
              <Input 
                id="municipio"
                {...register('municipio')}
                placeholder="Ex: Belém"
              />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="gestor_responsavel">Gestor Responsável</Label>
              <Input 
                id="gestor_responsavel"
                {...register('gestor_responsavel')}
                placeholder="Nome do gestor da sua unidade"
              />
            </div>

            {/* Seleção de Comarca */}
            <div className="lg:col-span-3">
              <Label htmlFor="comarca_id">Comarca de Lotação</Label>
              <select
                id="comarca_id"
                {...register('comarca_id')}
                className="w-full mt-1 border rounded-md px-3 py-2"
              >
                <option value="">Selecione uma comarca</option>
                {comarcas.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.municipio ? `- ${c.municipio}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Usada para pagamento via conta da comarca, quando escolhido na solicitação.</p>
            </div>
          </CardContent>
        </Card>

        {/* Dados Bancários do Suprido (sem PIX) */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Dados Bancários do Suprido</CardTitle>
            <p className="text-sm text-gray-600">Essas informações serão exibidas/usadas na solicitação quando você escolher receber em sua conta</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="banco_nome">Banco (Nome)</Label>
              <Input id="banco_nome" {...register('banco_nome')} placeholder="Ex: Banco do Brasil" />
            </div>
            <div>
              <Label htmlFor="banco_codigo">Banco (Código)</Label>
              <Input 
                id="banco_codigo" 
                {...register('banco_codigo')}
                onChange={(e) => setValue('banco_codigo', onlyDigits(e.target.value))}
                placeholder="Ex: 001" 
              />
            </div>
            <div>
              <Label htmlFor="agencia">Agência</Label>
              <Input id="agencia" {...register('agencia')} placeholder="Ex: 1234-5" />
            </div>
            <div>
              <Label htmlFor="conta">Conta</Label>
              <Input id="conta" {...register('conta')} placeholder="Ex: 000123-4" />
            </div>
            <div>
              <Label htmlFor="tipo_conta">Tipo de Conta</Label>
              <Input id="tipo_conta" {...register('tipo_conta')} placeholder="Ex: Corrente" />
            </div>
            {/* Removido: Campo PIX */}
          </CardContent>
        </Card>

        {/* Botão de Salvar */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </div>
      </form>
    </div>
  );
}
