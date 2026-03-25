// app/(tabs)/Carrito.tsx
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  clearCart,
  getCart,
  removeFromCart,
  saveCart,
  subscribe,
} from "../../utils/cartStore";

const API = "http://127.0.0.1:3000/api";

export default function Carrito() {
  const [productos, setProductos] = useState<any[]>([]);
  const [ticket, setTicket] = useState<any>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const c = await getCart();
      if (!mounted) return;
      setProductos(c);
    })();

    const unsub = subscribe((c) => {
      if (!mounted) return;
      setProductos(c);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const calcularTotal = () =>
    productos.reduce(
      (sum, p) => sum + Number(p.precio) * Number(p.cantidad),
      0
    );

  const aumentarCantidad = async (id: number) => {
    const nuevo = productos.map((p) =>
      p.id_producto === id ? { ...p, cantidad: Number(p.cantidad) + 1 } : p
    );
    setProductos(nuevo);
    await saveCart(nuevo);
  };

  const disminuirCantidad = async (id: number) => {
    const nuevo = productos
      .map((p) =>
        p.id_producto === id ? { ...p, cantidad: Number(p.cantidad) - 1 } : p
      )
      .filter((p) => p.cantidad > 0);
    setProductos(nuevo);
    await saveCart(nuevo);
  };

  const eliminarProducto = async (id: number) => {
    const nuevo = productos.filter((p) => p.id_producto !== id);
    setProductos(nuevo);
    await removeFromCart(id);
  };

  const vaciarCarrito = async () => {
    setProductos([]);
    await clearCart();
  };

  const realizarVenta = async () => {
    if (productos.length === 0) {
      Alert.alert("Carrito vacío");
      return;
    }

    const total = calcularTotal();
    console.log("📤 POST /api/ventas — productos:", productos.length, "total:", total);

    try {
      const resp = await fetch(`${API}/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productos, total }),
      });

      console.log("📥 POST status:", resp.status);
      const data = await resp.json().catch(() => ({}));
      console.log("📥 POST response:", data);

      if (!resp.ok || !data.id_venta) {
        Alert.alert("Error", data.error || "No se pudo crear la venta");
        return;
      }

      await clearCart();
      setProductos([]);
      obtenerTicket(data.id_venta);

    } catch (err) {
      console.log("❌ Error venta:", err);
      Alert.alert("Error conectando con servidor");
    }
  };

  const obtenerTicket = async (id: number) => {
    console.log("📥 GET /api/ventas/:id", id);
    try {
      const resp = await fetch(`${API}/ventas/${id}`);
      const data = await resp.json();
      console.log("🧾 Ticket:", data);
      setTicket(data);
    } catch (err) {
      console.log("❌ Error ticket:", err);
    }
  };

  // ── Generar PDF del ticket ────────────────────────────────
  const generarPDF = async () => {
  if (!ticket) return;
  setGenerandoPDF(true);
 
  try {
    const venta = ticket.venta ?? {};
    const items = ticket.productos || ticket.detalle || [];
    const fecha = venta.fecha
      ? new Date(venta.fecha).toLocaleString("es-MX")
      : new Date().toLocaleString("es-MX");
 
    const total = Number(ticket.total || venta.total || 0).toFixed(2);
 
    const filas = items
      .map(
        (p: any) => `
        <tr>
          <td class="td-nombre">${p.nombre ?? "—"}</td>
          <td class="td-center">${p.cantidad}</td>
          <td class="td-right">$${Number(p.precio_unitario ?? p.precio ?? 0).toFixed(2)}</td>
          <td class="td-right subtotal">$${Number(p.subtotal ?? (p.precio_unitario ?? p.precio) * p.cantidad).toFixed(2)}</td>
        </tr>`
      )
      .join("");
 
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
 
        * { margin: 0; padding: 0; box-sizing: border-box; }
 
        body {
          font-family: 'Inter', Arial, sans-serif;
          background: #f0f4f8;
          display: flex;
          justify-content: center;
          padding: 32px 16px;
        }
 
        .ticket {
          background: #fff;
          width: 420px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.10);
        }
 
        /* ── Header verde ── */
        .header {
          background: linear-gradient(135deg, #1a7a4a 0%, #27ae60 100%);
          padding: 28px 24px 20px;
          text-align: center;
          color: #fff;
        }
        .header .icon { font-size: 36px; margin-bottom: 6px; }
        .header h1 {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
        }
        .header p { font-size: 12px; opacity: 0.85; margin-top: 2px; }
 
        /* ── Badge venta ── */
        .meta-bar {
          background: #f8fafb;
          border-bottom: 1px solid #e8ecef;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .meta-bar .venta-id {
          font-size: 13px;
          font-weight: 700;
          color: #1a7a4a;
          background: #e8f5ee;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .meta-bar .fecha {
          font-size: 11px;
          color: #888;
        }
 
        /* ── Tabla productos ── */
        .tabla-wrap { padding: 20px 24px 0; }
 
        table { width: 100%; border-collapse: collapse; }
 
        thead tr {
          border-bottom: 2px solid #e8ecef;
        }
        thead th {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #aab;
          padding-bottom: 8px;
        }
        thead th:first-child { text-align: left; }
        .td-center { text-align: center; }
        .td-right { text-align: right; }
 
        tbody tr { border-bottom: 1px solid #f0f0f0; }
        tbody tr:last-child { border-bottom: none; }
 
        td {
          font-size: 13px;
          color: #333;
          padding: 10px 4px;
          vertical-align: middle;
        }
        .td-nombre { font-weight: 600; max-width: 160px; }
        .subtotal { font-weight: 700; color: #1a7a4a; }
 
        /* ── Total ── */
        .total-wrap {
          margin: 0 24px;
          border-top: 2px dashed #d0d7de;
          padding: 16px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .total-label { font-size: 14px; font-weight: 600; color: #555; }
        .total-valor {
          font-size: 26px;
          font-weight: 700;
          color: #1a7a4a;
        }
 
        /* ── Items count ── */
        .items-count {
          padding: 6px 24px 14px;
          font-size: 11px;
          color: #aaa;
        }
 
        /* ── Footer ── */
        .footer {
          background: linear-gradient(135deg, #1a7a4a 0%, #27ae60 100%);
          padding: 18px 24px;
          text-align: center;
          margin-top: 20px;
        }
        .footer p { color: #fff; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; }
        .footer small { color: rgba(255,255,255,0.75); font-size: 10px; display: block; margin-top: 4px; }
 
        /* ── Barcode decorativo ── */
        .barcode {
          text-align: center;
          padding: 10px 24px 0;
          letter-spacing: 3px;
          font-size: 32px;
          color: #222;
          font-family: 'Courier New', monospace;
        }
        .barcode-num {
          text-align: center;
          font-size: 9px;
          color: #bbb;
          padding-bottom: 4px;
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>
      <div class="ticket">
 
        <!-- Header -->
        <div class="header">
          <div class="icon">💊</div>
          <h1>Farmacia</h1>
          <p>Sistema FarmaPOS • Ticket de venta</p>
        </div>
 
        <!-- Meta -->
        <div class="meta-bar">
          <span class="venta-id">Venta #${venta.id_venta ?? "—"}</span>
          <span class="fecha">${fecha}</span>
        </div>
 
        <!-- Tabla -->
        <div class="tabla-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th class="td-center">Cant</th>
                <th class="td-right">P. Unit</th>
                <th class="td-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>
        </div>
 
        <!-- Items count -->
        <p class="items-count">${items.length} producto${items.length !== 1 ? "s" : ""}</p>
 
        <!-- Total -->
        <div class="total-wrap">
          <span class="total-label">TOTAL A PAGAR</span>
          <span class="total-valor">$${total}</span>
        </div>
 
        <!-- Barcode decorativo -->
        <div class="barcode">||| || ||| | || ||| ||</div>
        <div class="barcode-num">VTA-${String(venta.id_venta ?? "0").padStart(8, "0")}</div>
 
        <!-- Footer -->
        <div class="footer">
          <p>¡Gracias por su compra!</p>
          <small>Conserve este ticket como comprobante</small>
        </div>
 
      </div>
    </body>
    </html>`;
 
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    console.log("✅ PDF generado:", uri);
 
    const puedeCom = await Sharing.isAvailableAsync();
    if (puedeCom) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Ticket de venta",
        UTI: "com.adobe.pdf",
      });
    } else {
      Alert.alert("PDF generado", `Guardado en:\n${uri}`);
    }
  } catch (err) {
    console.log("❌ Error PDF:", err);
    Alert.alert("Error", "No se pudo generar el PDF");
  } finally {
    setGenerandoPDF(false);
  }
};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>🛒 CARRITO</Text>

      <FlatList
        data={productos}
        scrollEnabled={false}
        keyExtractor={(item) => item.id_producto.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text>Precio: ${item.precio}</Text>

            <View style={styles.cantidadRow}>
              <TouchableOpacity
                style={styles.botonCantidad}
                onPress={() => disminuirCantidad(item.id_producto)}
              >
                <Text style={styles.textoCantidad}>-</Text>
              </TouchableOpacity>

              <Text style={styles.cantidad}>{item.cantidad}</Text>

              <TouchableOpacity
                style={styles.botonCantidad}
                onPress={() => aumentarCantidad(item.id_producto)}
              >
                <Text style={styles.textoCantidad}>+</Text>
              </TouchableOpacity>
            </View>

            <Text>Subtotal: ${item.precio * item.cantidad}</Text>

            <TouchableOpacity
              style={styles.botonEliminar}
              onPress={() => eliminarProducto(item.id_producto)}
            >
              <Text style={styles.textoBoton}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Text style={styles.total}>TOTAL: ${calcularTotal()}</Text>

      <TouchableOpacity style={styles.boton} onPress={realizarVenta}>
        <Text style={styles.textoBoton}>💰 COBRAR</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonVaciar} onPress={vaciarCarrito}>
        <Text style={styles.textoBoton}>🧹 VACIAR</Text>
      </TouchableOpacity>

      {ticket && (
        <View style={styles.ticket}>
          <Text style={styles.ticketTitle}>🧾 TICKET DE VENTA</Text>

          {(ticket.productos || ticket.detalle || []).map((p: any, i: number) => (
            <View key={i} style={styles.ticketRow}>
              <Text style={styles.ticketNombre}>{p.nombre}</Text>
              <Text>{p.cantidad} x ${p.precio_unitario || p.precio}</Text>
              <Text>${p.subtotal || p.precio * p.cantidad}</Text>
            </View>
          ))}

          <Text style={styles.ticketTotal}>
            TOTAL: ${ticket.total || ticket.venta?.total}
          </Text>

          {/* ── Botón PDF ── */}
          <TouchableOpacity
            style={[styles.botonPDF, generandoPDF && { opacity: 0.6 }]}
            onPress={generarPDF}
            disabled={generandoPDF}
          >
            <Text style={styles.textoBoton}>
              {generandoPDF ? "⏳ Generando..." : "📄 Descargar PDF"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f6fa" },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  item: { backgroundColor: "#fff", padding: 15, marginBottom: 10, borderRadius: 10 },
  nombre: { fontWeight: "bold", fontSize: 16 },
  cantidadRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  botonCantidad: { backgroundColor: "#3498db", padding: 10, borderRadius: 5 },
  textoCantidad: { color: "white", fontSize: 18, fontWeight: "bold" },
  cantidad: { marginHorizontal: 15, fontSize: 18 },
  botonEliminar: { backgroundColor: "#e74c3c", padding: 10, borderRadius: 5, marginTop: 10, alignItems: "center" },
  total: { fontSize: 22, fontWeight: "bold", marginTop: 10 },
  boton: { backgroundColor: "#27ae60", padding: 15, borderRadius: 10, marginTop: 20 },
  botonVaciar: { backgroundColor: "#e67e22", padding: 15, borderRadius: 10, marginTop: 10 },
  textoBoton: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  ticket: { marginTop: 40, padding: 20, backgroundColor: "#fff", borderRadius: 10 },
  ticketTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  ticketRow: { marginBottom: 10 },
  ticketNombre: { fontWeight: "bold" },
  ticketTotal: { marginTop: 10, fontSize: 18, fontWeight: "bold" },
  botonPDF: { backgroundColor: "#2980b9", padding: 14, borderRadius: 10, marginTop: 16, alignItems: "center" },
});
