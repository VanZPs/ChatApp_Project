import { initializeApp } from "firebase/app";

// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore, collection } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: "AIzaSyDTtdISZ5LXsWAHanXQvG-Rc6c41G3M_TM",
  authDomain: "chatapp-e96e4.firebaseapp.com",
  projectId: "chatapp-e96e4",
  storageBucket: "chatapp-e96e4.firebasestorage.app",
  messagingSenderId: "256583949164",
  appId: "1:256583949164:web:ac1ff2153877e9c8a87149",
  measurementId: "G-961QE4BWWV"
};

// 1. Inisialisasi App 
export const app = initializeApp(firebaseConfig);

// 2. Inisialisasi Auth
let auth: any;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  auth = getAuth(app);
}

export { auth };

// 3. Inisialisasi Database
export const db = getFirestore(app);

// 4. Referensi Koleksi
export const messagesCollection = collection(db, "messages");