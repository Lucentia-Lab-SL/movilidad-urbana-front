import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { predefinedRoutes, provincias, getLocalidades } from "@/data/predefinedRoutes";
import { Route as RouteIcon, Search, MapPin, Eye, Filter, ArrowLeft } from "lucide-react";
import { saveJSON } from "@/utils/storage";
import { getAuthUser } from "@/utils/storage";

const RoutesListPage = () => {
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const [search, setSearch] = useState("");
  const [provincia, setProvincia] = useState("");
  const [localidad, setLocalidad] = useState("");

  const localidades = provincia ? getLocalidades(provincia) : [];

  const filtered = useMemo(() => {
    return predefinedRoutes.filter((r) => {
      if (provincia && r.provincia !== provincia) return false;
      if (localidad && r.localidad !== localidad) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.nombre.toLowerCase().includes(q) ||
          r.descripcion.toLowerCase().includes(q) ||
          r.localidad.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, provincia, localidad]);

  const viewOnMap = (route) => {
    saveJSON(`selectedPredefined:${authUser}`, route);
    navigate("/mapa");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <button
          onClick={() => navigate("/mapa")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al mapa
        </button>

        <h1 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
          <RouteIcon className="w-5 h-5 text-accent" />
          Catálogo de rutas
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Explora las rutas predefinidas de la empresa. Filtra por provincia o busca por nombre.
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar ruta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-accent transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={provincia}
              onChange={(e) => { setProvincia(e.target.value); setLocalidad(""); }}
              className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-accent"
            >
              <option value="">Todas las provincias</option>
              {provincias.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {localidades.length > 0 && (
              <select
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-accent"
              >
                <option value="">Todas las localidades</option>
                {localidades.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <RouteIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron rutas con esos filtros.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow"
              >
                <div>
                  <h3 className="text-sm font-bold text-foreground">{r.nombre}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {r.provincia} · {r.localidad}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{r.descripcion}</p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                    {r.origen.label.split(",")[0]} → {r.destino.label.split(",")[0]}
                  </span>
                  <button
                    onClick={() => viewOnMap(r)}
                    className="h-8 px-3 rounded-md bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver en mapa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutesListPage;