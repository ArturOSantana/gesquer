/**
 * Utilitário para exportação de dados em formato CSV
 * Com suporte a UTF-8 BOM para compatibilidade com Excel
 */

/**
 * Formata valor monetário para o padrão brasileiro
 * @param {number} value - Valor numérico
 * @returns {string} Valor formatado (ex: "R$ 50,00")
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata data para o padrão brasileiro
 * @param {string|Date} date - Data a ser formatada
 * @param {boolean} includeTime - Se deve incluir hora (padrão: true)
 * @returns {string} Data formatada (ex: "20/06/2024 10:30:45")
 */
export function formatDate(date, includeTime = true) {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'N/A';
  
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
  }
  
  return dateObj.toLocaleString('pt-BR', options);
}

/**
 * Formata valor para exibição, tratando null/undefined
 * @param {any} value - Valor a ser formatado
 * @returns {string} Valor formatado ou 'N/A'
 */
function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  return String(value);
}

/**
 * Escapa valor para CSV (adiciona aspas e escapa aspas internas)
 * @param {any} value - Valor a ser escapado
 * @returns {string} Valor escapado e entre aspas
 */
function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return '""';
  }
  
  // Converte para string
  let stringValue = String(value);
  
  // Se contém vírgula, aspas, quebra de linha ou ponto e vírgula, precisa ser escapado
  if (stringValue.includes(',') || stringValue.includes('"') ||
      stringValue.includes('\n') || stringValue.includes('\r') ||
      stringValue.includes(';')) {
    // Duplica aspas internas
    stringValue = stringValue.replace(/"/g, '""');
    // Envolve em aspas
    return `"${stringValue}"`;
  }
  
  // Sempre envolve em aspas para consistência
  return `"${stringValue}"`;
}

/**
 * Converte array de objetos para formato CSV
 * @param {Array<Object>} data - Array de objetos com os dados
 * @param {Array<{key: string, label: string, format?: Function}>} columns - Configuração das colunas
 * @returns {string} Conteúdo CSV
 */
export function convertToCSV(data, columns) {
  if (!data || data.length === 0) {
    return '';
  }
  
  // Cria linha de cabeçalho
  const headers = columns.map(col => escapeCSVValue(col.label));
  const headerLine = headers.join(',');
  
  // Cria linhas de dados
  const dataLines = data.map(row => {
    const values = columns.map(col => {
      let value = row[col.key];
      
      // Aplica formatação customizada se fornecida
      if (col.format && typeof col.format === 'function') {
        value = col.format(value, row);
      }
      
      return escapeCSVValue(value);
    });
    
    return values.join(',');
  });
  
  // Combina cabeçalho e dados
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Faz download de conteúdo CSV
 * @param {string} csvContent - Conteúdo CSV
 * @param {string} filename - Nome do arquivo (sem extensão)
 */
export function downloadCSV(csvContent, filename) {
  // Adiciona BOM UTF-8 para compatibilidade com Excel
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;
  
  // Cria blob com encoding UTF-8
  const blob = new Blob([csvWithBOM], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Cria link temporário e dispara download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Libera memória
  URL.revokeObjectURL(url);
}

/**
 * Gera nome de arquivo com timestamp
 * @param {string} prefix - Prefixo do nome do arquivo
 * @returns {string} Nome do arquivo com timestamp
 */
export function generateFilename(prefix) {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  
  return `${prefix}_${timestamp}`;
}

/**
 * Exporta transações para CSV
 * @param {Array<Object>} transactions - Array de transações
 * @param {string} filename - Nome do arquivo (opcional)
 */
export function exportTransactionsCSV(transactions, filename) {
  const columns = [
    {
      key: 'id',
      label: 'ID',
      format: (value) => formatValue(value)
    },
    {
      key: 'created_at',
      label: 'Data/Hora',
      format: (value) => formatDate(value, true)
    },
    {
      key: 'type',
      label: 'Tipo',
      format: (value) => {
        const types = {
          'sale': 'Venda',
          'purchase': 'Compra',
          'recharge': 'Recarga',
          'refund': 'Estorno',
          'transfer': 'Transferência',
          'transfer_in': 'Transferência (Entrada)',
          'transfer_out': 'Transferência (Saída)'
        };
        return formatValue(types[value] || value);
      }
    },
    {
      key: 'amount',
      label: 'Valor',
      format: (value) => formatCurrency(value)
    },
    {
      key: 'barraca',
      label: 'Barraca',
      format: (value) => formatValue(value?.name)
    },
    {
      key: 'card',
      label: 'Cliente',
      format: (value) => formatValue(value?.client?.name)
    },
    {
      key: 'card',
      label: 'Telefone Cliente',
      format: (value) => formatValue(value?.client?.phone)
    },
    {
      key: 'card',
      label: 'UUID Cartão',
      format: (value) => value?.uuid ? value.uuid.substring(0, 8) : 'N/A'
    },
    {
      key: 'user',
      label: 'Operador',
      format: (value) => formatValue(value?.name)
    }
  ];
  
  const csvContent = convertToCSV(transactions, columns);
  const finalFilename = filename || generateFilename('relatorio_transacoes');
  
  downloadCSV(csvContent, finalFilename);
}

/**
 * Exporta resumo de vendas por barraca para CSV
 * @param {Array<Object>} summary - Array com resumo por barraca
 * @param {string} filename - Nome do arquivo (opcional)
 */
export function exportSalesSummaryCSV(summary, filename) {
  const columns = [
    { key: 'barraca', label: 'Barraca' },
    { key: 'totalVendas', label: 'Total de Vendas' },
    { 
      key: 'valorTotal', 
      label: 'Valor Total',
      format: (value) => formatCurrency(value)
    },
    { 
      key: 'ticketMedio', 
      label: 'Ticket Médio',
      format: (value) => formatCurrency(value)
    }
  ];
  
  const csvContent = convertToCSV(summary, columns);
  const finalFilename = filename || generateFilename('resumo_vendas');
  
  downloadCSV(csvContent, finalFilename);
}

/**
 * Exporta clientes para CSV
 * @param {Array<Object>} clients - Array de clientes
 * @param {string} filename - Nome do arquivo (opcional)
 */
export function exportClientsCSV(clients, filename) {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'phone', label: 'Telefone' },
    { 
      key: 'balance', 
      label: 'Saldo',
      format: (value) => formatCurrency(value)
    },
    { 
      key: 'created_at', 
      label: 'Data Cadastro',
      format: (value) => formatDate(value, false)
    }
  ];
  
  const csvContent = convertToCSV(clients, columns);
  const finalFilename = filename || generateFilename('clientes');
  
  downloadCSV(csvContent, finalFilename);
}

/**
 * Exporta produtos para CSV
 * @param {Array<Object>} products - Array de produtos
 * @param {string} filename - Nome do arquivo (opcional)
 */
export function exportProductsCSV(products, filename) {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { 
      key: 'price', 
      label: 'Preço',
      format: (value) => formatCurrency(value)
    },
    { key: 'stock', label: 'Estoque' },
    { 
      key: 'barracas', 
      label: 'Barraca',
      format: (value) => value?.name || 'N/A'
    },
    { 
      key: 'active', 
      label: 'Status',
      format: (value) => value ? 'Ativo' : 'Inativo'
    }
  ];
  
  const csvContent = convertToCSV(products, columns);
  const finalFilename = filename || generateFilename('produtos');
  
  downloadCSV(csvContent, finalFilename);
}

// Made with Bob
