export interface PropertyInput {
  area_sqm: number;
  bedrooms: number;
  bathrooms: number;
  district: string;
  municipality: string;
  property_type: string;
  listing_type: string;
  year_built?: number;
  floor?: number;
  total_floors?: number;
  has_parking: boolean;
  has_sea_view: boolean;
  has_pool: boolean;
  has_garden: boolean;
  has_title_deed: boolean;
  latitude?: number;
  longitude?: number;
}

export interface ValuationResult {
  estimate: number;
  range_low: number;
  range_high: number;
  price_per_sqm: number;
  area_median_price_sqm: number;
  comparable_count: number;
  confidence: "low" | "medium" | "high";
  confidence_pct: number;
  factors_positive: string[];
  factors_negative: string[];
  warning: string | null;
  model_version: string;
}

export interface ComparableProperty {
  id: number;
  price: number;
  area_sqm: number;
  price_per_sqm: number;
  bedrooms: number | null;
  municipality: string;
  property_type: string;
  year_built: number | null;
  has_sea_view: boolean;
  has_parking: boolean;
  sale_date: string | null;
  similarity_score: number;
}

export interface MarketStats {
  district: string;
  period: string;
  median_price_sqm: number;
  avg_price_sqm: number;
  transaction_count: number;
  price_change_pct: number;
  breakdown_by_type: Record<string, { median_price_sqm: number; count: number; avg_price: number }>;
  municipalities: { name: string; median_price_sqm: number; count: number; avg_price: number }[];
  price_trend_12m: { month: string; median_price_sqm: number }[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function estimateProperty(input: PropertyInput): Promise<ValuationResult> {
  const res = await fetch(`${API_BASE}/api/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || "Valuation failed");
  }
  return res.json();
}

export async function getComparables(
  district: string,
  property_type: string,
  area_sqm: number,
  municipality?: string
): Promise<ComparableProperty[]> {
  const params = new URLSearchParams({
    district,
    property_type,
    area_sqm: String(area_sqm),
    ...(municipality ? { municipality } : {}),
  });
  const res = await fetch(`${API_BASE}/api/comparables?${params}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getMarketStats(district: string): Promise<MarketStats> {
  const res = await fetch(`${API_BASE}/api/market-stats/${district}`);
  if (!res.ok) throw new Error("Failed to fetch market stats");
  return res.json();
}

export function formatEuro(value: number): string {
  return "€" + value.toLocaleString("el-GR");
}

export function formatPct(value: number, showSign = true): string {
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
