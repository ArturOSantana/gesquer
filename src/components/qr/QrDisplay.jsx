import { useState } from 'react';
import QrGenerator from './QrGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

/**
 * Componente para exibir QR Code com informações do cartão
 * Combina QrGenerator com dados do cartão/cliente
 * 
 * @param {Object} props
 * @param {Object} props.card - Dados do cartão
 * @param {Object} props.client - Dados do cliente (opcional)
 * @param {boolean} props.showClientInfo - Mostrar informações do cliente (padrão: true)
 * @param {boolean} props.showBalance - Mostrar saldo (padrão: true)
 * @param {number} props.qrSize - Tamanho do QR Code (padrão: 200)
 */
export default function QrDisplay({ 
  card,
  client,
  showClientInfo = true,
  showBalance = true,
  qrSize = 200
}) {
  const [balanceVisible, setBalanceVisible] = useState(false);

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

  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible);
  };

  return (
    <div className="space-y-4">
      {/* QR Code */}
      <QrGenerator 
        uuid={card.uuid}
        size={qrSize}
        title="QR Code do Cartão"
        showDownload={true}
      />

      {/* Informações do Cartão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Informações do Cartão
          </CardTitle>
          <CardDescription>
            Detalhes e saldo atual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
              {card.status === 'active' ? 'Ativo' : 
               card.status === 'inactive' ? 'Inativo' : 
               card.status === 'blocked' ? 'Bloqueado' : card.status}
            </Badge>
          </div>

          {/* Saldo */}
          {showBalance && (
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-medium">Saldo Atual:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary">
                  {balanceVisible ? formatCurrency(card.balance) : '••••••'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleBalanceVisibility}
                  className="h-8 w-8 p-0"
                >
                  {balanceVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Data de Criação */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Criado em:</span>
            </div>
            <span className="font-medium">
              {formatDate(card.created_at)}
            </span>
          </div>

          {/* Última Atualização */}
          {card.updated_at && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Atualizado em:</span>
              <span className="font-medium">
                {formatDate(card.updated_at)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações do Cliente */}
      {showClientInfo && client && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Nome */}
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{client.name}</p>
              </div>
            </div>

            {/* Telefone */}
            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </div>
            )}

            {/* Email */}
            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{client.email}</p>
                </div>
              </div>
            )}

            {/* CPF */}
            {client.cpf && (
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-medium">{client.cpf}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Aviso de Segurança */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-sm text-blue-800">
              <strong>Como usar:</strong> O cliente deve escanear este QR Code com a câmera do celular.
              Ele será redirecionado automaticamente para a página de consulta de saldo.
            </p>
            <p className="text-xs text-blue-700">
              <strong>Importante:</strong> Não compartilhe este QR Code com terceiros.
              Ele dá acesso ao saldo e transações do cartão.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

