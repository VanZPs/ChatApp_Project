import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, TextInput, FlatList, StyleSheet, Image, 
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
  Vibration, ToastAndroid
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { addDoc, serverTimestamp, query, orderBy, onSnapshot, collection, doc, getDoc } from "firebase/firestore";
import { messagesCollection, auth, db } from "../firebase";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

type MessageType = {
  id: string; text: string; user: string; 
  senderName?: string; senderPhoto?: string; senderColor?: string; 
  imageUrl?: string; createdAt: any;
};

type UserProfileMap = { [email: string]: { name?: string; color?: string; photo?: string } };

export default function ChatScreen({ navigation }: Props) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfileMap>({});
  
  const [myProfile, setMyProfile] = useState({ 
    name: auth.currentUser?.displayName || "User", 
    photo: null as string | null, 
    color: "#4B0082" 
  });

  const flatListRef = useRef<FlatList>(null);
  const userEmail = auth.currentUser?.email;
  const userUid = auth.currentUser?.uid;

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (userUid) {
        const docRef = doc(db, "users", userUid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (!data.nameColor) {
            navigation.navigate("Profile", { isSetup: true });
          }
        }
      }
    };
    checkFirstTimeUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const savedProfile = await AsyncStorage.getItem('my_profile');
        if (savedProfile) {
          const p = JSON.parse(savedProfile);
          setMyProfile({ name: p.displayName, photo: p.photoBase64, color: p.nameColor || "#4B0082" });
        }
      };
      loadProfile();
    }, [])
  );

  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      const profiles: UserProfileMap = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email) profiles[data.email] = { name: data.displayName, color: data.nameColor, photo: data.photoBase64 };
      });
      setUserProfiles(profiles);
    });
    return () => unsubUsers();
  }, []);

  useEffect(() => {
    const loadCache = async () => {
      const saved = await AsyncStorage.getItem('chat_history');
      if (saved) setMessages(JSON.parse(saved));
    };
    loadCache();

    const q = query(messagesCollection, orderBy("createdAt", "asc"));
    let isFirstLoad = true;

    const unsub = onSnapshot(q, (snapshot) => {
      const list: MessageType[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data() as MessageType;
          if (!isFirstLoad && data.user !== userEmail) {
            Vibration.vibrate(400);
            if (Platform.OS === 'android') ToastAndroid.show(`Pesan baru`, ToastAndroid.SHORT);
          }
        }
      });
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as MessageType));
      setMessages(list);
      AsyncStorage.setItem('chat_history', JSON.stringify(list));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 500);
      isFirstLoad = false;
    });
    return () => unsub();
  }, []);

  const sendMessage = async (imgBase64: string | null = null) => {
    if (!message.trim() && !imgBase64) return;
    try {
      const myCurrentProfile = userEmail ? userProfiles[userEmail] : {};
      await addDoc(messagesCollection, {
        text: message, user: userEmail, 
        senderName: myCurrentProfile?.name || auth.currentUser?.displayName, 
        senderPhoto: myCurrentProfile?.photo, 
        senderColor: myCurrentProfile?.color, 
        imageUrl: imgBase64, createdAt: serverTimestamp(),
      });
      setMessage("");
    } catch (error) { Alert.alert("Gagal", "Pesan tidak terkirim."); }
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.5, maxWidth: 500, maxHeight: 500 });
    if (result.assets && result.assets[0].base64) sendMessage(`data:${result.assets[0].type};base64,${result.assets[0].base64}`);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "..";
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: MessageType }) => {
    const isMe = item.user === userEmail;
    const userProfile = userProfiles[item.user] || {};
    const displayName = userProfile.name || item.senderName || item.user.split('@')[0];
    const displayPhoto = userProfile.photo || item.senderPhoto;
    let displayColor = userProfile.color || item.senderColor || (isMe ? '#FFFFFF' : '#8A2BE2');

    if (isMe && (displayColor === '#8A2BE2' || displayColor === '#FFFFFF')) displayColor = '#2E0854'; 
    else if (!isMe && !displayColor) displayColor = '#8A2BE2';

    const ChatAvatar = () => (
       <View style={styles.avatarChatContainer}>
          {displayPhoto ? (
             <Image source={{ uri: displayPhoto }} style={styles.avatarChat} />
          ) : (
             <View style={[styles.avatarChat, { backgroundColor: userProfile.color || item.senderColor || '#ccc', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>
                    {displayName ? displayName.charAt(0).toUpperCase() : "?"}
                </Text>
             </View>
          )}
       </View>
    );

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMe && <ChatAvatar />}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.senderName, { color: displayColor }]}>{displayName}</Text>
          {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.chatImage} resizeMode="cover" />}
          {item.text ? <Text style={[styles.msgText, { color: isMe ? '#fff' : '#333' }]}>{item.text}</Text> : null}
          <Text style={[styles.timeText, { color: isMe ? 'rgba(255,255,255,0.8)' : '#999' }]}>{formatTime(item.createdAt)}</Text>
        </View>
        {isMe && <ChatAvatar />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#8A2BE2", "#9370DB"]} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Group Chat 💬</Text>
          <Text style={styles.headerSub}>Online</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate("Profile", { isSetup: false })} style={styles.headerProfileBtn}>
             {userEmail && userProfiles[userEmail]?.photo ? (
               <Image source={{ uri: userProfiles[userEmail].photo }} style={styles.headerAvatar} />
             ) : (
               <View style={[styles.headerAvatar, { backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: myProfile.color || '#8A2BE2', fontWeight: 'bold', fontSize: 16 }}>
                    {myProfile.name ? myProfile.name.charAt(0).toUpperCase() : "U"}
                  </Text>
               </View>
             )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => auth.signOut()} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList ref={flatListRef} data={messages} renderItem={renderItem} keyExtractor={(i) => i.id} contentContainerStyle={styles.listContent} />
      
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.attachBtn}><Text style={styles.icon}>📷</Text></TouchableOpacity>
          <TextInput style={styles.input} placeholder="Tulis pesan..." placeholderTextColor="#999" value={message} onChangeText={setMessage} multiline />
          <TouchableOpacity onPress={() => sendMessage()} style={styles.sendBtn}><Text style={styles.sendIcon}>➤</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingTop: 20, elevation: 5 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: '#e0e0e0', fontSize: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerProfileBtn: { borderRadius: 20, padding: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  headerAvatar: { width: 35, height: 35, borderRadius: 17.5 },
  logoutBtn: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 10 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  listContent: { padding: 15, paddingBottom: 20 },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  avatarChatContainer: { marginHorizontal: 5 },
  avatarChat: { width: 30, height: 30, borderRadius: 15 },
  bubble: { maxWidth: '70%', padding: 10, borderRadius: 15, elevation: 2 },
  bubbleMe: { backgroundColor: '#8A2BE2', borderBottomRightRadius: 0 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 0 },
  senderName: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  chatImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 5 },
  msgText: { fontSize: 15, lineHeight: 20 },
  timeText: { fontSize: 10, alignSelf: 'flex-end', marginTop: 2 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 },
  input: { flex: 1, backgroundColor: '#F3E5F5', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10, marginHorizontal: 10, maxHeight: 100, fontSize: 16, color: '#333' },
  attachBtn: { padding: 10 },
  icon: { fontSize: 24 },
  sendBtn: { backgroundColor: '#8A2BE2', width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 3 }
});