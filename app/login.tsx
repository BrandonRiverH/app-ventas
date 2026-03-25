import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const login = async () => {
    if (loading) return;

    if (email === "" || password === "") {
      alert("Completa los campos");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Usuario o contraseña incorrectos");
        setLoading(false);
        return;
      }

      alert("Bienvenido " + data.user.nombre);

      const rol = data.user.id_rol;

      if (rol === 1) {
        router.replace("/admin/dashboard");
      } else if (rol === 2) {
        router.replace("/(tabs)/home");
      } else {
        alert("Rol no válido");
      }
    } catch (err) {
      alert("Error conectando con servidor");
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>FarmaPOS</Text>

        <Text style={styles.title}>Bienvenido de vuelta</Text>
        <Text style={styles.subtitle}>
          Ingresa tus credenciales para acceder al sistema
        </Text>

        <Text style={styles.label}>Correo electrónico</Text>

        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color="#6b7280" />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.label}>Contraseña</Text>

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="#6b7280" />
          <TextInput
            style={styles.input}
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <MaterialIcons
              name={showPass ? "visibility" : "visibility-off"}
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.options}>
          <Text style={styles.remember}>Recordarme</Text>
          <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={login}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ingresar al sistema</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.register}>
          ¿No tienes cuenta?{" "}
          <Text style={{ color: "#16a34a" }}>Regístrate aquí</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f766e",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#f1f5f9",
    borderRadius: 15,
    padding: 25,
    elevation: 5,
  },

  logo: {
    textAlign: "center",
    fontSize: 18,
    color: "#334155",
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: 20,
  },

  label: {
    marginBottom: 5,
    fontWeight: "500",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#93c5fd",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    marginLeft: 10,
  },

  options: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  remember: {
    color: "#64748b",
  },

  forgot: {
    color: "#16a34a",
  },

  button: {
    backgroundColor: "#15803d",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  register: {
    textAlign: "center",
    marginTop: 15,
    color: "#64748b",
  },
});
