// app/(tabs)/Carrito.tsx

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
// ⚠️ CAMBIA ESTA IP POR LA DE TU PC

export default function Carrito() {
  const [productos, setProductos] = useState<any[]>([]);
  const [ticket, setTicket] = useState<any>(null);

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
      0,
    );

  const aumentarCantidad = async (id: number) => {
    const nuevo = productos.map((p) =>
      p.id_producto === id ? { ...p, cantidad: Number(p.cantidad) + 1 } : p,
    );

    setProductos(nuevo);
    await saveCart(nuevo);
  };

  const disminuirCantidad = async (id: number) => {
    const nuevo = productos
      .map((p) =>
        p.id_producto === id ? { ...p, cantidad: Number(p.cantidad) - 1 } : p,
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
    const total = calcularTotal();

    if (productos.length === 0) {
      Alert.alert("Carrito vacío");
      return;
    }

    try {
      const resp = await fetch(`${API}/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productos, total }),
      });

      const data = await resp.json();

      if (!data.id_venta) {
        Alert.alert("Error creando venta");
        return;
      }

      await clearCart();
      setProductos([]);

      obtenerTicket(data.id_venta);
    } catch (err) {
      console.log(err);
      Alert.alert("Error conectando con servidor");
    }
  };

  const obtenerTicket = async (id: number) => {
    try {
      const resp = await fetch(`${API}/ventas/${id}`);
      const data = await resp.json();

      console.log("TICKET:", data);

      setTicket(data);
    } catch (err) {
      console.log("error ticket", err);
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

      {/* TICKET */}

      {ticket && (
        <View style={styles.ticket}>
          <Text style={styles.ticketTitle}>🧾 TICKET DE VENTA</Text>

          {(ticket.productos || ticket.detalle || []).map(
            (p: any, i: number) => (
              <View key={i} style={styles.ticketRow}>
                <Text style={styles.ticketNombre}>{p.nombre}</Text>

                <Text>
                  {p.cantidad} x ${p.precio_unitario || p.precio}
                </Text>

                <Text>${p.subtotal || p.precio * p.cantidad}</Text>
              </View>
            ),
          )}

          <Text style={styles.ticketTotal}>
            TOTAL: ${ticket.total || ticket.venta?.total}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f6fa",
  },

  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },

  item: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },

  nombre: {
    fontWeight: "bold",
    fontSize: 16,
  },

  cantidadRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },

  botonCantidad: {
    backgroundColor: "#3498db",
    padding: 10,
    borderRadius: 5,
  },

  textoCantidad: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  cantidad: {
    marginHorizontal: 15,
    fontSize: 18,
  },

  botonEliminar: {
    backgroundColor: "#e74c3c",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },

  total: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },

  boton: {
    backgroundColor: "#27ae60",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },

  botonVaciar: {
    backgroundColor: "#e67e22",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  textoBoton: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  ticket: {
    marginTop: 40,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },

  ticketTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },

  ticketRow: {
    marginBottom: 10,
  },

  ticketNombre: {
    fontWeight: "bold",
  },

  ticketTotal: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
  },
});
