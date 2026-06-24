import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useBarracas } from '../../hooks/useBarracas';
import { useUsers } from '../../hooks/useUsers';
import { useToast } from '../../hooks/use-toast';
import { Spinner } from '../../components/ui/Spinner';
import { DeleteConfirmDialog } from '../../components/common/DeleteConfirmDialog';

// Cliente admin para operações privilegiadas (confirmação automática de email)
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { UserPlus, Edit, Shield, Loader2, Eye, EyeOff, Info, Trash2 } from 'lucide-react';
import { ROLES, getRoleLabel, getRoleBadgeColor } from '../../lib/permissions';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.CAIXA,
  });

  const { toast } = useToast();
  const { profile } = useAuth();
  
  // Hook de barracas com cache e loading
  const {
    barracas,
    loading: loadingBarracas,
    error: errorBarracas,
    invalidateCache
  } = useBarracas();

  // Hook de usuários para exclusão
  const {
    deleteUser,
    checkUserDependencies
  } = useUsers();

  useEffect(() => {
    console.log('🚀 useEffect executado - carregando usuários');
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          barracas:barraca_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }


  function handleOpenDialog(user = null) {
    if (user) {
      setEditingUser(user);
      const editFormData = {
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      };

      console.log('📝 Abrindo modal de edição do usuário:', user);
      console.log('📦 FormData inicial do modal:', editFormData);

      setFormData(editFormData);
    } else {
      setEditingUser(null);
      const initialFormData = {
        name: '',
        email: '',
        password: '',
        role: ROLES.CAIXA,
      };

      console.log('🆕 Abrindo modal para novo usuário');
      console.log('📦 FormData inicial do novo usuário:', initialFormData);

      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validações
    if (!formData.name || !formData.email) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (!editingUser && !formData.password) {
      toast({
        title: 'Erro',
        description: 'Senha é obrigatória para novos usuários',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast({
        title: 'Erro',
        description: 'Senha deve ter no mínimo 6 caracteres',
        variant: 'destructive',
      });
      return;
    }


    try {
      setLoading(true);

      if (editingUser) {
        // Atualizar usuário existente
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };

        console.log('💾 Dados que serão atualizados:', updateData);

        // Se senha foi fornecida, atualizar também
        if (formData.password) {
          // Aqui você precisaria usar uma função do Supabase Auth para atualizar senha
          // Por enquanto, vamos apenas atualizar os outros dados
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingUser.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Usuário atualizado com sucesso',
        });

        // Recarregar lista de usuários para refletir mudanças
        await loadUsers();
      } else {
        // Criar novo usuário com email já confirmado
        console.log('🆕 Criando novo usuário com email auto-confirmado...');
        
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,  // ← CONFIRMA EMAIL AUTOMATICAMENTE
          user_metadata: {
            name: formData.name,
            role: formData.role
          }
        });

        if (authError) {
          console.error('❌ Erro ao criar usuário:', authError);
          throw authError;
        }

        console.log('✅ Usuário criado com sucesso:', authData.user.id);
        console.log('📧 Email confirmado automaticamente!');

        // Inserir na tabela users usando supabaseAdmin para evitar erro de RLS
        console.log('🔐 Usando supabaseAdmin para inserir na tabela users');
        console.log('📦 Dados a inserir:', {
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          active: true
        });
        
        const { error: dbError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            role: formData.role
          });

        if (dbError) {
          console.error('❌ Erro ao inserir na tabela users:', dbError);
          toast({
            title: 'Erro',
            description: 'Erro ao salvar dados do usuário',
            variant: 'destructive',
          });
          return;
        }

        console.log('✅ Dados do usuário salvos na tabela users');

        toast({
          title: 'Sucesso',
          description: 'Usuário criado com sucesso! Email já confirmado.',
        });
      }

      setIsDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar usuário',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(user) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ active: !user.active })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Usuário ${user.active ? 'desativado' : 'ativado'} com sucesso`,
      });

      loadUsers();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do usuário',
        variant: 'destructive',
      });
    }
  }

  // Handler para abrir dialog de exclusão
  async function handleOpenDeleteDialog(user) {
    const { warnings } = await checkUserDependencies(user.id);
    setDeleteDialog({ open: true, user, warnings });
  }

  // Handler para confirmar exclusão
  async function handleConfirmDelete() {
    if (!deleteDialog.user) return;

    try {
      setIsDeleting(true);
      const { success, error } = await deleteUser(deleteDialog.user.id);

      if (error) throw new Error(error);

      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso',
      });

      setDeleteDialog({ open: false, user: null });
      loadUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir usuário',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-gray-600 mt-1">Gerencie os usuários do sistema</p>
          <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              <strong>Sobre desativação:</strong> Usuários desativados não podem fazer login, mas seus dados e histórico são mantidos no sistema para auditoria.
            </p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? 'Atualize as informações do usuário'
                  : 'Preencha os dados para criar um novo usuário'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Senha {!editingUser && '*'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Perfil *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => {
                    const updatedFormData = { ...formData, role: value };
                    console.log('👤 Perfil alterado:', value);
                    console.log('📦 FormData após alterar perfil:', updatedFormData);
                    setFormData(updatedFormData);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROLES.ADMIN}>Administrador</SelectItem>
                    <SelectItem value={ROLES.CAIXA}>Caixa</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.role === 'operador' && 'Operadores podem ser vinculados a múltiplos PDVs após a criação'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>Salvar</>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      {!user.active && (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(user)}
                    disabled={user.id === profile?.id}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  {/* Botão Desativar/Ativar */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={user.active ? "outline" : "default"}
                        size="sm"
                        disabled={user.id === profile?.id}
                      >
                        {user.active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {user.active ? 'Desativar' : 'Ativar'} usuário?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          {user.active ? (
                            <>
                              <p>
                                O usuário <strong>{user.name}</strong> não poderá mais fazer login no sistema.
                              </p>
                              <p className="text-blue-600">
                                Os dados e histórico do usuário serão mantidos para auditoria e podem ser reativados a qualquer momento.
                              </p>
                            </>
                          ) : (
                            <p>
                              O usuário <strong>{user.name}</strong> poderá acessar o sistema novamente com suas credenciais.
                            </p>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleToggleActive(user)}>
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Botão Excluir (apenas SuperAdmin) */}
                  {profile?.role === 'superadmin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDeleteDialog(user)}
                      disabled={user.id === profile?.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum usuário cadastrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de confirmação de exclusão */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null })}
        onConfirm={handleConfirmDelete}
        title={`Excluir usuário ${deleteDialog.user?.name}?`}
        description="Esta ação não pode ser desfeita. O usuário será removido permanentemente do sistema."
        itemName={deleteDialog.user?.name}
        warnings={deleteDialog.warnings || []}
        isDeleting={isDeleting}
      />
    </div>
  );
}

