import { Link } from 'react-router-dom';
import { Layers, List } from 'lucide-react';
import { BatchGenerator } from '../../components/cards/BatchGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function GenerateBatch() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Geração de Lote de Cartões
          </h1>
          <p className="mt-2 text-gray-600">
            Crie lotes de cartões pré-pagos e acesse a visualização completa após a geração.
          </p>
        </div>

        <Button asChild variant="outline" className="gap-2">
          <Link to="/admin/batches">
            <List className="h-4 w-4" />
            Ver Lotes
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Novo Lote
          </CardTitle>
          <CardDescription>
            Ao concluir a geração, você será redirecionado automaticamente para os detalhes do lote.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BatchGenerator />
        </CardContent>
      </Card>
    </div>
  );
}

