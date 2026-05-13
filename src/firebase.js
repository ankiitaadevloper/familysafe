import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAgMiyhbySGXHwQu_nUJn4jpss2T6x16cs",
  authDomain: "familysafe-121d.firebaseapp.com",
  projectId: "familysafe-121d",
  storageBucket: "familysafe-121d.firebasestorage.app",
  messagingSenderId: "1980834056",
  appId: "1:1980834056:web:9aa567641200f293de0cbd"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)