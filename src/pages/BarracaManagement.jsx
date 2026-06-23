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
 * Página de gerenciamento de pontos de venda (PDVs)
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

  // Abre formulário para novo ponto de venda
  const handleAdd = () => {
    setEditingBarraca(null);
    setShowForm(true);
  };

  // Abre formulário para editar ponto de venda
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
          title: 'Ponto de Venda atualizado!',
          description: 'As informações do PDV foram atualizadas com sucesso.',
        });
      } else {
        result = await createBarraca(formData);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        toast({
          title: 'Ponto de Venda criado!',
          description: 'O novo PDV foi criado com sucesso.',
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

  // Confirma exclusão de ponto de venda
  const handleDeleteConfirm = async () => {
    if (!deletingBarracaId) return;
    
    try {
      const result = await deleteBarraca(deletingBarracaId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: 'Ponto de Venda deletado!',
        description: 'O PDV foi removido com sucesso.',
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

  // Alterna status do ponto de venda
  const handleToggleStatus = async (barracaId, currentStatus) => {
    try {
      const result = await toggleBarracaStatus(barracaId, currentStatus);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      const newStatus = currentStatus === 'active' ? 'inativo' : 'ativo';
      toast({
        title: 'Status atualizado!',
        description: `O ponto de venda foi ${newStatus} com sucesso.`,
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
              <h1 className="text-3xl font-bold">Gerenciar Pontos de Venda</h1>
              <p className="text-muted-foreground">
                Cadastre e gerencie os pontos de venda do evento
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
                {editingBarraca ? 'Editar Ponto de Venda' : 'Novo Ponto de Venda'}
              </DialogTitle>
              <DialogDescription>
                {editingBarraca
                  ? 'Atualize as informações do ponto de venda'
                  : 'Preencha os dados para criar um novo ponto de venda'}
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
                Tem certeza que deseja deletar este ponto de venda? Esta ação não pode ser desfeita.
                <br /><br />
                <strong>Nota:</strong> Pontos de venda com produtos ou histórico de vendas não podem ser deletados.
                Neste caso, desative o PDV ao invés de deletá-lo.
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

