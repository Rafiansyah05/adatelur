'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Wallet, Package, ClipboardCheck, Star, Trophy } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

const CHART_PRIMARY = '#FACC15';
const CHART_PRIMARY_FILL = '#FFDE6B';
const CHART_SUCCESS = '#00AA5B';
const CHART_GRID = '#E4E7EB';
const CHART_AXIS = '#9DA3AF';

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #E4E7EB',
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
};

interface TrendPoint {
  label: string;
  revenue: number;
  rakSold: number;
}

interface RatingPoint {
  label: string;
  averageRating: number | null;
}

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalRakSold: number;
    stockRak: number;
    completedOrders: number;
    todayRevenue: number;
    todayRakSold: number;
    todayCompletedOrders: number;
    averageRating: number;
    deliveryAccuracy: number;
    finalScore: number;
  };
  daily: TrendPoint[];
  weekly: TrendPoint[];
  monthly: TrendPoint[];
  ratingTrend: RatingPoint[];
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}jt`;
  }
  if (value >= 1000) {
    return `${Math.round(value / 1000)}rb`;
  }
  return `${value}`;
}

function SummaryTile({
  icon,
  label,
  value,
  description,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description?: string;
  className?: string;
}) {
  return (
    <Card className={cn("p-5 hover:-translate-y-1 hover:shadow-md transition-all duration-300 border-neutral-100 bg-white flex flex-col justify-between", className)}>
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            {icon}
          </span>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{label}</p>
        </div>
        <p className="text-2xl font-black text-neutral-800 tracking-tight">{value}</p>
      </div>
      {description && (
        <p className="text-[10px] text-neutral-400 mt-2 font-medium leading-tight">{description}</p>
      )}
    </Card>
  );
}

export function AnalyticsSection() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  
  // timeframe filter: semua vs hariIni
  const [timeframe, setTimeframe] = React.useState<'semua' | 'hariIni'>('semua');
  
  // chart filter: hari vs minggu vs bulan
  const [chartFilter, setChartFilter] = React.useState<'hari' | 'minggu' | 'bulan'>('minggu');

  React.useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      try {
        const response = await fetch('/api/peternak/analytics');
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Gagal memuat analitik');
        }
        if (active) {
          setData(result);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Terjadi kesalahan');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadAnalytics();
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full animate-pulse">
        <div className="mb-6 flex justify-between items-center">
          <div className="h-8 w-48 bg-neutral-100 rounded" />
          <div className="h-10 w-32 bg-neutral-100 rounded-full" />
        </div>
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-28 rounded-lg bg-neutral-100" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-lg bg-neutral-100" />
          <div className="h-72 rounded-lg bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-100 bg-red-50 text-red-700">
        <p className="text-body font-semibold">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const iconClass = 'h-4 w-4 text-primary-700';

  return (
    <div className="w-full">
      {/* Timeframe selector header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-800">Ringkasan Statistik</h2>
          <p className="text-xs text-neutral-500">Pantau performa penjualan telur Anda secara langsung</p>
        </div>
        <div className="bg-neutral-100 p-1 rounded-full flex gap-1 border border-neutral-200 self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setTimeframe('semua')}
            className={cn(
              "px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-300",
              timeframe === 'semua'
                ? "bg-white text-primary-800 shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            )}
          >
            Semua
          </button>
          <button
            onClick={() => setTimeframe('hariIni')}
            className={cn(
              "px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-300",
              timeframe === 'hariIni'
                ? "bg-white text-primary-800 shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            )}
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* Summary grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <SummaryTile
          icon={<Wallet className={iconClass} />}
          label="Total Pendapatan"
          value={
            timeframe === 'semua'
              ? formatRupiah(data.summary.totalRevenue)
              : formatRupiah(data.summary.todayRevenue)
          }
          description="Sudah dipotong biaya admin 3,5% per transaksi"
        />
        <SummaryTile
          icon={<Package className={iconClass} />}
          label="Rak Terjual"
          value={
            timeframe === 'semua'
              ? `${data.summary.totalRakSold}`
              : `${data.summary.todayRakSold}/${data.summary.stockRak}`
          }
        />
        <SummaryTile
          icon={<ClipboardCheck className={iconClass} />}
          label="Pesanan Selesai"
          value={
            timeframe === 'semua'
              ? `${data.summary.completedOrders}`
              : `${data.summary.todayCompletedOrders}`
          }
        />
        <SummaryTile
          icon={<Star className={iconClass} />}
          label="Rata-rata Rating"
          value={
            data.summary.completedOrders === 0 && data.summary.averageRating === 0
              ? 'Baru'
              : data.summary.averageRating.toFixed(1)
          }
        />
        <SummaryTile
          icon={<Trophy className={iconClass} />}
          label="Score Sistem"
          value={data.summary.finalScore > 0 ? `${data.summary.finalScore} pts` : 'Baru!'}
        />
      </div>

      {/* Charts section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 border-neutral-100 bg-white shadow-xs">
          {/* Revenue Chart header with dynamic filter */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">
              {chartFilter === 'hari'
                ? 'Pendapatan per Hari'
                : chartFilter === 'minggu'
                ? 'Pendapatan per Minggu'
                : 'Pendapatan per Bulan'}
            </h3>
            <div className="bg-neutral-100 p-0.5 rounded-lg flex gap-0.5 border border-neutral-200">
              <button
                onClick={() => setChartFilter('hari')}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-bold transition-all duration-300",
                  chartFilter === 'hari'
                    ? "bg-white text-primary-800 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                Hari
              </button>
              <button
                onClick={() => setChartFilter('minggu')}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-bold transition-all duration-300",
                  chartFilter === 'minggu'
                    ? "bg-white text-primary-800 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                Minggu
              </button>
              <button
                onClick={() => setChartFilter('bulan')}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-bold transition-all duration-300",
                  chartFilter === 'bulan'
                    ? "bg-white text-primary-800 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                Bulan
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={
                chartFilter === 'hari'
                  ? data.daily
                  : chartFilter === 'minggu'
                  ? data.weekly
                  : data.monthly
              }
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
              <XAxis
                dataKey="label"
                stroke={CHART_AXIS}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={CHART_AXIS}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompact}
                width={44}
              />
              <Tooltip
                formatter={(value) => formatRupiah(Number(value))}
                contentStyle={TOOLTIP_STYLE}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Pendapatan"
                stroke={CHART_PRIMARY}
                fill={CHART_PRIMARY_FILL}
                fillOpacity={0.25}
                strokeWidth={2}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Rating trend chart */}
        <Card className="p-6 border-neutral-100 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Tren Rating</h3>
            {data.summary.averageRating > 0 && (
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 border border-neutral-200 rounded-full px-3 py-1">
                Rata-rata: ⭐ {data.summary.averageRating.toFixed(1)}
              </span>
            )}
          </div>
          {data.ratingTrend.every((p) => p.averageRating === null) ? (
            <div className="flex h-[260px] items-center justify-center">
              <p className="text-sm text-neutral-400 text-center font-medium">
                Belum ada rating dari pelanggan.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.ratingTrend} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={CHART_AXIS}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={CHART_AXIS}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  width={28}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: any) =>
                    value !== null ? [`⭐ ${Number(value).toFixed(1)}`, 'Rating'] : ['Tidak ada rating', '']
                  }
                />
                {/* Reference line for overall average */}
                {data.summary.averageRating > 0 && (
                  <ReferenceLine
                    y={data.summary.averageRating}
                    stroke={CHART_SUCCESS}
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="averageRating"
                  name="Rating"
                  stroke={CHART_SUCCESS}
                  strokeWidth={2.5}
                  dot={({ cx, cy, value }: any) =>
                    value !== null ? (
                      <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill={CHART_SUCCESS} stroke="#fff" strokeWidth={2} />
                    ) : <g key={`empty-${cx}-${cy}`} />
                  }
                  activeDot={{ r: 7, stroke: CHART_SUCCESS, strokeWidth: 2, fill: '#fff' }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
