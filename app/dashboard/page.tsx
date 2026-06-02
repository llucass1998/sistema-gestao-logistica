"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Dados simulados para o gráfico
const mockChartData = [
  { name: "Seg", entregas: 12 },
  { name: "Ter", entregas: 19 },
  { name: "Qua", entregas: 15 },
  { name: "Qui", entregas: 22 },
  { name: "Sex", entregas: 30 },
  { name: "Sáb", entregas: 28 },
  { name: "Dom", entregas: 10 },
];

export default function DashboardHomePage() {
  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* ========================================== */}
      {/* 1. CABEÇALHO PADRONIZADO EM CAIXA (NOVO)   */}
      {/* ========================================== */}
      <div className="bg-white dark:bg-gray-800 border border-[var(--color-border-secondary)] dark:border-gray-700 rounded-lg shadow-sm p-4 sm:p-6">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] dark:text-white">
          Visão Geral
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] dark:text-gray-400 mt-1">
          Resumo operacional da sua frota e entregas de hoje.
        </p>
      </div>

      {/* ========================================== */}
      {/* 2. CARDS DE MÉTRICAS                       */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Note que adicionei fundos escuros mais suaves para os ícones no dark mode (ex: dark:bg-blue-900/30) */}
        <MetricCard title="Entregas Hoje" value="24" icon="ti-box" color="text-[#185FA5] dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/30" />
        <MetricCard title="Motoristas Ativos" value="8" icon="ti-steering-wheel" color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-900/30" />
        <MetricCard title="Veículos em Rota" value="6" icon="ti-truck" color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-900/30" />
        <MetricCard title="Taxa de Conclusão" value="98%" icon="ti-check" color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-900/30" />
      </div>

      {/* ========================================== */}
      {/* 3. GRÁFICO DE LINHAS                       */}
      {/* ========================================== */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-[var(--color-border-secondary)] dark:border-gray-700 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] dark:text-white mb-6">
          Volume de Entregas (Últimos 7 dias)
        </h2>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              {/* Linhas de grade mais escuras no dark mode */}
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }} 
              />
              <Line type="monotone" dataKey="entregas" stroke="#185FA5" strokeWidth={3} dot={{ r: 4, fill: '#185FA5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#0C447C' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
}

// ==========================================
// COMPONENTE AUXILIAR PARA OS CARDS
// ==========================================
function MetricCard({ title, value, icon, color, bg }: { title: string, value: string, icon: string, color: string, bg: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-[var(--color-border-secondary)] dark:border-gray-700 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md cursor-default">
      <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center ${color}`}>
        <i className={`ti ${icon} text-2xl`}></i>
      </div>
      <div>
        <p className="text-[13px] text-[var(--color-text-secondary)] dark:text-gray-400 font-medium mb-0.5">{title}</p>
        <h3 className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-white">{value}</h3>
      </div>
    </div>
  );
}