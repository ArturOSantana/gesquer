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
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Ranking de Barracas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Top 5 barracas por faturamento</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-center py-8 text-sm text-muted-foreground">
            Nenhuma venda registrada ainda
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Ranking de Barracas</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Top 5 barracas por faturamento</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-2 sm:space-y-3">
          {data.map((barraca, index) => (
            <div
              key={barraca.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all hover:shadow-md ${getPositionColor(index)}`}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="text-xl sm:text-2xl font-bold min-w-[2.5rem] sm:min-w-[3rem] text-center flex-shrink-0">
                  {getMedalEmoji(index)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm truncate">{barraca.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {barraca.count} {barraca.count === 1 ? 'venda' : 'vendas'}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                <div className="font-bold text-base sm:text-lg">
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

