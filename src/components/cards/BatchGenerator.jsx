import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { useBatch } from '../../hooks/useBatch';
import { useAuth } from '../../hooks/useAuth';

export function BatchGenerator() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [quantity, setQuantity] = useState(10);
  const [description, setDescription] = useState('');

  const { loading, error, generateBatch } = useBatch();

  const handleGenerate = async () => {
    if (quantity < 1 || quantity > 1000) {
      alert('Quantidade deve estar entre 1 e 1000');
      return;
    }

    const generatedBy = profile?.id || profile?.name || 'Admin';
    const result = await generateBatch(quantity, description, generatedBy);

    if (result.success) {
      navigate(`/admin/batches/${result.batch.id}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade de Cartões</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max="1000"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
            
          />
          <p className="text-sm text-gray-500">
            Mínimo: 1 | Máximo: 1000
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição (Opcional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleGenerate}
        disabled={loading || quantity < 1}
        className="w-full"
      >
        {loading ? 'Gerando...' : `Gerar ${quantity} Cartões`}
      </Button>
    </div>
  );
}

