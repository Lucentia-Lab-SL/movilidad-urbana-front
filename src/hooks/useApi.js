import { useCallback } from "react";
import { auth } from "@/lib/firebase";

const API_URL = import.meta.env.VITE_API_URL;

async function getFirebaseToken() {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    localStorage.setItem("firebaseToken", token);
    return token;
  }
  return localStorage.getItem("firebaseToken");
}

export const useApi = () => {
  const fetchApi = useCallback(async (endpoint, options = {}, authRequired = false) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (authRequired) {
      const token = await getFirebaseToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        if (body?.detail) detail = `: ${body.detail}`;
      } catch {
        // La respuesta de error no siempre es JSON.
      }
      throw new Error(`Error API: ${res.status}${detail}`);
    }

    const contentType = res.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }

    return await res.text();
  }, []);

  return { fetchApi };
};