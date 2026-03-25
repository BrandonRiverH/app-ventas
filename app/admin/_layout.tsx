import { MaterialIcons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function AdminTabs() {
  const router = useRouter();

  const cerrarSesion = () => {
    router.replace("/login");
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,

        // BOTON CERRAR SESION
        headerRight: () => (
          <TouchableOpacity onPress={cerrarSesion} style={{ marginRight: 15 }}>
            <MaterialIcons name="logout" size={24} color="red" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="usuarios"
        options={{
          title: "Usuarios",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="inventario"
        options={{
          title: "Inventario",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ventas"
        options={{
          title: "Ventas",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="point-of-sale" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
