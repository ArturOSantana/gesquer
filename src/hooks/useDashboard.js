import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Cache simples para dados do dashboard
const dashboardCache = {
  data: null,
  timestamp: null,
  ttl: 30000, // 30 segundos
};

export function useDashboard() {
  const [statistics, setStatistics] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [barracaRanking, setBarracaRanking] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para buscar estatísticas gerais
  const getStatistics = useCallback(async () => {
    try {
      // Total arrecadado (soma de todas as transações de venda)
      const { data: salesData, error: salesError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'sale');

      if (salesError) throw salesError;

      const totalArrecadado = salesData.reduce((sum, t) => sum + t.amount, 0);

      // Saldo em circulação (soma de todos os saldos dos cartões)
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('balance')
        .eq('status', 'active');

      if (cardsError) throw cardsError;

      const saldoCirculacao = cardsData.reduce((sum, c) => sum + c.balance, 0);

      // Total de clientes (cartões únicos)
      const { count: totalClientes, error: clientsError } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true });

      if (clientsError) throw clientsError;

      // Vendas hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const { data: vendasHoje, error: vendasError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'sale')
        .gte('created_at', hoje.toISOString());

      if (vendasError) throw vendasError;

      const totalVendasHoje = vendasHoje.reduce((sum, t) => sum + t.amount, 0);

      // Barracas ativas
      const { count: barracasAtivas, error: barracasError } = await supabase
        .from('barracas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (barracasError) throw barracasError;

      // Produtos com estoque baixo
      const { data: produtosBaixo, error: produtosError } = await supabase
        .from('products')
        .select('*')
        .lte('stock_quantity', 10)
        .eq('status', 'active');

      if (produtosError) throw produtosError;

      return {
        totalArrecadado,
        saldoCirculacao,
        totalClientes,
        totalVendasHoje,
        barracasAtivas,
        produtosEstoqueBaixo: produtosBaixo.length,
      };
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      throw err;
    }
  }, []);

  // Função para buscar dados do gráfico de vendas por hora
  const getSalesChart = useCallback(async () => {
    try {
      const ultimas24h = new Date();
      ultimas24h.setHours(ultimas24h.getHours() - 24);

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('type', 'sale')
        .gte('created_at', ultimas24h.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar por hora
      const salesByHour = {};
      data.forEach((transaction) => {
        const hour = new Date(transaction.created_at).getHours();
        if (!salesByHour[hour]) {
          salesByHour[hour] = { hour, total: 0, count: 0 };
        }
        salesByHour[hour].total += transaction.amount;
        salesByHour[hour].count += 1;
      });

      // Converter para array e preencher horas vazias
      const chartData = [];
      for (let i = 0; i < 24; i++) {
        chartData.push({
          hour: `${i}h`,
          total: salesByHour[i]?.total || 0,
          count: salesByHour[i]?.count || 0,
        });
      }

      return chartData;
    } catch (err) {
      console.error('Erro ao buscar gráfico de vendas:', err);
      throw err;
    }
  }, []);

  // Função para buscar ranking de barracas
  const getBarracaRanking = useCallback(async () => {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          amount,
          barraca_id,
          barracas (name)
        `)
        .eq('type', 'sale');

      if (error) throw error;

      // Agrupar por barraca
      const rankingMap = {};
      transactions.forEach((t) => {
        const barracaId = t.barraca_id;
        if (!rankingMap[barracaId]) {
          rankingMap[barracaId] = {
            id: barracaId,
            name: t.barracas?.name || 'Desconhecida',
            total: 0,
            count: 0,
          };
        }
        rankingMap[barracaId].total += t.amount;
        rankingMap[barracaId].count += 1;
      });

      // Converter para array e ordenar
      const ranking = Object.values(rankingMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // Top 5

      return ranking;
    } catch (err) {
      console.error('Erro ao buscar ranking de barracas:', err);
      throw err;
    }
  }, []);

  // Função para buscar transações recentes
  const getRecentTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          cards (id, client:clients(name)),
          barracas (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Erro ao buscar transações recentes:', err);
      throw err;
    }
  }, []);

  // Função para buscar alertas
  const getAlerts = useCallback(async () => {
    try {
      const alertsList = [];

      // Produtos com estoque baixo
      const { data: produtosBaixo, error: produtosError } = await supabase
        .from('products')
        .select('*, barracas(name)')
        .lte('stock_quantity', 10)
        .eq('status', 'active');

      if (produtosError) throw produtosError;

      produtosBaixo.forEach((produto) => {
        alertsList.push({
          type: 'warning',
          title: 'Estoque Baixo',
          message: `${produto.name} (${produto.barracas?.name}) - ${produto.stock_quantity} unidades`,
          timestamp: new Date(),
        });
      });

      // Cartões bloqueados
      const { data: cartoesBloqueados, error: cartoesError } = await supabase
        .from('cards')
        .select('id, client:clients(name)')
        .eq('status', 'blocked');

      if (cartoesError) throw cartoesError;

      cartoesBloqueados.forEach((cartao) => {
        alertsList.push({
          type: 'error',
          title: 'Cartão Bloqueado',
          message: `${cartao.client?.name || 'Cliente desconhecido'} - ID: ${cartao.id.substring(0, 8)}...`,
          timestamp: new Date(),
        });
      });

      // Ordenar por timestamp
      alertsList.sort((a, b) => b.timestamp - a.timestamp);

      return alertsList.slice(0, 10); // Últimos 10 alertas
    } catch (err) {
      console.error('Erro ao buscar alertas:', err);
      throw err;
    }
  }, []);

  // Função para carregar todos os dados
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar cache
      const now = Date.now();
      if (
        dashboardCache.data &&
        dashboardCache.timestamp &&
        now - dashboardCache.timestamp < dashboardCache.ttl
      ) {
        // Usar dados do cache
        setStatistics(dashboardCache.data.statistics);
        setSalesChart(dashboardCache.data.salesChart);
        setBarracaRanking(dashboardCache.data.barracaRanking);
        setRecentTransactions(dashboardCache.data.recentTransactions);
        setAlerts(dashboardCache.data.alerts);
        setLoading(false);
        return;
      }

      // Buscar dados em paralelo
      const [stats, chart, ranking, transactions, alertsData] = await Promise.all([
        getStatistics(),
        getSalesChart(),
        getBarracaRanking(),
        getRecentTransactions(),
        getAlerts(),
      ]);

      // Atualizar estados
      setStatistics(stats);
      setSalesChart(chart);
      setBarracaRanking(ranking);
      setRecentTransactions(transactions);
      setAlerts(alertsData);

      // Atualizar cache
      dashboardCache.data = {
        statistics: stats,
        salesChart: chart,
        barracaRanking: ranking,
        recentTransactions: transactions,
        alerts: alertsData,
      };
      dashboardCache.timestamp = now;

      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [getStatistics, getSalesChart, getBarracaRanking, getRecentTransactions, getAlerts]);

  // Função para forçar atualização (limpar cache)
  const refresh = useCallback(() => {
    dashboardCache.data = null;
    dashboardCache.timestamp = null;
    loadDashboardData();
  }, [loadDashboardData]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    statistics,
    salesChart,
    barracaRanking,
    recentTransactions,
    alerts,
    loading,
    error,
    refresh,
  };
}

// Made with Bob
