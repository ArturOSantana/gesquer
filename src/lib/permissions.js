// Definição de roles
export const ROLES = {
  ADMIN: 'admin',
  CAIXA: 'caixa',
  BARRACA: 'barraca',
};

// Definição de permissões por role
export const PERMISSIONS = {
  // Permissões do ADMIN
  [ROLES.ADMIN]: {
    canAccessDashboard: true,
    canManageUsers: true,
    canManageBarracas: true,
    canManageProducts: true,
    canManageStock: true,
    canViewAllSales: true,
    canViewAllTransactions: true,
    canViewReports: true,
    canGenerateBatch: true,
    canManageCards: true,
    canRechargeCards: true,
    canTransferBalance: true,
    canScanCards: true,
    canMakeSales: true,
  },

  // Permissões do CAIXA
  [ROLES.CAIXA]: {
    canAccessDashboard: true,
    canManageUsers: false,
    canManageBarracas: false,
    canManageProducts: false,
    canManageStock: false,
    canViewAllSales: true,
    canViewAllTransactions: true,
    canViewReports: false,
    canGenerateBatch: false,
    canManageCards: true,
    canRechargeCards: true,
    canTransferBalance: true,
    canScanCards: true,
    canMakeSales: false,
  },

  // Permissões da BARRACA
  [ROLES.BARRACA]: {
    canAccessDashboard: false,
    canManageUsers: false,
    canManageBarracas: false,
    canManageProducts: false,
    canManageStock: false,
    canViewAllSales: false, // Só vê vendas da sua barraca
    canViewAllTransactions: false, // Só vê transações da sua barraca
    canViewReports: false,
    canGenerateBatch: false,
    canManageCards: false,
    canRechargeCards: false,
    canTransferBalance: false,
    canScanCards: false,
    canMakeSales: true, // Só na sua barraca
  },
};

// Rotas permitidas por role
export const ALLOWED_ROUTES = {
  [ROLES.ADMIN]: [
    '/',
    '/dashboard',
    '/scan',
    '/sale',
    '/cards',
    '/historico',
    '/barracas',
    '/estoque',
    '/relatorios',
    '/admin/usuarios',
    '/admin/gerar-lote',
    '/caixa/novo-cliente',
    '/caixa/recarga',
    '/caixa/transferir-cartao',
    '/transferir-saldo',
  ],

  [ROLES.CAIXA]: [
    '/',
    '/dashboard',
    '/scan',
    '/cards',
    '/historico',
    '/caixa/novo-cliente',
    '/caixa/recarga',
    '/caixa/transferir-cartao',
    '/transferir-saldo',
  ],

  [ROLES.BARRACA]: [
    '/',
    '/sale',
    '/historico', // Filtrado pela barraca
  ],
};

// Itens do menu por role
export const MENU_ITEMS = {
  [ROLES.ADMIN]: [
    { path: '/', label: 'Home', icon: 'Home' },
    { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/scan', label: 'Escanear', icon: 'QrCode' },
    { path: '/sale', label: 'Venda', icon: 'ShoppingCart' },
    { path: '/cards', label: 'Cartões', icon: 'CreditCard' },
    { path: '/historico', label: 'Histórico', icon: 'History' },
    { path: '/barracas', label: 'Barracas', icon: 'Store' },
    { path: '/estoque', label: 'Estoque', icon: 'Package' },
    { path: '/relatorios', label: 'Relatórios', icon: 'FileText' },
    { path: '/admin/usuarios', label: 'Usuários', icon: 'Users' },
    { path: '/admin/gerar-lote', label: 'Gerar Lote', icon: 'Layers' },
  ],

  [ROLES.CAIXA]: [
    { path: '/', label: 'Home', icon: 'Home' },
    { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/scan', label: 'Escanear', icon: 'QrCode' },
    { path: '/caixa/novo-cliente', label: 'Novo Cliente', icon: 'UserPlus' },
    { path: '/caixa/recarga', label: 'Recarga', icon: 'Wallet' },
    { path: '/caixa/transferir-cartao', label: 'Transferir Cartão', icon: 'ArrowLeftRight' },
    { path: '/cards', label: 'Cartões', icon: 'CreditCard' },
    { path: '/historico', label: 'Histórico', icon: 'History' },
  ],

  [ROLES.BARRACA]: [
    { path: '/', label: 'Home', icon: 'Home' },
    { path: '/sale', label: 'Venda', icon: 'ShoppingCart' },
    { path: '/historico', label: 'Histórico', icon: 'History' },
  ],
};

// Verifica se usuário tem permissão
export function hasPermission(userRole, permission) {
  if (!userRole || !permission) return false;
  
  const rolePermissions = PERMISSIONS[userRole];
  if (!rolePermissions) return false;

  return rolePermissions[permission] === true;
}

// Verifica se usuário pode acessar rota
export function canAccessRoute(userRole, route) {
  if (!userRole || !route) return false;

  const allowedRoutes = ALLOWED_ROUTES[userRole];
  if (!allowedRoutes) return false;

  // Verifica rota exata
  if (allowedRoutes.includes(route)) return true;

  // Verifica se é uma subrota permitida
  return allowedRoutes.some(allowedRoute => 
    route.startsWith(allowedRoute + '/')
  );
}

// Obtém itens do menu para o role
export function getMenuItems(userRole) {
  if (!userRole) return [];
  return MENU_ITEMS[userRole] || [];
}

// Obtém rota inicial baseada no role
export function getInitialRoute(userRole) {
  const routes = {
    [ROLES.ADMIN]: '/dashboard',
    [ROLES.CAIXA]: '/caixa/novo-cliente',
    [ROLES.BARRACA]: '/sale',
  };

  return routes[userRole] || '/';
}

// Valida se usuário pode acessar barraca específica
export function canAccessBarraca(userRole, userBarracaId, targetBarracaId) {
  // Admin pode acessar todas
  if (userRole === ROLES.ADMIN) return true;

  // Barraca só pode acessar a sua própria
  if (userRole === ROLES.BARRACA) {
    return userBarracaId === targetBarracaId;
  }

  // Caixa não acessa barracas
  return false;
}

// Obtém label amigável do role
export function getRoleLabel(role) {
  const labels = {
    [ROLES.ADMIN]: 'Administrador',
    [ROLES.CAIXA]: 'Caixa',
    [ROLES.BARRACA]: 'Operador de Barraca',
  };

  return labels[role] || role;
}

// Obtém cor do badge do role
export function getRoleBadgeColor(role) {
  const colors = {
    [ROLES.ADMIN]: 'bg-red-100 text-red-800',
    [ROLES.CAIXA]: 'bg-blue-100 text-blue-800',
    [ROLES.BARRACA]: 'bg-green-100 text-green-800',
  };

  return colors[role] || 'bg-gray-100 text-gray-800';
}

// Made with Bob
