import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { Spinner } from '../ui/Spinner'
import { QrScanner } from '../qr/QrScanner'
import { useCardRecovery } from '../../hooks/useCardRecovery'
import { formatCPF, sanitizeCPF } from '../../lib/validators'
import { maskPhone } from '../../lib/crypto'
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  CreditCard,
  User,
  Phone,
  DollarSign,
  Shield,
  QrCode
} from 'lucide-react'

/**
 * Componente para recuperação de cartão perdido
 */
export function CardRecovery({ onSuccess, onCancel }) {
  const [step, setStep] = useState('search') // search, validate, scan, confirm
  const [phone, setPhone] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [cpfInput, setCpfInput] = useState('')
  const [presentialValidation, setPresentialValidation] = useState(false)
  const [newCardQR, setNewCardQR] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  const {
    loading,
    searchResults,
    cpfAttempts,
    maxCpfAttempts,
    validationMethod,
    searchClientByPhone,
    validateWithCPF,
    validatePresential,
    transferToNewCard,
    reset
  } = useCardRecovery()

  // Chave de criptografia (deve vir de variável de ambiente)
  const ENCRYPTION_KEY = import.meta.env.VITE_CPF_ENCRYPTION_KEY || 'default-key'

  /**
   * Busca cliente por telefone
   */
  const handleSearch = async (e) => {
    e.preventDefault()
    const result = await searchClientByPhone(phone)
    
    if (result.success && result.data.length > 0) {
      // Se houver apenas um cliente, seleciona automaticamente
      if (result.data.length === 1) {
        setSelectedClient(result.data[0])
        setStep('validate')
      } else {
        // Se houver múltiplos, mostra lista para seleção
        setStep('select')
      }
    }
  }

  /**
   * Seleciona cliente da lista
   */
  const handleSelectClient = (client) => {
    setSelectedClient(client)
    setStep('validate')
  }

  /**
   * Valida com CPF
   */
  const handleValidateCPF = async (e) => {
    e.preventDefault()
    
    const result = await validateWithCPF(
      selectedClient.id,
      cpfInput,
      ENCRYPTION_KEY
    )

    if (result.success) {
      setStep('scan')
    }
  }

  /**
   * Valida presencialmente
   */
  const handleValidatePresential = async () => {
    if (!presentialValidation) {
      return
    }

    const result = await validatePresential(
      selectedClient.id,
      null, // operatorId será obtido do auth
      'Documento validado presencialmente pelo operador'
    )

    if (result.success) {
      setStep('scan')
    }
  }

  /**
   * Escaneia novo cartão
   */
  const handleScanComplete = (qrCode) => {
    setNewCardQR(qrCode)
    setShowScanner(false)
    setStep('confirm')
  }

  /**
   * Confirma transferência
   */
  const handleConfirmTransfer = async () => {
    const result = await transferToNewCard(selectedClient.card_id, newCardQR)

    if (result.success) {
      onSuccess?.(result)
      handleReset()
    }
  }

  /**
   * Reseta o fluxo
   */
  const handleReset = () => {
    setStep('search')
    setPhone('')
    setSelectedClient(null)
    setCpfInput('')
    setPresentialValidation(false)
    setNewCardQR('')
    setShowScanner(false)
    reset()
  }

  /**
   * Cancela operação
   */
  const handleCancel = () => {
    handleReset()
    onCancel?.()
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recuperação de Cartão
          </CardTitle>
          <CardDescription>
            Recupere o acesso ao cartão usando telefone e validação de identidade
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Etapa 1: Buscar por telefone */}
      {step === 'search' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Buscar Cliente</CardTitle>
            <CardDescription>Digite o telefone cadastrado</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Buscar Cliente
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Etapa 1.5: Selecionar cliente (se múltiplos) */}
      {step === 'select' && searchResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecione o Cliente</CardTitle>
            <CardDescription>
              Múltiplos clientes encontrados com este telefone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {searchResults.map((client) => (
              <Card
                key={client.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleSelectClient(client)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Saldo: R$ {client.current_balance?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <Badge variant={client.has_cpf ? 'default' : 'secondary'}>
                      {client.has_cpf ? 'Com CPF' : 'Sem CPF'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={handleReset} className="w-full mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Etapa 2: Validar identidade */}
      {step === 'validate' && selectedClient && (
        <>
          {/* Informações do cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Validar Identidade</CardTitle>
              <CardDescription>Confirme a identidade do cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedClient.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{maskPhone(selectedClient.phone)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Atual</p>
                    <p className="font-medium text-green-600">
                      R$ {selectedClient.current_balance?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cartão Atual</p>
                    <p className="font-medium font-mono text-sm">
                      {selectedClient.card_qr_code || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedClient.is_minor && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Menor de idade</strong>
                    <br />
                    Responsável: {selectedClient.guardian_name}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Validação com CPF */}
          {selectedClient.has_cpf && cpfAttempts < maxCpfAttempts && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Validação com CPF</CardTitle>
                <CardDescription>
                  Digite o CPF cadastrado ({maxCpfAttempts - cpfAttempts} tentativa(s) restante(s))
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleValidateCPF} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpfInput}
                      onChange={(e) => {
                        const formatted = formatCPF(e.target.value)
                        setCpfInput(formatted)
                      }}
                      maxLength={14}
                      disabled={loading}
                      required
                    />
                  </div>

                  {cpfAttempts > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        CPF incorreto. {maxCpfAttempts - cpfAttempts} tentativa(s) restante(s)
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Validando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Validar CPF
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Validação presencial */}
          {(!selectedClient.has_cpf || cpfAttempts >= maxCpfAttempts) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Validação Presencial</CardTitle>
                <CardDescription>
                  Confirme que validou o documento do cliente presencialmente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cpfAttempts >= maxCpfAttempts && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Número máximo de tentativas de CPF excedido. 
                      Prossiga com validação presencial.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="presential"
                    checked={presentialValidation}
                    onChange={(e) => setPresentialValidation(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="presential" className="cursor-pointer">
                    Confirmo que validei o documento de identidade presencialmente
                  </Label>
                </div>

                <Button
                  onClick={handleValidatePresential}
                  disabled={!presentialValidation || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Confirmar Validação Presencial
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <Button variant="outline" onClick={handleReset} className="w-full">
            Voltar
          </Button>
        </>
      )}

      {/* Etapa 3: Escanear novo cartão */}
      {step === 'scan' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Escanear Novo Cartão</CardTitle>
            <CardDescription>
              Escaneie o QR Code do novo cartão para transferir o saldo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Identidade validada com sucesso via{' '}
                <strong>{validationMethod === 'cpf' ? 'CPF' : 'validação presencial'}</strong>
              </AlertDescription>
            </Alert>

            {!showScanner ? (
              <Button onClick={() => setShowScanner(true)} className="w-full">
                <QrCode className="mr-2 h-4 w-4" />
                Escanear Novo Cartão
              </Button>
            ) : (
              <div className="space-y-4">
                <QrScanner
                  onScanSuccess={handleScanComplete}
                  onError={(error) => console.error('Erro ao escanear:', error)}
                />
                <Button
                  variant="outline"
                  onClick={() => setShowScanner(false)}
                  className="w-full"
                >
                  Cancelar Escaneamento
                </Button>
              </div>
            )}

            <Button variant="outline" onClick={handleReset} className="w-full">
              Cancelar Recuperação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Etapa 4: Confirmar transferência */}
      {step === 'confirm' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">4. Confirmar Transferência</CardTitle>
            <CardDescription>
              Revise os dados antes de confirmar a transferência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{selectedClient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cartão Antigo:</span>
                <span className="font-mono text-sm">{selectedClient.card_qr_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cartão Novo:</span>
                <span className="font-mono text-sm">{newCardQR}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-muted-foreground">Saldo a Transferir:</span>
                <span className="font-bold text-green-600 text-lg">
                  R$ {selectedClient.current_balance?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                O cartão antigo será <strong>desativado</strong> e o saldo será transferido 
                para o novo cartão. Esta ação não pode ser desfeita.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={handleConfirmTransfer}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Transferindo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirmar Transferência
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('scan')}
                disabled={loading}
              >
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Made with Bob