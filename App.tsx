import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { ActivityIndicator, View, StatusBar } from "react-native";

// Import halaman-halaman
import LoginScreen from "./screens/LoginScreen";
import ChatScreen from "./screens/ChatScreen";
import RegisterScreen from "./screens/RegisterScreen"; // <<< 1. Pastikan ini di-import

// Daftarkan nama-nama halaman
export type RootStackParamList = {
  Login: undefined;
  Register: undefined; // <<< 2. Tambahkan tipe ini
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />
      
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Jika user sudah login, masuk ke Chat
          <Stack.Screen name="Chat" component={ChatScreen} />
        ) : (
          // Jika belum login, bisa akses Login ATAU Register
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} /> 
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}