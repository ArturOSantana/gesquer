import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarracaList } from '@/components/barracas/BarracaList';
import { BarracaForm } from '@/components/barracas/BarracaForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useBarracas } from '@/hooks/useBarracas';
import { useToast } from '@/hooks/use-toast';
import { Store } from 'lucide-react';

/**
 * Página de gerenciamento de barracas
 */
export default function BarracaManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    barracas,
    loading,
    error,
    createBarraca,
    updateBarraca,
    deleteBarraca,
    toggleBarracaStatus,
    getBarracaStats
  } = useBarracas();

  const [showForm, setShowForm] = useState(false);
  const [editingBarraca, setEditingBarraca] = useState(null);
  const [deletingBarracaId, setDeletingBarracaId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Abre formulário para nova barraca
  const handleAdd = () => {
    setEditingBarraca(null);
    setShowForm(true);
  };

  // Abre formulário para editar barraca
  const handleEdit = (barraca) => {
    setEditingBarraca(barraca);
    setShowForm(true);
  };

  // Submete formulário (criar ou editar)
  const handleSubmit = async (formData) => {
    setFormLoading(true);
    
    try {
      let result;
      
      if (editingBarraca) {
        result = await updateBarraca(editingBarraca.id, formData);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        toast({
          title: 'Barraca atualizada!',
          description: 'As informações da barraca foram atualizadas com sucesso.',
        });
      } else {
        result = await createBarraca(formData);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        toast({
          title: 'Barraca criada!',
          description: 'A nova barraca foi criada com sucesso.',
        });
      }
      
      setShowForm(false);
      setEditingBarraca(null);
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Cancela formulário
  const handleCancel = () => {
    setShowForm(false);
    setEditingBarraca(null);
  };

  // Confirma exclusão de barraca
  const handleDeleteConfirm = async () => {
    if (!deletingBarracaId) return;
    
    try {
      const result = await deleteBarraca(deletingBarracaId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: 'Barraca deletada!',
        description: 'A barraca foi removida com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao deletar',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingBarracaId(null);
    }
  };

  // Alterna status da barraca
  const handleToggleStatus = async (barracaId, currentStatus) => {
    try {
      const result = await toggleBarracaStatus(barracaId, currentStatus);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      const newStatus = currentStatus === 'active' ? 'inativa' : 'ativa';
      toast({
        title: 'Status atualizado!',
        description: `A barraca foi ${newStatus} com sucesso.`,
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gerenciar Barracas</h1>
              <p className="text-muted-foreground">
                Cadastre e gerencie as barracas da quermesse
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Barracas */}
        <BarracaList
          barracas={barracas}
          loading={loading}
          error={error}
          onEdit={handleEdit}
          onDelete={(id) => setDeletingBarracaId(id)}
          onToggleStatus={handleToggleStatus}
          onAdd={handleAdd}
          showStats={true}
          getBarracaStats={getBarracaStats}
        />

        {/* Dialog de Formulário */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBarraca ? 'Editar Barraca' : 'Nova Barraca'}
              </DialogTitle>
              <DialogDescription>
                {editingBarraca 
                  ? 'Atualize as informações da barraca' 
                  : 'Preencha os dados para criar uma nova barraca'}
              </DialogDescription>
            </DialogHeader>
            <BarracaForm
              barraca={editingBarraca}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={formLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={!!deletingBarracaId} onOpenChange={() => setDeletingBarracaId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar esta barraca? Esta ação não pode ser desfeita.
                <br /><br />
                <strong>Nota:</strong> Barracas com produtos ou histórico de vendas não podem ser deletadas.
                Neste caso, desative a barraca ao invés de deletá-la.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

