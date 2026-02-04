import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC8LbmccL8Yaq55VJoDVjdnn1aIlghmfT0",
  authDomain: "negocios-hn-2c8ab.firebaseapp.com",
  projectId: "negocios-hn-2c8ab",
  storageBucket: "negocios-hn-2c8ab.firebasestorage.app",
  messagingSenderId: "1039698963838",
  appId: "1:1039698963838:web:3006a51b07f137790e572f",
  measurementId: "G-YJSFM2WPJ1"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);