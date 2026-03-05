import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getAuthUser, loadJSON, saveJSON } from "@/utils/storage";
import { toast } from "sonner";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MarkersPanel from "@/components/MarkersPanel";
import RoutesPanel from "@/components/RoutesPanel";
import ZonesPanel from "@/components/ZonesPanel";
import type { Marker } from "@/components/MarkersPanel";
import type { RouteResult } from "@/components/RoutesPanel";
import type { Zone } from "@/components/ZonesPanel";
import type { SavedRoute, SavedZone } from "@/types/models";
import { Save } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();
  const authUser = getAuthUser();

  useEffect(() => {
    if (!isAuthenticated()) navigate("/login");
  }, [navigate]);

  const markersKey = `markers:${authUser}`;
  const [markers, setMarkers] = useState<Marker[]>(() => loadJSON(markersKey, []));
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routeOriginLabel, setRouteOriginLabel] = useState("");
  const [routeDestLabel, setRouteDestLabel] = useState("");
  const [routeMode, setRouteMode] = useState<"coche" | "apie" | "bici">("coche");
  const [departureTime, setDepartureTime] = useState("");
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [tempZone, setTempZone] = useState<{ lat: number; lng: number }[]>([]);

  // Load selected route/zone from list pages
  useEffect(() => {
    const selRouteKey = `selectedRoute:${authUser}`;
    const selZoneKey = `selectedZone:${authUser}`;
    const selRoute = loadJSON<SavedRoute | null>(selRouteKey, null);
    const selZone = loadJSON<SavedZone | null>(selZoneKey, null);

    if (selRoute) {
      setRouteResult({
        originCoord: { lat: selRoute.origen.lat, lng: selRoute.origen.lng },
        destCoord: { lat: selRoute.destino.lat, lng: selRoute.destino.lng },
        geometry: selRoute.geometry,
        distance: selRoute.distanciaKm,
        duration: selRoute.duracionMin,
      });
      setRouteOriginLabel(selRoute.origen.label);
      setRouteDestLabel(selRoute.destino.label);
      localStorage.removeItem(selRouteKey);
    }

    if (selZone) {
      setZones([{ points: selZone.points }]);
      localStorage.removeItem(selZoneKey);
    }
  }, [authUser]);

  useEffect(() => saveJSON(markersKey, markers), [markers, markersKey]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (isDrawingZone) {
        setTempZone((prev) => [...prev, { lat, lng }]);
      } else {
        setMarkers((prev) => [...prev, { lat, lng }]);
      }
    },
    [isDrawingZone]
  );

  const removeMarker = (i: number) => {
    setMarkers((prev) => prev.filter((_, idx) => idx !== i));
  };

  const closeZone = () => {
    if (tempZone.length >= 3) {
      const defaultName = `Zona ${zones.length + 1}`;
      const name = prompt("Nombre de la zona:", defaultName) || defaultName;
      const savedZone: SavedZone = {
        id: crypto.randomUUID(),
        nombre: name,
        points: tempZone,
        fechaISO: new Date().toISOString(),
      };
      // Save to per-user storage
      const zonesKey = `zonas:${authUser}`;
      const existing = loadJSON<SavedZone[]>(zonesKey, []);
      saveJSON(zonesKey, [...existing, savedZone]);

      setZones((prev) => [...prev, { points: tempZone }]);
      toast.success("Zona guardada");
    }
    setTempZone([]);
    setIsDrawingZone(false);
  };

  const handleRouteCalculated = (result: RouteResult, originLabel: string, destLabel: string, mode: string, depTime: string) => {
    setRouteResult(result);
    setRouteOriginLabel(originLabel);
    setRouteDestLabel(destLabel);
    setRouteMode(mode as "coche" | "apie" | "bici");
    setDepartureTime(depTime);
  };

  const saveRoute = () => {
    if (!routeResult) return;
    let llegadaHora: string | undefined;
    if (departureTime && routeResult.duration > 0) {
      const [h, m] = departureTime.split(":").map(Number);
      const total = h * 60 + m + routeResult.duration;
      const ah = Math.floor(total / 60) % 24;
      const am = total % 60;
      llegadaHora = `${String(ah).padStart(2, "0")}:${String(am).padStart(2, "0")}`;
    }

    const saved: SavedRoute = {
      id: crypto.randomUUID(),
      origen: { label: routeOriginLabel, lat: routeResult.originCoord.lat, lng: routeResult.originCoord.lng },
      destino: { label: routeDestLabel, lat: routeResult.destCoord.lat, lng: routeResult.destCoord.lng },
      modo: routeMode,
      distanciaKm: routeResult.distance,
      duracionMin: routeResult.duration,
      salidaHora: departureTime || undefined,
      llegadaHora,
      geometry: routeResult.geometry,
      fechaISO: new Date().toISOString(),
    };

    const key = `rutas:${authUser}`;
    const existing = loadJSON<SavedRoute[]>(key, []);
    saveJSON(key, [...existing, saved]);
    toast.success("Ruta guardada");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div
        className="px-6 py-6"
        style={{
          background:
            "linear-gradient(180deg, hsl(218 70% 14% / 0.06) 0%, transparent 100%)",
        }}
      >
        <h2 className="text-xl font-bold text-foreground">Visualiza rutas y zonas urbanas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Marca puntos, calcula rutas y define zonas directamente sobre el mapa.
        </p>
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <aside className="w-[360px] shrink-0 bg-card border border-border rounded-lg p-5 flex flex-col gap-6 overflow-y-auto shadow-[var(--shadow-card)]">
          <MarkersPanel
            markers={markers}
            onRemove={removeMarker}
            onClearAll={() => setMarkers([])}
          />
          <div className="h-px bg-border" />
          <RoutesPanel
            routeResult={routeResult}
            onCalculate={handleRouteCalculated}
          />
          {routeResult && (
            <button
              onClick={saveRoute}
              className="h-[44px] rounded-md bg-accent/10 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/20 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar ruta
            </button>
          )}
          <div className="h-px bg-border" />
          <ZonesPanel
            zones={zones}
            isDrawing={isDrawingZone}
            tempZone={tempZone}
            onStartDrawing={() => {
              setIsDrawingZone(true);
              setTempZone([]);
            }}
            onCloseZone={closeZone}
            onCancel={() => {
              setIsDrawingZone(false);
              setTempZone([]);
            }}
            onRemoveZone={(i) => setZones((prev) => prev.filter((_, idx) => idx !== i))}
          />
        </aside>

        <div className="flex-1 bg-card border border-border rounded-lg shadow-[var(--shadow-card)] overflow-hidden">
          <MapView
            markers={markers}
            routeResult={routeResult}
            zones={zones}
            tempZone={tempZone}
            isDrawingZone={isDrawingZone}
            onMapClick={handleMapClick}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
