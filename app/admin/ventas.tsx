import { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function Ventas() {
  const [productos, setProductos] = useState<any[]>([]);
  const [ventasDia, setVentasDia] = useState<any[]>([]);
  const [totales, setTotales] = useState<any>({});

  useEffect(() => {
    fetch("http://127.0.0.1:3000/api/reportes/productos-mas-vendidos")
      .then((res) => res.json())
      .then(setProductos)
      .catch(console.log);

    fetch("http://127.0.0.1:3000/api/reportes/ventas-por-dia")
      .then((res) => res.json())
      .then(setVentasDia)
      .catch(console.log);

    fetch("http://127.0.0.1:3000/api/reportes/ventas-totales")
      .then((res) => res.json())
      .then(setTotales)
      .catch(console.log);
  }, []);

  const barData = {
    labels: productos.map((p) => p.nombre?.substring(0, 5) || ""),
    datasets: [
      {
        data: productos.map((p) => Number(p.total_vendido) || 0),
      },
    ],
  };

  const lineData = {
    labels: ventasDia.map((v) => v.fecha?.substring(5, 10) || ""),
    datasets: [
      {
        data: ventasDia.map((v) => Number(v.total_dia) || 0),
      },
    ],
  };

  const chartConfig = {
    backgroundColor: "#1f2937",
    backgroundGradientFrom: "#1f2937",
    backgroundGradientTo: "#111827",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
    labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Reportes</Text>

        <View style={styles.row}>
          <TouchableOpacity style={styles.btn}>
            <Text>PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn}>
            <Text>Excel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn}>
            <Text>CSV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPrimary}>
            <Text style={{ color: "#fff" }}>Generar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FILTROS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Filtros</Text>

        <View style={styles.row}>
          <TextInput style={styles.input} placeholder="Fecha inicio" />
          <TextInput style={styles.input} placeholder="Fecha fin" />
        </View>
      </View>

      {/* KPIs */}
      <View style={styles.row}>
        <View style={styles.kpi}>
          <Text style={styles.kpiLabel}>TOTAL VENTAS</Text>
          <Text style={styles.kpiValue}>{totales.total_ventas || 0}</Text>
        </View>

        <View style={styles.kpi}>
          <Text style={styles.kpiLabel}>INGRESOS</Text>
          <Text style={styles.kpiValue}>${totales.dinero_total || 0}</Text>
        </View>

        <View style={styles.kpi}>
          <Text style={styles.kpiLabel}>TICKET PROMEDIO</Text>
          <Text style={styles.kpiValue}>
            $
            {totales.total_ventas
              ? (totales.dinero_total / totales.total_ventas).toFixed(2)
              : 0}
          </Text>
        </View>
      </View>

      {/* LINE CHART */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ventas por día</Text>

        {ventasDia.length > 0 && (
          <LineChart
            data={lineData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={{ borderRadius: 16 }}
          />
        )}
      </View>

      {/* BAR CHART */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Productos más vendidos</Text>

        {productos.length > 0 && (
          <BarChart
            data={barData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" u"
            chartConfig={chartConfig}
            style={{ borderRadius: 16 }}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 15,
  },

  header: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold", // 🔥 ya tipado correctamente
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginTop: 15,
  },

  cardTitle: {
    fontWeight: "bold",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  input: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 5,
  },

  btn: {
    backgroundColor: "#e5e7eb",
    padding: 10,
    borderRadius: 10,
    marginRight: 5,
  },

  btnPrimary: {
    backgroundColor: "#16a34a",
    padding: 10,
    borderRadius: 10,
  },

  kpi: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginRight: 5,
  },

  kpiLabel: {
    fontSize: 12,
    color: "#6b7280",
  },

  kpiValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
  },
});
