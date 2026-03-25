import { MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../screens/Home";

const Tab = createBottomTabNavigator();

export default function Tabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Inicio"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
