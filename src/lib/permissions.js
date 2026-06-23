// Definição de roles
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  CAIXA: 'caixa',
  PDV: 'pdv',
};

// Definição de permissões por role
export const PERMISSIONS = {
  // Permissões do SUPERADMIN - Acesso total
  [ROLES.SUPERADMIN]: {
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
    canDeactivateUsers: true,
    canAccessSystemSettings: true,
  },

  // Permissões do ADMIN - Sem gestão de usuários e lotes
  [ROLES.ADMIN]: {
    canAccessDashboard: true,
    canManageUsers: false, // REMOVIDO
    canManageBarracas: true,
    canManageProducts: true,
    canManageStock: true,
    canViewAllSales: true,
    canViewAllTransactions: true,
    canViewReports: true,
    canGenerateBatch: false, // REMOVIDO
    canManageCards: true,
    canRechargeCards: true,
    canTransferBalance: true,
    canScanCards: true,
    canMakeSales: true,
    canDeactivateUsers: false,
    canAccessSystemSettings: false,
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

  // Permissões do PDV
  [ROLES.PDV]: {
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
  [ROLES.SUPERADMIN]: [
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

  [ROLES.PDV]: [
    '/',
    '/sale',
    '/historico', // Filtrado pela barraca
  ],
};

// Itens do menu por role
export const MENU_ITEMS = {
  [ROLES.SUPERADMIN]: [
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

  [ROLES.PDV]: [
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
    [ROLES.SUPERADMIN]: '/superadmin',
    [ROLES.ADMIN]: '/dashboard',
    [ROLES.CAIXA]: '/caixa/novo-cliente',
    [ROLES.PDV]: '/sale',
  };

  return routes[userRole] || '/';
}

// Valida se usuário pode acessar barraca específica
export function canAccessBarraca(userRole, userBarracaId, targetBarracaId) {
  // SuperAdmin e Admin podem acessar todas
  if (userRole === ROLES.SUPERADMIN || userRole === ROLES.ADMIN) return true;

  // PDV só pode acessar a sua própria barraca
  if (userRole === ROLES.PDV) {
    return userBarracaId === targetBarracaId;
  }

  // Caixa não acessa barracas
  return false;
}

// Obtém label amigável do role
export function getRoleLabel(role) {
  const labels = {
    [ROLES.SUPERADMIN]: 'Super Administrador',
    [ROLES.ADMIN]: 'Administrador',
    [ROLES.CAIXA]: 'Caixa',
    [ROLES.PDV]: 'Operador de PDV',
  };

  return labels[role] || role;
}

// Obtém cor do badge do role
export function getRoleBadgeColor(role) {
  const colors = {
    [ROLES.SUPERADMIN]: 'bg-purple-100 text-purple-800',
    [ROLES.ADMIN]: 'bg-red-100 text-red-800',
    [ROLES.CAIXA]: 'bg-blue-100 text-blue-800',
    [ROLES.PDV]: 'bg-green-100 text-green-800',
  };

  return colors[role] || 'bg-gray-100 text-gray-800';
}

// Verifica se é SuperAdmin
export function isSuperAdmin(userRole) {
  return userRole === ROLES.SUPERADMIN;
}

// Verifica se pode gerenciar usuários
export function canManageUsers(userRole) {
  return userRole === ROLES.SUPERADMIN;
}

// Verifica se pode gerar lotes
export function canGenerateBatches(userRole) {
  return userRole === ROLES.SUPERADMIN;
}

// Made with Bob
