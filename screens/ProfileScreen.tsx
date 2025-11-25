import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, Image, ScrollView, ActivityIndicator
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

const COLORS = ["#FF5733", "#33FF57", "#3357FF", "#F033FF", "#FF33A8", "#33FFF5", "#FFA500", "#4B0082"];

export default function ProfileScreen({ navigation, route }: Props) {
  const isSetup = route.params?.isSetup || false;
  const user = auth.currentUser;
  const [name, setName] = useState(user?.displayName || "");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("#8A2BE2");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.uid) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.photoBase64) setPhotoBase64(data.photoBase64);
            if (data.nameColor) setSelectedColor(data.nameColor);
            if (data.displayName) setName(data.displayName);
          }
        } catch (e) { console.log(e); }
      }
    };
    loadProfile();
  }, []);

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo', includeBase64: true, quality: 0.5, maxWidth: 300, maxHeight: 300
    });
    if (result.assets && result.assets[0].base64) {
      setPhotoBase64(`data:${result.assets[0].type};base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Eits!", "Nama tidak boleh kosong.");
    setLoading(true);
    try {
      if (user) {
        await updateProfile(user, { displayName: name });
        await setDoc(doc(db, "users", user.uid), {
          displayName: name,
          photoBase64: photoBase64,
          nameColor: selectedColor,
          email: user.email,
          uid: user.uid
        }, { merge: true });

        const myProfile = { displayName: name, photoBase64: photoBase64, nameColor: selectedColor };
        await AsyncStorage.setItem('my_profile', JSON.stringify(myProfile));

        if (isSetup) {
           Alert.alert("Mantap!", "Profil berhasil diatur.", [{ text: "Lanjut Chatting", onPress: () => navigation.goBack() }]);
        } else {
           Alert.alert("Berhasil", "Profil diperbarui!", [{ text: "OK", onPress: () => navigation.goBack() }]);
        }
      }
    } catch (error: any) { Alert.alert("Gagal", error.message); }
    setLoading(false);
  };

  const handleSkip = async () => {
     if (user) {
        setLoading(true);
        await setDoc(doc(db, "users", user.uid), {
           nameColor: "#8A2BE2", 
           photoBase64: null 
        }, { merge: true });
        setLoading(false);
        navigation.goBack();
     }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#8A2BE2", "#9370DB"]} style={styles.header}>
        <Text style={styles.headerTitle}>{isSetup ? "Lengkapi Profil 📝" : "Edit Profil ✏️"}</Text>
        {isSetup ? (
           <TouchableOpacity onPress={handleSkip}><Text style={styles.closeBtn}>Lewati</Text></TouchableOpacity>
        ) : (
           <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.closeBtn}>Tutup</Text></TouchableOpacity>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.infoText}>
           {isSetup ? "Pilih foto dan warna agar teman mengenali Anda!" : "Ubah tampilan profil Anda di sini."}
        </Text>

        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {photoBase64 ? (
            <Image source={{ uri: photoBase64 }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: selectedColor }]}>
                <Text style={styles.avatarText}>
                    {name ? name.charAt(0).toUpperCase() : "?"}
                </Text>
            </View>
          )}
          <View style={styles.cameraIconBg}><Text style={styles.cameraIcon}>📷</Text></View>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
            <Text style={styles.label}>Nama Panggilan (Max 12 Huruf)</Text>
            <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="Nama Kamu" 
                placeholderTextColor="#aaa"
                maxLength={12} // <--- FITUR BATAS 12 KARAKTER
            />
            <Text style={styles.charCount}>{name.length}/12</Text>
        </View>

        <Text style={styles.label}>Warna Tema & Inisial</Text>
        <View style={styles.colorGrid}>
            {COLORS.map((color) => (
                <TouchableOpacity 
                    key={color} 
                    style={[styles.colorCircle, { backgroundColor: color }, selectedColor === color && styles.colorSelected]}
                    onPress={() => setSelectedColor(color)}
                />
            ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{isSetup ? "Simpan & Lanjut" : "Simpan Perubahan"}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FF' },
  header: { padding: 20, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeBtn: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  content: { padding: 20, alignItems: 'center' },
  infoText: { color: '#666', marginBottom: 20, textAlign: 'center' },
  
  avatarContainer: { marginBottom: 30, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#fff' }, 
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 50, color: '#fff', fontWeight: 'bold' }, 
  cameraIconBg: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 20, padding: 6, elevation: 5 },
  cameraIcon: { fontSize: 20 },

  inputContainer: { width: '100%', marginBottom: 20 },
  label: { alignSelf: 'flex-start', fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '600' },
  input: { width: '100%', backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', fontSize: 16, color: '#333' },
  charCount: { textAlign: 'right', fontSize: 10, color: '#888', marginTop: 4, marginRight: 5 },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 30 },
  colorCircle: { width: 40, height: 40, borderRadius: 20 },
  colorSelected: { borderWidth: 3, borderColor: '#000' },
  saveBtn: { width: '100%', backgroundColor: '#8A2BE2', padding: 15, borderRadius: 12, alignItems: 'center', elevation: 3 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});