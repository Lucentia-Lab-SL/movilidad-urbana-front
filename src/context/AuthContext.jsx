import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const authContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        setUser(user);
        localStorage.setItem('token', idToken);  // Para fetch
        setToken(idToken);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
      }
    });
    return unsubscribe;
  }, []);

  const logout = () => signOut(auth);

  return (
    <authContext.Provider value={{ user, token, logout }}>
      {children}
    </authContext.Provider>
  );
}

export const useAuth = () => useContext(authContext);
