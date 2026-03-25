// app/(tabs)/medicamentos.tsx
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { addToCart, getCart, subscribe } from "../../utils/cartStore";

export default function Medicamentos() {
  const [productos, setProductos] = useState<any[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [carritoCount, setCarritoCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const obtenerProductos = async () => {
    try {
      const response = await fetch("http://127.0.0.1:3000/api/productos");
      const data = await response.json();

      console.log("📦 Productos API:", data);

      setProductos(data);
      setProductosFiltrados(data);
      setLoading(false);
    } catch (error) {
      console.log("❌ Error obteniendo productos:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerProductos();

    let mounted = true;

    (async () => {
      const c = await getCart();
      if (!mounted) return;
      setCarritoCount(c.length);
    })();

    const unsub = subscribe((c) => {
      setCarritoCount(c.length);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // 🔎 BUSCADOR
  const buscarMedicamento = (texto: string) => {
    setBusqueda(texto);

    const filtrados = productos.filter((p) =>
      p.nombre.toLowerCase().includes(texto.toLowerCase()),
    );

    setProductosFiltrados(filtrados);
  };

  const onAgregarCarrito = async (producto: any) => {
    const productoCarrito = {
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      precio: Number(producto.precio_venta ?? 0),
      cantidad: 1,
    };

    const nuevo = await addToCart(productoCarrito);

    setCarritoCount(nuevo.length);

    console.log("🛒 Cart ahora:", nuevo);
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      {/* 🔎 BUSCADOR */}
      <TextInput
        style={styles.search}
        placeholder="🔎 Buscar medicamento..."
        value={busqueda}
        onChangeText={buscarMedicamento}
      />

      <FlatList
        data={productosFiltrados}
        keyExtractor={(item) => item.id_producto.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* STOCK ARRIBA DERECHA */}
            <Text
              style={[
                styles.stock,
                {
                  backgroundColor: item.stock <= 5 ? "#ff7675" : "#2ecc71",
                },
              ]}
            >
              Stock: {item.stock}
            </Text>

            <Text style={styles.nombre}>💊 {item.nombre}</Text>

            <Text style={styles.caducidad}>
              ⏳ Caduca: {item.fecha_caducidad}
            </Text>

            <Text style={styles.precio}>💰 ${Number(item.precio_venta)}</Text>

            <TouchableOpacity
              style={styles.boton}
              onPress={() => onAgregarCarrito(item)}
            >
              <Text style={styles.textoBoton}>🛒 Agregar</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* BOTON CARRITO */}
      <View style={styles.carritoBar}>
        <TouchableOpacity onPress={() => router.push("/Carrito")}>
          <Text style={styles.carritoTexto}>
            🛒 Ver carrito ({carritoCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#F4F6F9",
  },

  search: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  nombre: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },

  caducidad: {
    color: "#555",
    marginBottom: 5,
  },

  precio: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
  },

  stock: {
    position: "absolute",
    top: 10,
    right: 10,
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold",
  },

  boton: {
    marginTop: 10,
    backgroundColor: "#3498db",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  textoBoton: {
    color: "#fff",
    fontWeight: "bold",
  },

  carritoBar: {
    backgroundColor: "#2c3e50",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  carritoTexto: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
});
