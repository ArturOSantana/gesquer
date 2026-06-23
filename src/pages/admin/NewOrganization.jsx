import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrganization } from '../../contexts/OrganizationContext'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { ArrowLeft, Building2, AlertCircle, Save } from 'lucide-react'

export default function NewOrganization() {
  const navigate = useNavigate()
  const { createOrganization, isSuperAdmin } = useOrganization()

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'paroquia',
    custom_type: '',
    contact_email: '',
    contact_phone: '',
    address: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Redirecionar se não for superadmin
  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas SuperAdmin pode criar organizações.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-gerar slug a partir do nome
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .replace(/^-|-$/g, '') // Remove hífens no início/fim
      
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validações
    if (!formData.name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    if (!formData.slug.trim()) {
      setError('Slug é obrigatório')
      return
    }

    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      setError('Slug deve conter apenas letras minúsculas, números e hífens')
      return
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      setError('E-mail inválido')
      return
    }

    if (formData.type === 'outro' && !formData.custom_type.trim()) {
      setError('Por favor, especifique o tipo de organização')
      return
    }

    setLoading(true)

    const { data, error: createError } = await createOrganization({
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      type: formData.type === 'outro' ? formData.custom_type.trim() : formData.type,
      contact_email: formData.contact_email.trim() || null,
      contact_phone: formData.contact_phone.trim() || null,
      address: formData.address.trim() || null,
      is_active: true,
    })

    setLoading(false)

    if (createError) {
      setError(createError)
    } else {
      navigate('/admin/organizations')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/organizations')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Nova Organização
        </h1>
        <p className="text-muted-foreground mt-1">
          Cadastre uma nova organização no sistema
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Organização</CardTitle>
          <CardDescription>
            Preencha os dados da nova organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome da Organização <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug (Identificador único) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                pattern="[a-z0-9-]+"
                required
              />
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números e hífens. Gerado automaticamente a partir do nome.
              </p>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Tipo de Organização <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  handleChange('type', value)
                  if (value !== 'outro') {
                    setFormData(prev => ({ ...prev, custom_type: '' }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paroquia">Paróquia</SelectItem>
                  <SelectItem value="escola">Escola</SelectItem>
                  <SelectItem value="associacao">Associação</SelectItem>
                  <SelectItem value="empresa">Empresa</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo customizado quando tipo é "outro" */}
            {formData.type === 'outro' && (
              <div className="space-y-2">
                <Label htmlFor="custom_type">
                  Especifique o Tipo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="custom_type"
                  value={formData.custom_type}
                  onChange={(e) => handleChange('custom_type', e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ex: ONG, Clube, Sindicato, etc.
                </p>
              </div>
            )}

            {/* E-mail */}
            <div className="space-y-2">
              <Label htmlFor="contact_email">E-mail de Contato</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleChange('contact_email', e.target.value)}
              />
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Telefone de Contato</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
              />
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/organizations')}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Criar Organização
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  )
}

// Made with Bob
