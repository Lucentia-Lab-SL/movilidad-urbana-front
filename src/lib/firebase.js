import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARA5GVvlsm4pTCmsYCt7x8zaLRbalYkAs",
  authDomain: "espacio-datos-movilidad.firebaseapp.com",
  projectId: "espacio-datos-movilidad",
  storageBucket: "espacio-datos-movilidad.firebasestorage.app",
  messagingSenderId: "710635761864",
  appId: "1:710635761864:web:2d4f6be0f61c67cf85f5fd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);