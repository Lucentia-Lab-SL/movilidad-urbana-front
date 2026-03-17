import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "pendiente",
  authDomain: "pendiente",
  projectId: "pendiente",
  storageBucket: "pendiente",
  messagingSenderId: "pendiente",
  appId: "pendiente",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);