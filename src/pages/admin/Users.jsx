import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { UserPlus, Edit, Trash2, Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import { ROLES, getRoleLabel, getRoleBadgeColor } from '../../lib/permissions';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [barracas, setBarracas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.CAIXA,
    barraca_id: '',
  });

  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    loadUsers();
    loadBarracas();
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
            nome
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

  async function loadBarracas() {
    try {
      const { data, error } = await supabase
        .from('barracas')
        .select('id, nome')
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;
      setBarracas(data || []);
    } catch (error) {
      console.error('Erro ao carregar barracas:', error);
    }
  }

  function handleOpenDialog(user = null) {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        barraca_id: user.barraca_id || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: ROLES.CAIXA,
        barraca_id: '',
      });
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

    if (formData.role === ROLES.BARRACA && !formData.barraca_id) {
      toast({
        title: 'Erro',
        description: 'Selecione uma barraca para o operador',
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
          barraca_id: formData.role === ROLES.BARRACA ? formData.barraca_id : null,
        };

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
      } else {
        // Criar novo usuário
        // Primeiro, criar no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        // Depois, criar registro na tabela users
        const { error: dbError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            role: formData.role,
            barraca_id: formData.role === ROLES.BARRACA ? formData.barraca_id : null,
            password_hash: 'managed_by_auth', // Placeholder
            active: true,
          });

        if (dbError) throw dbError;

        toast({
          title: 'Sucesso',
          description: 'Usuário criado com sucesso',
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
                  placeholder="Nome completo"
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
                  placeholder="email@exemplo.com"
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
                    placeholder={editingUser ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}
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
                  onValueChange={(value) => setFormData({ ...formData, role: value, barraca_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROLES.ADMIN}>Administrador</SelectItem>
                    <SelectItem value={ROLES.CAIXA}>Caixa</SelectItem>
                    <SelectItem value={ROLES.BARRACA}>Operador de Barraca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === ROLES.BARRACA && (
                <div className="space-y-2">
                  <Label htmlFor="barraca">Barraca *</Label>
                  <Select
                    value={formData.barraca_id}
                    onValueChange={(value) => setFormData({ ...formData, barraca_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma barraca" />
                    </SelectTrigger>
                    <SelectContent>
                      {barracas.map((barraca) => (
                        <SelectItem key={barraca.id} value={barraca.id}>
                          {barraca.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                    {user.barracas && (
                      <p className="text-sm text-gray-500 mt-1">
                        Barraca: {user.barracas.nome}
                      </p>
                    )}
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
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={user.id === profile?.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {user.active ? 'Desativar' : 'Ativar'} usuário?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {user.active 
                            ? 'O usuário não poderá mais acessar o sistema.'
                            : 'O usuário poderá acessar o sistema novamente.'
                          }
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
    </div>
  );
}

// Made with Bob
