import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from "react-native";

// Import Firebase
import {
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { messagesCollection, auth } from "../firebase"; // Pastikan path ini benar

// Import Library Tambahan
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';

// Tipe data pesan
type MessageType = {
  id: string;
  text: string;
  user: string;
  imageUrl?: string; // Menyimpan string Base64 gambar
  createdAt: any;
};

export default function ChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Ambil email user yang sedang login
  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    // 1. Load History dari Local Storage (Agar muncul saat Offline)
    const loadLocalMessages = async () => {
      try {
        const saved = await AsyncStorage.getItem('chat_history');
        if (saved) {
          setMessages(JSON.parse(saved));
        }
      } catch (error) {
        console.log("Gagal memuat local storage:", error);
      }
    };
    loadLocalMessages();

    // 2. Setup Listener Real-time ke Firebase Firestore
    const q = query(messagesCollection, orderBy("createdAt", "asc"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const list: MessageType[] = [];
      snapshot.forEach((doc) => {
        // Gabungkan ID dokumen dengan data isinya
        list.push({
          id: doc.id,
          ...doc.data()
        } as MessageType);
      });
      
      // Update state aplikasi
      setMessages(list);
      
      // Simpan data terbaru ke Local Storage (Untuk penggunaan offline berikutnya)
      AsyncStorage.setItem('chat_history', JSON.stringify(list));
    });

    // Cleanup listener saat keluar layar
    return () => unsub();
  }, []);

  // Fungsi Kirim Pesan (Text atau Gambar)
  const sendMessage = async (imageBase64: string | null = null) => {
    // Validasi: Jangan kirim jika text kosong DAN gambar kosong
    if (!message.trim() && !imageBase64) return;
    
    try {
      await addDoc(messagesCollection, {
        text: message,       // Isi pesan teks
        user: userEmail,     // Pengirim
        imageUrl: imageBase64, // String Base64 gambar (jika ada)
        createdAt: serverTimestamp(),
      });
      
      setMessage(""); // Kosongkan input text setelah kirim
    } catch (error) {
      Alert.alert("Gagal Kirim", "Terjadi kesalahan saat mengirim pesan.");
      console.error(error);
    }
  };

  // Fungsi Pilih Gambar & Konversi ke Base64
  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true, // PENTING: Agar mendapat data teks gambar
        quality: 0.5,        // Kompresi 50% agar hemat kuota database
        maxWidth: 500,       // Resize lebar maks 500px
        maxHeight: 500,      // Resize tinggi maks 500px
      });

      if (result.didCancel) return;

      if (result.assets && result.assets.length > 0) {
        setUploading(true);
        const asset = result.assets[0];

        if (asset.base64) {
          // Format string Base64 agar bisa dibaca komponen Image
          const base64String = `data:${asset.type};base64,${asset.base64}`;
          
          // Langsung kirim sebagai pesan
          await sendMessage(base64String);
        } else {
          Alert.alert("Error", "Gagal memproses gambar (Base64 not found).");
        }
        setUploading(false);
      }
    } catch (error) {
      setUploading(false);
      Alert.alert("Error", "Gagal membuka galeri.");
    }
  };

  // Komponen untuk merender setiap item chat
  const renderItem = ({ item }: { item: MessageType }) => {
    const isMyMessage = item.user === userEmail;

    return (
      <View style={[
        styles.msgBox, 
        isMyMessage ? styles.myMsg : styles.otherMsg
      ]}>
        <Text style={styles.sender}>{item.user}</Text>
        
        {/* Jika ada gambar, tampilkan */}
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.chatImage}
            resizeMode="cover"
          />
        ) : null}

        {/* Jika ada text, tampilkan */}
        {item.text ? <Text style={styles.msgText}>{item.text}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* List Pesan */}
      <FlatList 
        data={messages} 
        renderItem={renderItem} 
        keyExtractor={(item) => item.id} 
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      
      {/* Input Area */}
      <View style={styles.inputRow}>
        {/* Tombol Kamera/Gambar */}
        <TouchableOpacity onPress={pickImage} style={styles.imgBtn} disabled={uploading}>
             <Text style={styles.imgBtnText}>📷</Text>
        </TouchableOpacity>

        {/* Kolom Ketik */}
        <TextInput 
          style={styles.input} 
          placeholder="Ketik pesan..." 
          value={message} 
          onChangeText={setMessage} 
          multiline
        />

        {/* Tombol Kirim */}
        {uploading ? (
          <ActivityIndicator size="small" color="#0000ff" />
        ) : (
          <Button title="Kirim" onPress={() => sendMessage()} />
        )}
      </View>
      
      {/* Tombol Logout (Opsional, untuk testing) */}
      <View style={styles.logoutContainer}>
        <Button title="Logout" color="red" onPress={() => auth.signOut()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  msgBox: { 
    padding: 10, 
    marginVertical: 5, 
    marginHorizontal: 10,
    borderRadius: 10, 
    maxWidth: "80%" 
  },
  myMsg: { 
    backgroundColor: "#d1f0ff", 
    alignSelf: "flex-end" 
  },
  otherMsg: { 
    backgroundColor: "#f0f0f0", 
    alignSelf: "flex-start" 
  },
  sender: { 
    fontSize: 10, 
    fontWeight: "bold", 
    marginBottom: 4, 
    color: '#555' 
  },
  msgText: {
    fontSize: 16,
    color: '#000'
  },
  chatImage: { 
    width: 200, 
    height: 200, 
    borderRadius: 10, 
    marginBottom: 5 
  },
  inputRow: { 
    flexDirection: "row", 
    padding: 10, 
    borderTopWidth: 1, 
    borderColor: "#ccc", 
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  input: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ddd',
    borderRadius: 20, 
    paddingHorizontal: 15, 
    paddingVertical: 8,
    marginHorizontal: 10,
    maxHeight: 100
  },
  imgBtn: { 
    padding: 10, 
    backgroundColor: '#eee', 
    borderRadius: 25 
  },
  imgBtnText: {
    fontSize: 20
  },
  logoutContainer: {
    marginBottom: 20,
    marginHorizontal: 20
  }
});