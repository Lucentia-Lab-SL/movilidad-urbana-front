import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";  // Crea este primero
import { LogIn } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFirebaseLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      localStorage.setItem("firebaseToken", token);  
      localStorage.setItem("user", result.user.email || result.user.uid); 
      navigate("/"); 
    } catch (err) {
      setError("Error en login: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    localStorage.setItem("user", "demo@local");
    localStorage.setItem("firebaseToken", "demo-token");  
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Tu CSS igual */}
      <div className="absolute inset-x-0 top-0 h-[45%] pointer-events-none" style={{ background: "linear-gradient(180deg, hsl(218 70% 14%) 0%, hsl(218 70% 14% / 0.5) 50%, transparent 100%)" }} />
      
      <div className="relative z-10 w-full max-w-[440px] mx-4 bg-card rounded-lg border border-border p-[30px] shadow-card flex flex-col gap-4">
        <span className="self-start inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase bg-accent/15 text-accent px-3 py-1 rounded-full">
          Acceso
        </span>
        <h1 className="text-2xl font-bold text-foreground mt-1">Movilidad Urbana</h1>
        <p className="text-sm text-muted-foreground -mt-2">Sitio web de visualización de rutas, zonas y marcadores</p>

        {/* NUEVO: Botón Firebase Google */}
        <button
          onClick={handleFirebaseLogin}
          disabled={loading}
          className="h-[46px] w-full rounded-md bg-blue-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-600 transition-all duration-150"
        >
          <LogIn className="w-4 h-4" />
          {loading ? "Cargando..." : "Acceder con Google (Firebase)"}
        </button>

        {error && <span className="text-xs text-destructive">{error}</span>}

        {/* Demo viejo abajo */}
        <div className="text-center py-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">O demo rápido:</p>
          <button
            onClick={handleDemoLogin}
            className="h-[40px] w-full rounded-md bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-all"
          >
            Cualquier usuario/contraseña
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
