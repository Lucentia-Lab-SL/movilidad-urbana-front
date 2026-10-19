import { useNavigate, useLocation } from "react-router-dom";
import { getAuthUser, logout } from "@/utils/storage";
import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import logo from "@/assets/logo-mobility.png";
import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useApi";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthUser();
  const { fetchApi } = useApi();

  const [serviceType, setServiceType] = useState([]);

  useEffect(() => {
    async function loadAccess() {
      try {
        const data = await fetchApi("/me/access", {}, true);
        setServiceType(data.serviceType || []);
      } catch (error) {
        console.error("Error cargando serviceType:", error);
        setServiceType([]);
      }
    }

    loadAccess();
  }, [fetchApi]);

  const NAV_ITEMS = [
    serviceType.includes("itinerarios") && {
      label: "Gestión de itinerarios",
      path: "/mapa",
    },
    serviceType.includes("aforos") && {
      label: "Gestión de aforos",
      path: "/zonas",
    },
  ].filter(Boolean);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error cerrando sesión en Firebase:", error);
    }

    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border shrink-0 max-md:h-auto max-md:flex-wrap max-md:gap-x-3 max-md:gap-y-2 max-md:py-2 max-sm:px-3">
      <div
        onClick={() => navigate("/mapa")}
        className="flex items-center gap-2 cursor-pointer max-md:shrink-0"
      >
        <img src={logo} alt="Movilidad" className="h-8 w-auto object-contain" />
        <span className="text-lg font-bold text-foreground tracking-tight max-sm:text-base">
          Movilidad Urbana
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-1 max-md:flex max-md:order-last max-md:w-full max-md:empty:hidden">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 max-md:flex-1 max-md:px-2 max-md:leading-tight ${
                active
                  ? "bg-verde text-white"
                  : "text-verde hover:text-foreground hover:bg-verde-claro"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-4 max-md:min-w-0 max-md:flex-1 max-md:justify-end max-md:gap-3">
        <button
          onClick={() => navigate("/perfil")}
          className="text-sm text-muted-foreground hover:text-accent transition-colors max-md:min-w-0 max-md:truncate"
        >
          Hola, <span className="font-medium text-foreground">{user}</span>
        </button>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive hover:opacity-80 transition-opacity duration-150 max-md:shrink-0"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>
    </header>
  );
};

export default Header;