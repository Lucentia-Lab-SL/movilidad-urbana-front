import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getAuthUser, loadJSON, saveJSON } from "@/utils/storage";
import Header from "@/components/Header";
import type { SavedRoute } from "@/types/models";
import { Route as RouteIcon, MapPin, Clock, Car, Footprints, Bike, Trash2, Eye, ArrowLeft } from "lucide-react";

const modeLabel: Record<string, { label: string; icon: React.ElementType }> = {
  coche: { label: "Coche", icon: Car },
  apie: { label: "A pie", icon: Footprints },
  bici: { label: "Bicicleta", icon: Bike },
};

const RoutesListPage = () => {
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const key = `rutas:${authUser}`;

  useEffect(() => {
    if (!isAuthenticated()) navigate("/login");
  }, [navigate]);

  const [routes, setRoutes] = useState<SavedRoute[]>(() => loadJSON(key, []));

  useEffect(() => saveJSON(key, routes), [routes, key]);

  const deleteRoute = (id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  const viewOnMap = (route: SavedRoute) => {
    saveJSON(`selectedRoute:${authUser}`, route);
    navigate("/mapa");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <button
          onClick={() => navigate("/mapa")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al mapa
        </button>

        <h1 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
          <RouteIcon className="w-5 h-5 text-accent" />
          Rutas guardadas
        </h1>

        {routes.length === 0 ? (
          <div className="text-center py-16">
            <RouteIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aún no tienes rutas guardadas.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Calcula una ruta desde el mapa y pulsa "Guardar ruta".
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {routes.map((r) => {
              const m = modeLabel[r.modo] || modeLabel.coche;
              const ModeIcon = m.icon;
              return (
                <div
                  key={r.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 shadow-[var(--shadow-card)]"
                >
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <ModeIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {r.origen.label.split(",")[0]} → {r.destino.label.split(",")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.distanciaKm} km</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.duracionMin} min</span>
                      <span>{m.label}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(r.fechaISO).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => viewOnMap(r)}
                      className="h-8 px-3 rounded-md bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver en mapa
                    </button>
                    <button
                      onClick={() => deleteRoute(r.id)}
                      className="h-8 px-3 rounded-md border border-border text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutesListPage;
