import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, KeyboardAvoidingView, Platform 
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

import { initializeApp, deleteApp } from "firebase/app"; 
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut 
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getFirestore } from "firebase/firestore"; 

import { app as mainApp } from "../firebase"; 
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email || !password) {
      Alert.alert("Ops!", "Mohon isi Nama, Email, dan Password.");
      return;
    }
    
    setLoading(true);
    
    let tempApp; 
    
    try {
      const uniqueName = "RegisterApp-" + new Date().getTime() + Math.random();
      tempApp = initializeApp(mainApp.options, uniqueName);
      
      const tempAuth = getAuth(tempApp);
      const tempDb = getFirestore(tempApp); 

      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name
      });

      await setDoc(doc(tempDb, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        createdAt: serverTimestamp(),
      });

      await signOut(tempAuth);

      Alert.alert(
        "Registrasi Berhasil!", 
        "Silakan login menggunakan akun baru Anda.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );

    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') errorMessage = "Email sudah terdaftar.";
      if (error.code === 'auth/weak-password') errorMessage = "Password terlalu lemah.";
      Alert.alert("Gagal Daftar", errorMessage);
    } finally {
      setLoading(false);
      if (tempApp) {
        try { await deleteApp(tempApp); } catch (e) {}
      }
    }
  };

  return (
    <LinearGradient colors={["#E6E6FA", "#8A2BE2"]} style={styles.background}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Buat Akun Baru 🚀</Text>
          <Text style={styles.subtitle}>Gabung komunitas chat kami</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nama Lengkap (Max 12 Huruf)</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama Anda"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              maxLength={12}
            />
            <Text style={styles.charCount}>{name.length}/12</Text>
          </View>

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
              placeholder="Minimal 6 karakter"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={styles.btnPrimary} 
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.linkText}>Login di sini</Text>
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
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 },
  inputContainer: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: "600", color: "#4B0082", marginBottom: 5, marginLeft: 5 },
  input: {
    backgroundColor: "#F3E5F5",
    borderRadius: 15,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  
  charCount: {
    textAlign: 'right',
    fontSize: 10,
    color: '#888',
    marginTop: 2,
    marginRight: 5
  },
  btnPrimary: {
    backgroundColor: "#9370DB", 
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
    elevation: 5,
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 15 },
  footerText: { color: "#666" },
  linkText: { color: "#4B0082", fontWeight: "bold" },
});