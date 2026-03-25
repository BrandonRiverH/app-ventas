import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const obtenerProveedores = async () => {
    try {
      const res = await fetch("http://127.0.0.1:3000/api/proveedores");
      const data = await res.json();
      setProveedores(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    obtenerProveedores();
  }, []);

  const filtrados = proveedores.filter((p) =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Proveedores</Text>

      {/* 🔍 BUSCADOR */}
      <TextInput
        placeholder="Buscar por nombre, correo o teléfono..."
        style={styles.search}
        value={busqueda}
        onChangeText={setBusqueda}
      />

      {/* 📋 TABLA */}
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Nombre</Text>
          <Text style={styles.header}>Contacto</Text>
          <Text style={styles.header}>Teléfono</Text>
          <Text style={styles.header}>Correo</Text>
          <Text style={styles.header}>Estado</Text>
        </View>

        <FlatList
          data={filtrados}
          keyExtractor={(item) => item.id_proveedor.toString()}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.cell}>{item.nombre}</Text>
              <Text style={styles.cell}>{item.nombre_contacto}</Text>
              <Text style={styles.cell}>{item.telefono}</Text>
              <Text style={styles.cell}>{item.correo}</Text>

              <Text
                style={[
                  styles.status,
                  { color: item.activo ? "#27ae60" : "#e74c3c" },
                ]}
              >
                {item.activo ? "Activo" : "Inactivo"}
              </Text>
            </View>
          )}
        />
      </View>

      {/* ➕ BOTÓN */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>+ Nuevo Proveedor</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ecf0f1",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },

  search: {
    backgroundColor: "#2c3e50",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },

  table: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
  },

  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingBottom: 5,
    marginBottom: 5,
  },

  header: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 12,
  },

  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },

  cell: {
    flex: 1,
    fontSize: 12,
  },

  status: {
    flex: 1,
    fontWeight: "bold",
  },

  button: {
    marginTop: 15,
    backgroundColor: "#27ae60",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});