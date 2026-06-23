import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { SubscriptionCard } from '../../components/subscription/SubscriptionCard'
import { ArrowLeft } from 'lucide-react'

export default function Subscription() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Minha Assinatura</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua assinatura e veja os limites de uso
          </p>
        </div>
      </div>

      <SubscriptionCard />
    </div>
  )
}

// Made with Bob
