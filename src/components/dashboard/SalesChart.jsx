import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function SalesChart({ data, type = 'line', title, description }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 sm:p-3 border border-gray-200 rounded-lg shadow-lg max-w-[200px]">
          <p className="font-semibold text-xs sm:text-sm mb-1 truncate">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs sm:text-sm truncate" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          {payload[0]?.payload?.count && (
            <p className="text-xs text-gray-500 mt-1">
              {payload[0].payload.count} vendas
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (type === 'bar') {
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10 }}
            stroke="#888"
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke="#888"
            tickFormatter={formatCurrency}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="total" 
            fill="#8b5cf6" 
            name="Total Vendido"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      );
    }

    return (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 10 }}
          stroke="#888"
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10 }}
          stroke="#888"
          tickFormatter={formatCurrency}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke="#8b5cf6" 
          strokeWidth={2}
          name="Total Vendido"
          dot={{ fill: '#8b5cf6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    );
  };

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">{title || 'Vendas por Hora'}</CardTitle>
        {description && (
          <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-[250px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

