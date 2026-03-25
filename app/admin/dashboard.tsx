import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API = "http://127.0.0.1:3000/api";
const { width } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────────
interface ChartItem {
  label: string;
  total: number;
}

interface Stats {
  ingresos: number;
  ventas: number;
  productos: number;
  ticket: number;
}

interface UserInfo {
  name: string;
  role: string;
}

interface StatCardProps {
  emoji: string;
  value: string | number;
  label: string;
  color: string;
  loading: boolean;
}

interface MiniBarChartProps {
  data: ChartItem[];
  loading: boolean;
  period: string;
}

// ── Helpers ──────────────────────────────────────────────────
function fmt(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n ?? 0);
}

const PERIODS = ["Hoy", "Semana", "Mes"];

// Build placeholder labels when API doesn't return chart data
function buildEmptyPoints(p: string): ChartItem[] {
  if (p === "Hoy")
    return ["6am","8am","10am","12pm","2pm","4pm","6pm","8pm"].map((l) => ({ label: l, total: 0 }));
  if (p === "Semana")
    return ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((l) => ({ label: l, total: 0 }));
  return ["Sem 1","Sem 2","Sem 3","Sem 4"].map((l) => ({ label: l, total: 0 }));
}

// ── Bar chart ─────────────────────────────────────────────────
function MiniBarChart({ data, loading, period }: MiniBarChartProps) {
  if (loading) {
    return (
      <View style={styles.chartLoading}>
        <ActivityIndicator color={PINK} size="large" />
        <Text style={styles.chartLoadingText}>Cargando {period}…</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={{ fontSize: 36 }}>📭</Text>
        <Text style={styles.chartEmptyText}>Sin ventas en {period}</Text>
      </View>
    );
  }

  const max    = Math.max(...data.map((d) => d.total));
  const BAR_H  = 130;
  const total  = data.reduce((a, b) => a + b.total, 0);
  const suffix = period === "Hoy" ? "horas" : period === "Semana" ? "días" : "semanas";

  return (
    <View style={styles.chartContainer}>
      {/* Y-axis */}
      <View style={styles.chartYAxis}>
        <Text style={styles.chartYLabel}>{max > 0 ? fmt(max) : "$0.00"}</Text>
        <View style={styles.chartDashedLine} />
      </View>

      {/* Bars */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.barsRow}>
          {data.map((item, i) => {
            const barH   = max > 0 ? (item.total / max) * BAR_H : 4;
            const isMax  = item.total === max && max > 0;
            return (
              <View key={i} style={styles.barWrapper}>
                {item.total > 0 && (
                  <Text style={styles.barValue}>{fmt(item.total)}</Text>
                )}
                <View
                  style={[
                    styles.bar,
                    { height: Math.max(barH, 4) },
                    isMax && styles.barHighlight,
                  ]}
                />
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Summary row */}
      <View style={styles.chartSummary}>
        <Text style={styles.chartSummaryText}>Total: {fmt(total)}</Text>
        <Text style={styles.chartSummaryText}>{data.length} {suffix}</Text>
      </View>
    </View>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ emoji, value, label, color, loading }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [period, setPeriod] = useState<string>("Semana");

  // cache per period so switching tabs is instant
  const [statsMap, setStatsMap]           = useState<Record<string, Stats>>({});
  const [chartMap, setChartMap]           = useState<Record<string, ChartItem[]>>({});
  const [loadingStats, setLoadingStats]   = useState<boolean>(true);
  const [loadingChart, setLoadingChart]   = useState<boolean>(true);
  const [error, setError]                 = useState<string | null>(null);
  const [user, setUser]                   = useState<UserInfo>({ name: "Usuario", role: "Administrador" });

  // derived from cache
  const stats     = statsMap[period] ?? null;
  const chartData = chartMap[period] ?? [];

  // ── fetch one period ────────────────────────────────────────
  const fetchPeriod = async (p: string, token: string, force = false): Promise<void> => {
    if (!force && statsMap[p] && chartMap[p]) {
      console.log(`[Dashboard] Caché hit: ${p}`);
      setLoadingStats(false);
      setLoadingChart(false);
      return;
    }

    console.log(`[Dashboard] Fetching periodo: ${p}`);
    setLoadingStats(true);
    setLoadingChart(true);
    setError(null);

    try {
      const res = await fetch(
        `${API}/dashboard/stats?period=${p.toLowerCase()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log(`[Dashboard][${p}] Stats:`, data);

      setStatsMap((prev) => ({
        ...prev,
        [p]: {
          ingresos:  data.ingresos  ?? data.total_ingresos  ?? 0,
          ventas:    data.ventas    ?? data.total_ventas    ?? 0,
          productos: data.productos ?? data.total_productos ?? 0,
          ticket:    data.ticket_promedio ?? data.ticket    ?? 0,
        },
      }));

      const raw: ChartItem[] = data.chart ?? data.grafica ?? [];
      const points = raw.length > 0 ? raw : buildEmptyPoints(p);
      setChartMap((prev) => ({ ...prev, [p]: points }));
      console.log(`[Dashboard][${p}] Chart (${points.length} pts):`, points);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      console.error(`[Dashboard][${p}] Error:`, msg);
      setError("No se pudo cargar la información.");
      setStatsMap((prev) => ({ ...prev, [p]: { ingresos: 0, ventas: 0, productos: 0, ticket: 0 } }));
      setChartMap((prev) => ({ ...prev, [p]: buildEmptyPoints(p) }));
    } finally {
      setLoadingStats(false);
      setLoadingChart(false);
    }
  };

  // ── mount: preload all 3 periods ───────────────────────────
  useEffect(() => {
    const token = localStorage?.getItem?.("token") ?? "";

    // preload all in parallel
    Promise.all(PERIODS.map((p) => fetchPeriod(p, token)));

    // user profile
    (async () => {
      console.log("[Dashboard] Cargando perfil…");
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setUser({
          name: data.name ?? data.nombre ?? "Usuario",
          role: data.role ?? data.rol    ?? "Administrador",
        });
      } catch (err: unknown) {
        console.warn("[Dashboard] Perfil no disponible:", err instanceof Error ? err.message : err);
      }
    })();
  }, []);

  // ── period tab change ──────────────────────────────────────
  useEffect(() => {
    const token = localStorage?.getItem?.("token") ?? "";
    fetchPeriod(period, token);
  }, [period]);

  const isLoadingActive = loadingStats && !statsMap[period];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Welcome card ── */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeText}>
          <Text style={styles.greeting}>Bienvenido,</Text>
          <Text style={styles.userName}>{user.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user.role}</Text>
          </View>
        </View>
        <View style={styles.storeIcon}>
          <Text style={{ fontSize: 36 }}>🏪</Text>
        </View>
      </View>

      {/* ── Error banner ── */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* ── Stats 2×2 ── */}
      <View style={styles.statsGrid}>
        <StatCard emoji="💵" value={fmt(stats?.ingresos ?? 0)}  label="Ingresos totales" color="#00A651" loading={isLoadingActive} />
        <StatCard emoji="🧾" value={stats?.ventas    ?? "—"}    label="Ventas totales"   color={PINK}    loading={isLoadingActive} />
        <StatCard emoji="📦" value={stats?.productos ?? "—"}    label="Productos"        color="#E07B00" loading={isLoadingActive} />
        <StatCard emoji="📈" value={fmt(stats?.ticket  ?? 0)}   label="Ticket promedio"  color={PINK}    loading={isLoadingActive} />
      </View>

      {/* ── Chart card ── */}
      <View style={styles.chartSection}>
        {/* Header */}
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Ventas recientes</Text>
          <View style={styles.periodTabs}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                onPress={() => {
                  console.log(`[Dashboard] Tab → ${p}`);
                  setPeriod(p);
                }}
              >
                <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Context pill */}
        <View style={styles.periodPill}>
          <Text style={styles.periodPillText}>
            {period === "Hoy"    && "📅 Por hora — hoy"}
            {period === "Semana" && "📅 Por día — esta semana"}
            {period === "Mes"    && "📅 Por semana — este mes"}
          </Text>
        </View>

        {/* Chart */}
        <MiniBarChart
          data={chartData}
          loading={loadingChart && !chartMap[period]}
          period={period}
        />
      </View>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════
const PINK   = "#FF0080";
const BLUE   = "#1A2B6D";
const GRAY   = "#6b7280";
const BORDER = "#e8eaf0";
const BG     = "#f4f6fb";

const styles = StyleSheet.create({
  scroll:        { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 14 },

  welcomeCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  welcomeText:   { gap: 4 },
  greeting:      { fontSize: 14, color: PINK, fontWeight: "600" },
  userName:      { fontSize: 22, fontWeight: "800", color: BLUE, marginTop: 2 },
  roleBadge:     { marginTop: 8, backgroundColor: "#222", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, alignSelf: "flex-start" },
  roleBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  storeIcon:     { width: 62, height: 62, borderRadius: 31, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" },

  errorBanner: { backgroundColor: "#fff0f0", borderLeftWidth: 4, borderLeftColor: "#e00", borderRadius: 10, padding: 12 },
  errorText:   { color: "#b00", fontSize: 13, fontWeight: "600" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 18,
    width: (width - 44) / 2, alignItems: "center", gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statEmoji: { fontSize: 26 },
  statValue: { fontSize: 22, fontWeight: "800", color: BLUE },
  statLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },

  chartSection: {
    backgroundColor: "#fff", borderRadius: 18, padding: 18, gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  chartHeader:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chartTitle:          { fontSize: 17, fontWeight: "800", color: BLUE },
  periodTabs:          { flexDirection: "row", gap: 6 },
  periodBtn:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f0f0f0" },
  periodBtnActive:     { backgroundColor: PINK },
  periodBtnText:       { fontSize: 12, fontWeight: "700", color: GRAY },
  periodBtnTextActive: { color: "#fff" },

  periodPill:     { backgroundColor: "#fff0f7", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start" },
  periodPillText: { fontSize: 11, color: PINK, fontWeight: "700" },

  chartContainer: { gap: 8 },
  chartYAxis:     { flexDirection: "row", alignItems: "center", gap: 8 },
  chartYLabel:    { fontSize: 11, color: GRAY, minWidth: 64 },
  chartDashedLine:{ flex: 1, height: 1, borderStyle: "dashed", borderWidth: 1, borderColor: BORDER },
  barsRow:        { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingBottom: 4, minHeight: 160 },
  barWrapper:     { alignItems: "center", gap: 4, minWidth: 52 },
  barValue:       { fontSize: 9, color: GRAY, textAlign: "center" },
  bar:            { width: 34, backgroundColor: PINK, borderRadius: 7, opacity: 0.65 },
  barHighlight:   { opacity: 1 },
  barLabel:       { fontSize: 11, color: BLUE, fontWeight: "700" },

  chartSummary:     { flexDirection: "row", justifyContent: "space-between", paddingTop: 8, borderTopWidth: 1, borderTopColor: BORDER },
  chartSummaryText: { fontSize: 12, color: GRAY, fontWeight: "600" },

  chartEmpty:       { height: 150, alignItems: "center", justifyContent: "center", gap: 8 },
  chartEmptyText:   { color: GRAY, fontSize: 13 },
  chartLoading:     { height: 150, alignItems: "center", justifyContent: "center", gap: 10 },
  chartLoadingText: { color: GRAY, fontSize: 13 },
});