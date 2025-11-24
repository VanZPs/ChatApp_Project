import { initializeApp } from "firebase/app";

// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore, collection } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDTtdISZ5LXsWAHanXQvG-Rc6c41G3M_TM",
  authDomain: "chatapp-e96e4.firebaseapp.com",
  projectId: "chatapp-e96e4",
  storageBucket: "chatapp-e96e4.firebasestorage.app",
  messagingSenderId: "256583949164",
  appId: "1:256583949164:web:ac1ff2153877e9c8a87149",
  measurementId: "G-961QE4BWWV"
};

const app = initializeApp(firebaseConfig);

let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  authInstance = getAuth(app);
}

export const auth = authInstance;

export const db = getFirestore(app);

export const messagesCollection = collection(db, "messages");