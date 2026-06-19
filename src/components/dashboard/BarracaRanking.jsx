import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';

export function BarracaRanking({ data }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getMedalEmoji = (position) => {
    switch (position) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `${position + 1}º`;
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 0:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 1:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 2:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Barracas</CardTitle>
          <CardDescription>Top 5 barracas por faturamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma venda registrada ainda
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Barracas</CardTitle>
        <CardDescription>Top 5 barracas por faturamento</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((barraca, index) => (
            <div
              key={barraca.id}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${getPositionColor(index)}`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl font-bold min-w-[3rem] text-center">
                  {getMedalEmoji(index)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{barraca.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {barraca.count} {barraca.count === 1 ? 'venda' : 'vendas'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {formatCurrency(barraca.total)}
                </div>
                <Badge variant="outline" className="text-xs mt-1">
                  {((barraca.total / data[0].total) * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Made with Bob
