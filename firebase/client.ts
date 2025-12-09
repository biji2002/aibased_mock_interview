// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBKpOV_699tWn-_RnSKfSYVYKCgWRymE9g",
  authDomain: "prepwise-65b9a.firebaseapp.com",
  projectId: "prepwise-65b9a",
  storageBucket: "prepwise-65b9a.firebasestorage.app",
  messagingSenderId: "935021222640",
  appId: "1:935021222640:web:54a2d29763118361df4035",
  measurementId: "G-1KP98DFFR2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);