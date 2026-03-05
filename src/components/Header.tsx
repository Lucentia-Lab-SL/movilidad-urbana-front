import { useNavigate, useLocation } from "react-router-dom";
import { getAuthUser, logout } from "@/utils/storage";
import { LogOut } from "lucide-react";

const NAV_ITEMS = [
  { label: "Mapa", path: "/mapa" },
  { label: "Rutas", path: "/rutas" },
  { label: "Zonas", path: "/zonas" },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthUser();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border shrink-0">
      <span
        onClick={() => navigate("/mapa")}
        className="text-lg font-bold text-foreground tracking-tight cursor-pointer"
      >
        Movilidad Urbana
      </span>

      <nav className="hidden md:flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/perfil")}
          className="text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          Hola, <span className="font-medium text-foreground">{user}</span>
        </button>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive hover:opacity-80 transition-opacity duration-150"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>
    </header>
  );
};

export default Header;
