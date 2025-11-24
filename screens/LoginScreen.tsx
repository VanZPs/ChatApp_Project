import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, KeyboardAvoidingView, Platform 
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Ops!", "Mohon isi email dan password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      Alert.alert("Login Gagal", error.message);
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={["#8A2BE2", "#E6E6FA"]} style={styles.background}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back! 👋</Text>
          <Text style={styles.subtitle}>Masuk untuk melanjutkan chat</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="nama@email.com"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan password"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={styles.btnPrimary} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "Memproses..." : "Masuk Sekarang"}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.linkText}>Daftar di sini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 25,
    padding: 30,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#4B0082", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 30 },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "600", color: "#4B0082", marginBottom: 8, marginLeft: 5 },
  input: {
    backgroundColor: "#F3E5F5",
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  btnPrimary: {
    backgroundColor: "#8A2BE2",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: "#666" },
  linkText: { color: "#8A2BE2", fontWeight: "bold" },
});