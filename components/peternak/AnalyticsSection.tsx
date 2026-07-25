'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
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
} from 'recharts';

const CHART_PRIMARY = '#FACC15';
const CHART_PRIMARY_FILL = '#FFDE6B';
const CHART_SUCCESS = '#00AA5B';
const CHART_GRID = '#E4E7EB';
const CHART_AXIS = '#9DA3AF';

interface WeeklyPoint {
  label: string;
  revenue: number;
  rakSold: number;
}

interface RatingPoint {
  label: string;
  averageRating: number;
}

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalRakSold: number;
    completedOrders: number;
    averageRating: number;
    deliveryAccuracy: number;
  };
  weekly: WeeklyPoint[];
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

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5 flex flex-col justify-center">
      <p className="text-caption text-text-desc mb-1">{label}</p>
      <p className="text-h2 text-text-main">{value}</p>
    </Card>
  );
}

export function AnalyticsSection() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');

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
      <Card className="p-6">
        <p className="text-body text-text-desc">Memuat analitik...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-body text-danger-text">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const hasSales = data.summary.completedOrders > 0;

  return (
    <div className="w-full">
      <h2 className="text-h2 text-text-main mb-4">Analitik Penjualan</h2>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 mb-6">
        <SummaryTile label="Total Pendapatan" value={formatRupiah(data.summary.totalRevenue)} />
        <SummaryTile label="Rak Terjual" value={`${data.summary.totalRakSold}`} />
        <SummaryTile label="Pesanan Selesai" value={`${data.summary.completedOrders}`} />
        <SummaryTile label="Rata-rata Rating" value={`${data.summary.averageRating}`} />
        <SummaryTile
          label="Keberhasilan Kirim"
          value={`${Math.round(data.summary.deliveryAccuracy)}%`}
        />
      </div>

      {hasSales ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-h3 text-text-main mb-4">Pendapatan per Minggu</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.weekly} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="label" stroke={CHART_AXIS} fontSize={12} tickLine={false} />
                <YAxis
                  stroke={CHART_AXIS}
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={formatCompact}
                  width={44}
                />
                <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Pendapatan"
                  stroke={CHART_PRIMARY}
                  fill={CHART_PRIMARY_FILL}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-h3 text-text-main mb-4">Tren Rating</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.ratingTrend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="label" stroke={CHART_AXIS} fontSize={12} tickLine={false} />
                <YAxis
                  stroke={CHART_AXIS}
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 5]}
                  width={28}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="averageRating"
                  name="Rating"
                  stroke={CHART_SUCCESS}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ) : (
        <Card className="p-6">
          <p className="text-body text-text-desc">
            Belum ada data penjualan. Grafik akan muncul setelah ada pesanan yang selesai.
          </p>
        </Card>
      )}
    </div>
  );
}
