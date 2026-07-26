const pihpsGridUrl =
  'https://www.bi.go.id/hargapangan/WebSite/TabelHarga/GetGridDataDaerah';

export interface PricePoint {
  date: string;
  price: number;
}

export interface PriceComparison {
  latest: PricePoint;
  previous: PricePoint;
  changePct: number;
}

function parsePrice(value: string): number | null {
  if (!value) return null;
  const number = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function toIsoDate(gridDateKey: string): string {
  const [day, month, year] = gridDateKey.split('/');
  return `${year}-${month}-${day}`;
}

export async function fetchTelurPrices(
  startDate: string,
  endDate: string
): Promise<PricePoint[]> {
  const params = new URLSearchParams({
    price_type_id: '1',
    comcat_id: 'com_10',
    province_id: '',
    regency_id: '',
    market_id: '',
    tipe_laporan: '1',
    start_date: startDate,
    end_date: endDate,
  });

  const response = await fetch(`${pihpsGridUrl}?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`PIHPS request gagal (HTTP ${response.status})`);
  }

  const body = (await response.json()) as { data?: Record<string, unknown>[] };
  const rows = body.data ?? [];

  const commodityRow =
    rows.find((row) => /ras segar/i.test(String(row.name ?? ''))) ??
    rows.find((row) => row.level === 2);

  if (!commodityRow) return [];

  const points: PricePoint[] = [];
  for (const [key, value] of Object.entries(commodityRow)) {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(key)) {
      const price = parsePrice(String(value));
      if (price !== null) {
        points.push({ date: toIsoDate(key), price });
      }
    }
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

export async function getWeeklyTelurChange(): Promise<PriceComparison | null> {
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const startDate = new Date(now.getTime() - 20 * 86400000)
    .toISOString()
    .slice(0, 10);

  const points = await fetchTelurPrices(startDate, endDate);
  if (points.length < 2) return null;

  const latest = points[points.length - 1];
  const targetTime = new Date(latest.date).getTime() - 7 * 86400000;

  let previous = points[0];
  let smallestGap = Infinity;
  for (const point of points) {
    if (point.date === latest.date) continue;
    const gap = Math.abs(new Date(point.date).getTime() - targetTime);
    if (gap < smallestGap) {
      smallestGap = gap;
      previous = point;
    }
  }

  const changePct = ((latest.price - previous.price) / previous.price) * 100;
  return { latest, previous, changePct };
}
