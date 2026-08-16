// ============================================
// 1Mayoq — Firebase konfiguratsiyasi
// ============================================
// Firebase Console (console.firebase.google.com) dan
// yangi loyiha yaratib, Web App qo'shganda shu ma'lumotlarni olasiz.
// SETUP.md faylida batafsil qadamlar yozilgan.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Hozircha anonim kirish — keyingi bosqichda to'liq auth (email/parol) qo'shiladi
export const authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      resolve(user);
    } else {
      signInAnonymously(auth).then((cred) => resolve(cred.user));
    }
  });
});
