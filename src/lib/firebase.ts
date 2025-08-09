// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "apiKey": "AIzaSyDYWi33RR4aeVKZEn7A3Pn-Xw2UUdJibIM",
  "authDomain": "candidatotrack-hh3um.firebaseapp.com",
  "projectId": "candidatotrack-hh3um",
  "storageBucket": "candidatotrack-hh3um.appspot.com",
  "messagingSenderId": "500875737053",
  "appId": "1:500875737053:web:1f7a5a8624ce90f10d6834"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };
