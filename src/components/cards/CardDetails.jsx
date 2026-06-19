import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  CreditCard, 
  User, 
  Phone, 
  Mail,
  Calendar,
  DollarSign,
  History,
  QrCode,
  Edit,
  Trash2,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useCards } from '@/hooks/useCards';
import CardBalance from './CardBalance';
import QrDisplay from '../qr/QrDisplay';

/**
 * Componente para exibir detalhes completos do cartão
 * 
 * @param {Object} props
 * @param {Object} props.card - Dados do cartão
 * @param {Function} props.onEdit - Callback para editar
 * @param {Function} props.onDelete - Callback após deletar
 * @param {Function} props.onUpdate - Callback após atualizar
 */
export default function CardDetails({ 
  card,
  onEdit,
  onDelete,
  onUpdate
}) {
  const { updateCard, deleteCard, getCardTransactions, loading } = useCards();
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  if (!card) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Nenhum cartão selecionado
          </p>
        </CardContent>
      </Card>
    );
  }

  // Carrega transações quando aba é ativada
  const handleTabChange = async (value) => {
    setActiveTab(value);
    
    if (value === 'transactions' && transactions.length === 0) {
      setLoadingTransactions(true);
      const { data } = await getCardTransactions(card.id);
      if (data) {
        setTransactions(data);
      }
      setLoadingTransactions(false);
    }
  };

  // Alterna status do cartão
  const handleToggleStatus = async () => {
    const newStatus = card.status === 'active' ? 'blocked' : 'active';
    const { data, error } = await updateCard(card.id, { status: newStatus });
    
    if (!error && onUpdate) {
      onUpdate(data);
    }
  };

  // Deleta cartão
  const handleDelete = async () => {
    const { error } = await deleteCard(card.id);
    
    if (!error && onDelete) {
      onDelete(card.id);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'recharge':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'purchase':
        return <CreditCard className="h-4 w-4 text-red-600" />;
      case 'refund':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (type) => {
    const labels = {
      recharge: 'Recarga',
      purchase: 'Compra',
      refund: 'Estorno',
      transfer_in: 'Transferência Recebida',
      transfer_out: 'Transferência Enviada'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho com ações */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Detalhes do Cartão
              </CardTitle>
              <CardDescription>
                Informações completas e histórico
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(card)}
                  disabled={loading}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                disabled={loading}
              >
                {card.status === 'active' ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading || card.balance > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita.
                      {card.balance > 0 && (
                        <span className="block mt-2 text-destructive font-medium">
                          Atenção: O cartão possui saldo de {formatCurrency(card.balance)}. 
                          Transfira o saldo antes de excluir.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={card.balance > 0}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="balance">Saldo</TabsTrigger>
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          <TabsTrigger value="transactions">Histórico</TabsTrigger>
        </TabsList>

        {/* Aba: Informações */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome */}
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{card.client?.name || 'N/A'}</p>
              </div>

              {/* Telefone */}
              {card.client?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {card.client.phone}
                  </p>
                </div>
              )}

              {/* Email */}
              {card.client?.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {card.client.email}
                  </p>
                </div>
              )}

              {/* CPF */}
              {card.client?.cpf && (
                <div>
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {card.client.cpf}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informações do Cartão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* UUID */}
              <div>
                <p className="text-sm text-muted-foreground">UUID</p>
                <p className="font-mono text-sm">{card.uuid}</p>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                  {card.status === 'active' ? 'Ativo' : 
                   card.status === 'inactive' ? 'Inativo' : 
                   card.status === 'blocked' ? 'Bloqueado' : card.status}
                </Badge>
              </div>

              {/* Datas */}
              <div>
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDateTime(card.created_at)}
                </p>
              </div>

              {card.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Última atualização</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(card.updated_at)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Saldo */}
        <TabsContent value="balance">
          <CardBalance 
            card={card}
            showRecharge={true}
            onRechargeSuccess={onUpdate}
          />
        </TabsContent>

        {/* Aba: QR Code */}
        <TabsContent value="qrcode">
          <QrDisplay 
            card={card}
            client={card.client}
            showClientInfo={true}
            showBalance={true}
            qrSize={256}
          />
        </TabsContent>

        {/* Aba: Histórico */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Transações
              </CardTitle>
              <CardDescription>
                Últimas 50 transações do cartão
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma transação registrada ainda
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium">
                            {getTransactionLabel(transaction.type)}
                          </p>
                          {transaction.description && (
                            <p className="text-sm text-muted-foreground">
                              {transaction.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'purchase' || transaction.type === 'transfer_out'
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}>
                          {transaction.type === 'purchase' || transaction.type === 'transfer_out' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Saldo: {formatCurrency(transaction.balance_after)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

