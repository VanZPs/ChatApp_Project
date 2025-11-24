import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, TextInput, FlatList, StyleSheet, Image, 
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { messagesCollection, auth } from "../firebase";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';

type MessageType = {
  id: string;
  text: string;
  user: string;
  senderName?: string; // Tambahan field Nama
  imageUrl?: string;
  createdAt: any;
};

export default function ChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const flatListRef = useRef<FlatList>(null);
  
  const userEmail = auth.currentUser?.email;
  // Ambil nama user yang sedang login (dari Auth)
  const currentUserName = auth.currentUser?.displayName || userEmail?.split('@')[0];

  useEffect(() => {
    const loadCache = async () => {
      const saved = await AsyncStorage.getItem('chat_history');
      if (saved) setMessages(JSON.parse(saved));
    };
    loadCache();

    const q = query(messagesCollection, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: MessageType[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as MessageType);
      });
      setMessages(list);
      AsyncStorage.setItem('chat_history', JSON.stringify(list));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 500);
    });
    return () => unsub();
  }, []);

  const sendMessage = async (imgBase64: string | null = null) => {
    if (!message.trim() && !imgBase64) return;
    try {
      await addDoc(messagesCollection, {
        text: message,
        user: userEmail,
        senderName: currentUserName, // Kirim Nama User
        imageUrl: imgBase64,
        createdAt: serverTimestamp(),
      });
      setMessage("");
    } catch (error) {
      Alert.alert("Gagal", "Pesan tidak terkirim.");
    }
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo', includeBase64: true, quality: 0.5, maxWidth: 500, maxHeight: 500 
    });
    if (result.assets && result.assets[0].base64) {
      sendMessage(`data:${result.assets[0].type};base64,${result.assets[0].base64}`);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "..";
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: MessageType }) => {
    const isMe = item.user === userEmail;
    // Gunakan senderName jika ada, kalau tidak pakai email
    const displayName = item.senderName || item.user.split('@')[0];

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {/* Tampilkan Nama Pengirim */}
          {!isMe && <Text style={styles.senderName}>{displayName}</Text>}
          
          {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.chatImage} resizeMode="cover" />}
          {item.text ? <Text style={[styles.msgText, isMe ? styles.textWhite : styles.textDark]}>{item.text}</Text> : null}
          <Text style={[styles.timeText, isMe ? styles.timeWhite : styles.timeDark]}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#8A2BE2", "#9370DB"]} style={styles.header}>
        <Text style={styles.headerTitle}>Group Chat 💬</Text>
        <TouchableOpacity onPress={() => auth.signOut()} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Exit</Text>
        </TouchableOpacity>
      </LinearGradient>

      <FlatList 
        ref={flatListRef} data={messages} renderItem={renderItem} keyExtractor={(i) => i.id} 
        contentContainerStyle={styles.listContent} 
      />
      
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
            <Text style={styles.icon}>📷</Text>
          </TouchableOpacity>
          <TextInput 
            style={styles.input} placeholder="Tulis pesan..." placeholderTextColor="#999"
            value={message} onChangeText={setMessage} multiline 
          />
          <TouchableOpacity onPress={() => sendMessage()} style={styles.sendBtn}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Style sama persis dengan sebelumnya
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15, paddingTop: 20, elevation: 5,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 10 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  listContent: { padding: 15, paddingBottom: 20 },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E6E6FA', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: '#8A2BE2' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 18, elevation: 2 },
  bubbleMe: { backgroundColor: '#8A2BE2', borderBottomRightRadius: 2 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 2 },
  senderName: { fontSize: 11, color: '#8A2BE2', fontWeight: 'bold', marginBottom: 4 },
  chatImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 5 },
  msgText: { fontSize: 16, lineHeight: 22 },
  textWhite: { color: '#fff' },
  textDark: { color: '#333' },
  timeText: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  timeWhite: { color: 'rgba(255,255,255,0.7)' },
  timeDark: { color: '#aaa' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 },
  input: { flex: 1, backgroundColor: '#F3E5F5', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10, marginHorizontal: 10, maxHeight: 100, fontSize: 16, color: '#333' },
  attachBtn: { padding: 10 },
  icon: { fontSize: 24 },
  sendBtn: { backgroundColor: '#8A2BE2', width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 3 }
});