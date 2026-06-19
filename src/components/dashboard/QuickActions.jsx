import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: '$',
      title: 'Nova Venda',
      description: 'Registrar venda',
      path: '/sale',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: '♦',
      title: 'Novo Cartão',
      description: 'Cadastrar cartão',
      path: '/cards',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: '+',
      title: 'Recarregar',
      description: 'Adicionar créditos',
      path: '/scan-card',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      icon: '□',
      title: 'Estoque',
      description: 'Gerenciar produtos',
      path: '/stock',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      icon: '⌂',
      title: 'Barracas',
      description: 'Gerenciar barracas',
      path: '/barracas',
      color: 'bg-pink-500 hover:bg-pink-600',
    },
    {
      icon: '≡',
      title: 'Relatórios',
      description: 'Ver relatórios',
      path: '/reports',
      color: 'bg-indigo-500 hover:bg-indigo-600',
    },
  ];

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Ações Rápidas</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Acesso rápido às principais funcionalidades</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto flex flex-col items-center gap-2 p-3 sm:p-4 hover:shadow-md transition-all min-h-[100px] sm:min-h-[120px]"
              onClick={() => navigate(action.path)}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${action.color} flex items-center justify-center text-xl sm:text-2xl text-white shadow-lg flex-shrink-0`}>
                {action.icon}
              </div>
              <div className="text-center min-w-0 w-full">
                <div className="font-semibold text-xs sm:text-sm truncate">{action.title}</div>
                <div className="text-xs text-muted-foreground truncate hidden sm:block">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

