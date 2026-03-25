import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API = "http://127.0.0.1:3000/api/productos";

// ─── Helpers ──────────────────────────────────────────────
const hoyISO = () => new Date().toISOString().split("T")[0]; // "2025-03-23"

const estaVencido = (fecha: string | null) => {
  if (!fecha) return false;
  return new Date(fecha) < new Date(hoyISO());
};

const stockBajo = (stock: number, minimo: number) =>
  stock !== null && minimo !== null && stock <= minimo;

// ─── Componente ───────────────────────────────────────────
export default function Inventario() {
  const [productos, setProductos] = useState<any[]>([]);

  // ── Form agregar
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [nuevaCaducidad, setNuevaCaducidad] = useState("");
  const [nuevoStock, setNuevoStock] = useState("10");
  const [imagen, setImagen] = useState<string | null>(null);

  // ── Modal editar
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editCaducidad, setEditCaducidad] = useState("");
  const [editImagen, setEditImagen] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────
  const cargarProductos = async () => {
    console.log("📡 Cargando productos...");
    try {
      const res = await fetch(API);
      console.log("📥 GET status:", res.status);
      const data = await res.json();
      console.log("📦 Productos:", data.length);
      setProductos(data);
    } catch (err) {
      console.log("❌ Error cargando productos:", err);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // ── Picker imagen (reutilizable) ──────────────────────────
  const pickImagen = async (setter: (v: string) => void) => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        "Permiso requerido",
        "Necesitas permitir acceso a la galería.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setter(uri);
      console.log(
        "🖼️ Imagen seleccionada, tamaño aprox:",
        Math.round(uri.length / 1024),
        "KB",
      );
    }
  };

  // ── Agregar producto ──────────────────────────────────────
  const agregarProducto = async () => {
    if (!nuevoNombre.trim() || !nuevoPrecio.trim()) {
      Alert.alert("Error", "Nombre y precio son obligatorios.");
      return;
    }

    const body = {
      nombre: nuevoNombre.trim(),
      precio: parseFloat(nuevoPrecio),
      stock: parseInt(nuevoStock) || 0,
      fecha_caducidad: nuevaCaducidad || null,
      imagen: imagen || null,
    };

    console.log("📤 POST body:", {
      ...body,
      imagen: body.imagen ? "[BASE64]" : null,
    });

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log("📥 POST status:", res.status);
      const data = await res.json().catch(() => ({}));
      console.log("📥 POST response:", data);

      if (!res.ok) {
        Alert.alert("Error", data.error || "No se pudo guardar.");
        return;
      }

      // Limpiar form
      setNuevoNombre("");
      setNuevoPrecio("");
      setNuevoStock("10");
      setNuevaCaducidad("");
      setImagen(null);
      cargarProductos();
    } catch (err) {
      console.log("❌ Error POST:", err);
      Alert.alert("Error", "No se pudo conectar al servidor.");
    }
  };

  // ── Abrir modal editar ────────────────────────────────────
  const abrirEditar = (item: any) => {
    console.log("✏️ Editando producto ID:", item.id_producto);
    setEditando(item);
    setEditNombre(item.nombre || "");
    setEditPrecio(String(item.precio_venta || ""));
    setEditStock(String(item.stock || ""));
    setEditCaducidad(item.fecha_caducidad?.split("T")[0] || "");
    setEditImagen(
      item.imagen && item.imagen.startsWith("data:image") ? item.imagen : null,
    );
    setModalVisible(true);
  };

  // ── Guardar edición ───────────────────────────────────────
  const guardarEdicion = async () => {
    if (!editNombre.trim() || !editPrecio.trim()) {
      Alert.alert("Error", "Nombre y precio son obligatorios.");
      return;
    }

    const body = {
      nombre: editNombre.trim(),
      precio: parseFloat(editPrecio),
      stock: parseInt(editStock) || 0,
      fecha_caducidad: editCaducidad || null,
      imagen: editImagen || null,
    };

    console.log("📤 PUT body:", {
      ...body,
      imagen: body.imagen ? "[BASE64]" : null,
      id: editando.id_producto,
    });

    try {
      const res = await fetch(`${API}/${editando.id_producto}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log("📥 PUT status:", res.status);
      const data = await res.json().catch(() => ({}));
      console.log("📥 PUT response:", data);

      if (!res.ok) {
        Alert.alert("Error", data.error || "No se pudo actualizar.");
        return;
      }

      setModalVisible(false);
      setEditando(null);
      cargarProductos();
    } catch (err) {
      console.log("❌ Error PUT:", err);
      Alert.alert("Error", "No se pudo conectar al servidor.");
    }
  };

  // ── Eliminar sin confirmación ─────────────────────────────
  const eliminarProducto = async (item: any) => {
    console.log("🗑️ DELETE ID:", item.id_producto);
    try {
      const res = await fetch(`${API}/${item.id_producto}`, {
        method: "DELETE",
      });
      console.log("📥 DELETE status:", res.status);
      const data = await res.json().catch(() => ({}));
      console.log("📥 DELETE response:", data);

      if (!res.ok) {
        Alert.alert("Error", data.error || "No se pudo eliminar.");
        return;
      }
      cargarProductos();
    } catch (err) {
      console.log("❌ Error DELETE:", err);
      Alert.alert("Error", "No se pudo conectar al servidor.");
    }
  };

  // ── Render card producto ──────────────────────────────────
  const renderProducto = (item: any) => {
    const vencido = estaVencido(item.fecha_caducidad);
    const bajo = stockBajo(item.stock, item.stock_minimo);

    return (
      <View
        key={item.id_producto}
        style={[
          styles.card,
          vencido && styles.cardVencido,
          bajo && !vencido && styles.cardStockBajo,
        ]}
      >
        <Image
          source={
            item.imagen && item.imagen.startsWith("data:image")
              ? { uri: item.imagen }
              : require("../../assets/images/no-image.png")
          }
          style={styles.img}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <Text style={styles.precio}>
            ${Number(item.precio_venta).toFixed(2)}
          </Text>
          <Text style={styles.stock}>Stock: {item.stock}</Text>

          {item.fecha_caducidad && (
            <Text style={styles.caducidad}>
              Caduca: {item.fecha_caducidad?.split("T")[0]}
            </Text>
          )}

          {/* ⚠️ Alertas */}
          {vencido && (
            <View style={styles.badgeRojo}>
              <MaterialIcons name="warning" size={12} color="#fff" />
              <Text style={styles.badgeTexto}>¡Medicamento VENCIDO!</Text>
            </View>
          )}

          {bajo && (
            <View style={styles.badgeAmarillo}>
              <MaterialIcons name="inventory" size={12} color="#fff" />
              <Text style={styles.badgeTexto}>
                Stock bajo — quedan {item.stock} (mín. {item.stock_minimo})
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => abrirEditar(item)}>
              <MaterialIcons name="edit" size={22} color="#2980b9" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => eliminarProducto(item)}>
              <MaterialIcons name="delete" size={22} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>📦 Inventario</Text>

        {/* ── Form agregar ─────────────────────────── */}
        <View style={styles.form}>
          <Text style={styles.sectionLabel}>Nuevo Producto</Text>

          <TextInput
            placeholder="Nombre"
            style={styles.input}
            value={nuevoNombre}
            onChangeText={setNuevoNombre}
          />
          <TextInput
            placeholder="Precio de venta"
            style={styles.input}
            value={nuevoPrecio}
            onChangeText={setNuevoPrecio}
            keyboardType="numeric"
          />
          <TextInput
            placeholder="Stock inicial"
            style={styles.input}
            value={nuevoStock}
            onChangeText={setNuevoStock}
            keyboardType="numeric"
          />
          <TextInput
            placeholder="Fecha caducidad (YYYY-MM-DD)"
            style={styles.input}
            value={nuevaCaducidad}
            onChangeText={setNuevaCaducidad}
          />

          <TouchableOpacity
            style={styles.imgPicker}
            onPress={() => pickImagen(setImagen)}
          >
            {imagen ? (
              <Image source={{ uri: imagen }} style={styles.preview} />
            ) : (
              <Text style={{ color: "#888" }}>📷 Seleccionar Imagen</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnNuevo} onPress={agregarProducto}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              + Agregar Producto
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Lista ────────────────────────────────── */}
        {productos.map(renderProducto)}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal Editar ─────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar Producto</Text>
            <TextInput
              placeholder="Nombre"
              style={styles.input}
              value={editNombre}
              onChangeText={setEditNombre}
            />
            <TextInput
              placeholder="Precio de venta"
              style={styles.input}
              value={editPrecio}
              onChangeText={setEditPrecio}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Stock"
              style={styles.input}
              value={editStock}
              onChangeText={setEditStock}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Fecha caducidad (YYYY-MM-DD)"
              style={styles.input}
              value={editCaducidad}
              onChangeText={setEditCaducidad}
            />{" "}
            |
            <TouchableOpacity
              style={styles.imgPicker}
              onPress={() => pickImagen(setEditImagen)}
            >
              {editImagen ? (
                <Image source={{ uri: editImagen }} style={styles.preview} />
              ) : (
                <Text style={{ color: "#888" }}>📷 Cambiar Imagen</Text>
              )}
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.btnNuevo,
                  { backgroundColor: "#95a5a6", flex: 1, marginRight: 8 },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: "#fff", textAlign: "center" }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnNuevo, { flex: 1 }]}
                onPress={guardarEdicion}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#f4f6f9" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  sectionLabel: { fontWeight: "bold", marginBottom: 8, color: "#555" },
  form: { marginBottom: 20 },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  imgPicker: {
    backgroundColor: "#ecf0f1",
    height: 100,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  preview: { width: "100%", height: "100%", borderRadius: 10 },
  btnNuevo: {
    backgroundColor: "#2ecc71",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  // Cards
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#2ecc71",
  },
  cardVencido: {
    borderLeftColor: "#e74c3c",
    backgroundColor: "#fff5f5",
  },
  cardStockBajo: {
    borderLeftColor: "#f39c12",
    backgroundColor: "#fffbf0",
  },
  img: { width: 80, height: 80, borderRadius: 10, marginRight: 10 },
  nombre: { fontWeight: "bold", fontSize: 16 },
  precio: { color: "#27ae60", fontWeight: "600" },
  stock: { color: "#555", fontSize: 13 },
  caducidad: { color: "#888", fontSize: 12 },
  actions: { flexDirection: "row", gap: 15, marginTop: 8 },
  // Badges
  badgeRojo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e74c3c",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 4,
    alignSelf: "flex-start",
    gap: 4,
  },
  badgeAmarillo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f39c12",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 4,
    alignSelf: "flex-start",
    gap: 4,
  },
  badgeTexto: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalActions: { flexDirection: "row", marginTop: 5 },
});
