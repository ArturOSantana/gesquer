import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CardList from '@/components/cards/CardList';
import CardForm from '@/components/cards/CardForm';
import CardDetails from '@/components/cards/CardDetails';
import { useCards } from '@/hooks/useCards';
import { CreditCard } from 'lucide-react';

/**
 * Página de gerenciamento de cartões
 * CRUD completo de cartões e clientes
 */
export default function CardManagement() {
  const { cards, loading, fetchCards } = useCards();
  
  const [selectedCard, setSelectedCard] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' ou 'edit'
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  // Abre formulário para criar novo cartão
  const handleCreateNew = () => {
    setSelectedCard(null);
    setFormMode('create');
    setShowForm(true);
    setActiveTab('form');
  };

  // Abre formulário para editar cartão
  const handleEdit = (card) => {
    setSelectedCard(card);
    setFormMode('edit');
    setShowForm(true);
    setShowDetails(false);
    setActiveTab('form');
  };

  // Abre detalhes do cartão
  const handleCardClick = (card) => {
    setSelectedCard(card);
    setShowDetails(true);
    setActiveTab('details');
  };

  // Sucesso ao criar/editar cartão
  const handleFormSuccess = (card) => {
    setShowForm(false);
    setSelectedCard(card);
    setShowDetails(true);
    setActiveTab('details');
    fetchCards(); // Atualiza lista
  };

  // Cancela formulário
  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedCard(null);
    setActiveTab('list');
  };

  // Atualiza cartão após modificação
  const handleCardUpdate = (updatedCard) => {
    setSelectedCard(updatedCard);
    fetchCards(); // Atualiza lista
  };

  // Deleta cartão
  const handleCardDelete = () => {
    setShowDetails(false);
    setSelectedCard(null);
    setActiveTab('list');
    fetchCards(); // Atualiza lista
  };

  // Volta para lista
  const handleBackToList = () => {
    setSelectedCard(null);
    setShowForm(false);
    setShowDetails(false);
    setActiveTab('list');
  };

  // Atualiza lista
  const handleRefresh = () => {
    fetchCards();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Gestão de Cartões</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie cartões e clientes do sistema
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="list" onClick={handleBackToList}>
            Lista de Cartões
          </TabsTrigger>
          <TabsTrigger value="form" disabled={!showForm}>
            {formMode === 'create' ? 'Novo Cartão' : 'Editar Cartão'}
          </TabsTrigger>
          <TabsTrigger value="details" disabled={!showDetails}>
            Detalhes
          </TabsTrigger>
        </TabsList>

        {/* Aba: Lista */}
        <TabsContent value="list">
          <CardList
            cards={cards}
            loading={loading}
            onCardClick={handleCardClick}
            onRefresh={handleRefresh}
            onCreateNew={handleCreateNew}
            showCreateButton={true}
          />
        </TabsContent>

        {/* Aba: Formulário */}
        <TabsContent value="form">
          {showForm && (
            <CardForm
              card={selectedCard}
              mode={formMode}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </TabsContent>

        {/* Aba: Detalhes */}
        <TabsContent value="details">
          {showDetails && selectedCard && (
            <CardDetails
              card={selectedCard}
              onEdit={handleEdit}
              onDelete={handleCardDelete}
              onUpdate={handleCardUpdate}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Made with Bob
