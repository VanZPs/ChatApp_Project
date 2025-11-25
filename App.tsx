import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { ActivityIndicator, View, StatusBar } from "react-native";

// Import halaman-halaman yang sudah dibuat
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ChatScreen from "./screens/ChatScreen";
import ProfileScreen from "./screens/ProfileScreen"; 

// Definisi Tipe Navigasi (Penting untuk TypeScript)
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Chat: undefined;
  // Parameter isSetup opsional untuk membedakan mode Edit vs Mode Awal
  Profile: { isSetup?: boolean }; 
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listener untuk memantau status login user (Realtime)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Tampilan Loading saat mengecek status login
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* Status Bar senada dengan tema ungu */}
      <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />
      
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // --- AREA SETELAH LOGIN ---
          <Stack.Group>
            <Stack.Screen name="Chat" component={ChatScreen} />
            
            {/* Halaman Profil muncul sebagai Modal (Slide dari bawah) */}
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ 
                presentation: 'modal', 
                animation: 'slide_from_bottom' 
              }}
            />
          </Stack.Group>
        ) : (
          // --- AREA SEBELUM LOGIN ---
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}