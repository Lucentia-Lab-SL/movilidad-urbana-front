import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getAuthUser, loadJSON, saveJSON } from "@/utils/storage";
import Header from "@/components/Header";
import type { SavedZone } from "@/types/models";
import { Pentagon, Trash2, Eye, ArrowLeft } from "lucide-react";

const ZonesListPage = () => {
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const key = `zonas:${authUser}`;

  useEffect(() => {
    if (!isAuthenticated()) navigate("/login");
  }, [navigate]);

  const [zones, setZones] = useState<SavedZone[]>(() => loadJSON(key, []));

  useEffect(() => saveJSON(key, zones), [zones, key]);

  const deleteZone = (id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
  };

  const viewOnMap = (zone: SavedZone) => {
    saveJSON(`selectedZone:${authUser}`, zone);
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
          <Pentagon className="w-5 h-5 text-accent" />
          Zonas guardadas
        </h1>

        {zones.length === 0 ? (
          <div className="text-center py-16">
            <Pentagon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aún no tienes zonas guardadas.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Dibuja una zona en el mapa para guardarla.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {zones.map((z) => (
              <div
                key={z.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 shadow-[var(--shadow-card)]"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Pentagon className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{z.nombre}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {z.points.length} puntos
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(z.fechaISO).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => viewOnMap(z)}
                    className="h-8 px-3 rounded-md bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver en mapa
                  </button>
                  <button
                    onClick={() => deleteZone(z.id)}
                    className="h-8 px-3 rounded-md border border-border text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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

export default ZonesListPage;
