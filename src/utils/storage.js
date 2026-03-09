export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function isAuthenticated() {
  return localStorage.getItem("auth") === "true";
}

export function getAuthUser() {
  return localStorage.getItem("authUser") || "";
}

export function login(username) {
  localStorage.setItem("auth", "true");
  localStorage.setItem("authUser", username);
}

export function logout() {
  localStorage.removeItem("auth");
  localStorage.removeItem("authUser");
}