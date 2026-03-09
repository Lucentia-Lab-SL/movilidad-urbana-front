import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/utils/storage";
import { LogIn } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!username.trim()) newErrors.user = "El usuario es obligatorio";
    if (!password.trim()) newErrors.pass = "La contraseña es obligatoria";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    login(username.trim());
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-[45%] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, hsl(218 70% 14%) 0%, hsl(218 70% 14% / 0.5) 50%, transparent 100%)",
        }}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-[440px] mx-4 bg-card rounded-lg border border-border p-[30px] shadow-card flex flex-col gap-4"
      >
        <span className="self-start inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase bg-accent/15 text-accent px-3 py-1 rounded-full">
          Acceso
        </span>

        <h1 className="text-2xl font-bold text-foreground mt-1">Movilidad Urbana</h1>
        <p className="text-sm text-muted-foreground -mt-2">
          Sitio web de visualización de rutas, zonas y marcadores
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Escribe tu usuario"
            className="h-[46px] rounded-md border border-input bg-card px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-accent transition-all duration-150"
          />
          {errors.user && <span className="text-xs text-destructive">{errors.user}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Escribe tu contraseña"
            className="h-[46px] rounded-md border border-input bg-card px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-accent transition-all duration-150"
          />
          {errors.pass && <span className="text-xs text-destructive">{errors.pass}</span>}
        </div>

        <button
          type="submit"
          className="h-[46px] w-full rounded-md bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-elevated transition-all duration-150 mt-1"
        >
          <LogIn className="w-4 h-4 text-accent" />
          Acceder
        </button>

        <p className="text-xs text-muted-foreground text-center mt-1">
          Demo: cualquier usuario/contraseña
        </p>
      </form>
    </div>
  );
};

export default LoginPage;