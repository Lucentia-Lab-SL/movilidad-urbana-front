import { useState, useEffect, useCallback, useRef } from "react";
import { getAuthUser, loadJSON, saveJSON } from "@/utils/storage";
import { toast } from "sonner";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import RoutesPanel from "@/components/RoutesPanel";
import { useApi } from "@/hooks/useApi";
import { sortItinerariesByDuration } from "@/utils/itineraries";
import AccessDenied from "@/pages/AccessDenied";
import { Car, Footprints, Bike, BusFront } from "lucide-react";

// Las rutas de Peñíscola están guardadas con la eñe descompuesta (n + tilde).
const cityForApi = (city) => (city === "peniscola" ? "pen\u0303iscola" : city);

const routeGeometryCache = new Map();

async function loadRouteGeometries(fetchApi, city) {
  if (routeGeometryCache.has(city)) return routeGeometryCache.get(city);

  const geojson = await fetchApi(
    `/routes/graph?city=${encodeURIComponent(city)}`,
    {},
    true
  );
  const byRouteId = new Map();

  for (const feature of geojson?.features || []) {
    const routeId = feature?.properties?.route_id;
    if (routeId && feature.geometry?.coordinates?.length) {
      byRouteId.set(routeId, feature.geometry);
    }
  }

  routeGeometryCache.set(city, byRouteId);
  return byRouteId;
}

const HomePage = () => {
  const authUser = getAuthUser();
  const { fetchApi } = useApi();

  // usuario con acceso a la web/mapa
  const [hasAccess, setHasAccess] = useState(null);
  const [accessLoading, setAccessLoading] = useState(true);

  const [places, setPlaces] = useState([]);
  const [apiError, setApiError] = useState("");
  const [zones, setZones] = useState([]);
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [tempZone, setTempZone] = useState([]);
  const [serviceType, setServiceType] = useState([]);
  const [routeMode, setRouteMode] = useState("drive");
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState([]);
  
  // ciudades/ zonas que el usuario tiene acceso
  const [allowedZones, setAllowedZones] = useState([]);

  /** Estado del bloque de itinerarios:
   * - lista de itinerarios
   * - estado de carga/error
   * - paradas y legs del itinerario seleccionado
   * - detalle de itinerarios
   */

  const [itineraries, setItineraries] = useState([]);
  const [itinerariesLoading, setItinerariesLoading] = useState(false);
  const [itinerariesError, setItinerariesError] = useState(""); 
  const [itineraryStops, setItineraryStops] = useState([]);
  const [itineraryLegs, setItineraryLegs] = useState([]);
  const [selectedItineraryDetail, setSelectedItineraryDetail] = useState(null);

  // Identifica la última búsqueda/selección de itinerario. Si mientras se pintan
  // los tramos el usuario elige otro itinerario, cambia de ciudad o busca de nuevo,
  // el resultado anterior se descarta para que no pise al más reciente.
  const selectionRunRef = useRef(0);
  // Indica que la selección en curso es automática (primer itinerario tras buscar).
  const skipScrollRef = useRef(false);
  
  // Ciudad actualmente seleccionada en el panel.
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedRouteDate, setSelectedRouteDate] = useState("");
  // Comprbar el acceso desde el back y zonas permitidas
  useEffect(() => {
  async function checkAccess() {
    try {
      const data = await fetchApi("/me/access", {}, true);
      setHasAccess(data.access);
      setAllowedZones(data.allowedZones || []);
      setServiceType(data.serviceType || []);
      
    } catch (error) {
      console.error("Error comprobando acceso:", error);
      setHasAccess(false);
    } finally {
      setAccessLoading(false);
    }
  }
  checkAccess();
}, [fetchApi]);

// cargar itinerarios desde el back segun fecha, hora, ciudad y modos
const loadItineraries = async (date, time, modes, selectedPlaceIds) => {
  // Cualquier selección anterior que siga en curso deja de ser válida.
  const searchRun = ++selectionRunRef.current;
  try {
    setItinerariesLoading(true);
    setItinerariesError("");
    setRouteResult(null);
    setItineraryStops([]);
    setSelectedItineraryDetail(null);
    
    const now = new Date();
    const fechaInicio = date 
    ? date.replaceAll("-", "") 
    : `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
   
    const horaInicio = time 
    ? time
    : `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  
    const params = new URLSearchParams({
      city: cityForApi(selectedCity),
      fecha_inicio: fechaInicio,
      hora_inicio: horaInicio,
      max_itineraries: "30",
    });

    // Solo se envían modos al backend si el usuario ha elegido modos manuales.
    if (Array.isArray(modes) && modes.length > 0 && !modes.includes("good")) {
      modes.forEach((mode) => {
        params.append("allowed_modes", mode);
      });
    }

    if (Array.isArray(selectedPlaceIds) && selectedPlaceIds.length > 0) {
      selectedPlaceIds.forEach((placeId) => {
        params.append("selected_place_ids", placeId);
      });
    }

    const data = await fetchApi(
      `/itineraries?${params.toString()}`,
      {},
      true
    );

    setItineraries(data.itineraries || []);
    setItineraryLegs(data.legs || []);
    console.log("MODOS ENVIADOS:", modes);
    console.log("PRIMER ITINERARIO:", data?.itineraries?.[0]);
    console.log("LEGS:", data?.legs);

    // Por defecto se marca el primero del ranking (el de menor duración) y se
    // pinta en el mapa. Si el usuario ha hecho algo mientras buscaba (cambiar de
    // ciudad o elegir otro itinerario), se respeta y no se marca nada.
    const [firstItinerary] = sortItinerariesByDuration(data.itineraries);
    if (firstItinerary && searchRun === selectionRunRef.current) {
      await handleSelectItinerary({ ...firstItinerary, uiIndex: 1 }, { auto: true });
    }
  } catch (err) {
    console.error("Error cargando itinerarios:", err);
    setItinerariesError("Error al cargar itinerarios. Inténtalo más tarde");
    setItineraries([]);
    setItineraryLegs([]);
  } finally {
    setItinerariesLoading(false);
  }
};

// Modifica textos para poder comparar nombres ignorando mayúsculas y acentos.
const normalizeText = (text) =>
  (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

/**
 * Cuando el usuario selecciona un itinerario del ranking:
  * busca sus lugares reales en el array de places
  * construye los segmentos uno a uno consultando /routes/search
  * genera la estructura final que MapView necesita para pintarlo
 * Tras una búsqueda se llama también de forma automática con el primero
 * del ranking ({ auto: true }).
 */
const handleSelectItinerary = async (itinerary, { auto = false } = {}) => {
  // Esta selección pasa a ser la vigente; las anteriores que sigan en curso se descartan.
  const run = ++selectionRunRef.current;
  try {
    setSelectedItineraryDetail(itinerary);
    if (!itinerary?.visit_order_names) {
      toast.error("El itinerario no tiene lugares válidos");
      return;
    }
    const names = itinerary.visit_order_names
      .split(" → ")
      .map((n) => n.trim())
      .filter(Boolean);

    const matchedPlaces = names
      .map((name) =>
        places.find(
          (p) => normalizeText(p.name) === normalizeText(name)
        )
      )
      .filter(Boolean);

    if (matchedPlaces.length < 2) {
      toast.error("No se pudieron asociar los lugares del itinerario con el mapa");
      return;
    }

    // Guarda las paradas para colocar los marcadores A, B, C... en el mapa.
    setItineraryStops(
      matchedPlaces.map((p) => ({
        lat: p.lat,
        lng: p.lon,
        name: p.name,
      }))
    );

    const segments = [];
    let totalDistanceM = 0;
    let totalDurationS = 0;

    // Recorre cada tramo entre dos paradas consecutivas del itinerario.
    for (let i = 0; i < matchedPlaces.length - 1; i++) {
      // Si ya hay una selección más reciente, no se siguen pidiendo tramos.
      if (run !== selectionRunRef.current) return;

      const fromPlace = matchedPlaces[i];
      const toPlace = matchedPlaces[i + 1];

      // Usa el modo real que haya elegido el backend para ese tramo
      const displayMode = itinerary.modes_used?.[i] || "drive";
      const apiMode = displayMode;

      const routes = await fetchApi(
        `/routes/search?from_place_id=${fromPlace.place_id}&to_place_id=${toPlace.place_id}&mode=${apiMode}`,
        {},
        true
      );

      if (!routes || routes.length === 0) continue;

      let route = routes[0];

      if (!route?.geometry?.coordinates?.length && route?.route_id) {
        const geometries = await loadRouteGeometries(fetchApi, selectedCity);
        const geometry = geometries.get(route.route_id);
        if (geometry) route = { ...route, geometry };
      }

      if (!route?.geometry?.coordinates?.length) continue;

      // Guarda cada segmento con su geometría y su modo para que el mapa
      // pinta tramo a tramo.
      segments.push({
        ...route,
        mode: displayMode,
      });

      totalDistanceM += route.cost_distance_m || 0;
      totalDurationS += route.cost_time_s || 0;
          }


if (run !== selectionRunRef.current) return;

if (!segments.length) {
  toast.error("No se pudo pintar el itinerario");
  return;
}

    const firstPlace = matchedPlaces[0];
    const lastPlace = matchedPlaces[matchedPlaces.length - 1];

    const result = {
      segments: segments.map((s) => ({
        geometry: s.geometry,
        mode: s.mode || "drive",
      })),
      originCoord: { lat: firstPlace.lat, lng: firstPlace.lon },
      destCoord: { lat: lastPlace.lat, lng: lastPlace.lon },
      distance: Math.round((totalDistanceM / 1000) * 10) / 10,
      duration: Math.round(totalDurationS / 60),
    };

    // La selección automática tras buscar no desplaza la vista hasta el mapa
    // (en pantallas pequeñas el usuario se quedaría sin ver el ranking).
    if (auto) skipScrollRef.current = true;
    handleRouteCalculated(result, itinerary.modes_used?.[0] || "drive");

    if (!auto) toast.success("Itinerario cargado en el mapa");
  } catch (error) {
    console.error("Error pintando itinerario:", error);
    if (run === selectionRunRef.current) toast.error("Error al pintar el itinerario");
  }
};
  // Carga de lugares desde el backend
  useEffect(() => {
    async function cargarPlaces() {
      try {
        const data = await fetchApi("/places", {}, true);
        setPlaces(data);
        setApiError("");
      } catch (err) {
        setApiError(err.message || "Error al cargar lugares");
      }
    }

    if (hasAccess) {
      cargarPlaces();
    }
  }, [fetchApi, hasAccess]);

  /** 
   * Muestra ciudad permitida para usuario y seleciona 
   * Si tiene acceso a todas ("*"), mantiene la lista completa
   * Si la ciudad actual no está permitida, se cambia a la primera disponible
   */
  useEffect(() => {
    if (!allowedZones || allowedZones.length === 0) return;

    const allCities = ["alicante", "elche", "valencia", "peniscola"];

    const availableCities = allowedZones.includes("*")
      ? allCities
      : allCities.filter((city) =>
          allowedZones.some((zone) => zone.toLowerCase() === city.toLowerCase())
        );

    if (availableCities.length === 0) return;

    if (selectedCity && !availableCities.includes(selectedCity)) {
      setSelectedCity("");
    }
  }, [allowedZones, selectedCity]);

  useEffect(() => {
    if (!hasAccess) return;

    const selZoneKey = `selectedZone:${authUser}`;
    const selZone = loadJSON(selZoneKey, null);


    if (selZone) {
      setZones([{ points: selZone.points }]);
      localStorage.removeItem(selZoneKey);
    }
  }, [authUser, hasAccess]);

  // En pantallas pequeñas el mapa queda debajo del panel de filtros:
  // al pintar un itinerario se desplaza la vista hasta el mapa y su tarjeta.
  const mapColumnRef = useRef(null);
  useEffect(() => {
    if (!routeResult) return;
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    mapColumnRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [routeResult]);

// Hace reverse geocoding sobre una coordenada para mostrar información legible
// cuando el usuario pulsa sobre un punto libre del mapa
const getPointInfo = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );

    const data = await res.json();
    const address = data.address || {};

    const name =
      data.name ||
      address.road ||
      address.neighbourhood ||
      address.suburb ||
      address.city ||
      "Ubicación seleccionada";

    const postalCode = address.postcode || "";
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      "";

    const province = address.state_district || address.state || "";

    const addressText = [postalCode, city, province].filter(Boolean).join(" ");

    return {
      lat,
      lng,
      name,
      address: addressText || data.display_name || "Dirección no disponible",
    };
  } catch (error) {
    console.error("Error al obtener información del punto:", error);

    return {
      lat,
      lng,
      name: "Ubicación seleccionada",
      address: "Dirección no disponible",
    };
  }
};

 /**
  * Maneja los clics en el mapa:
    * si se está dibujando una zona, añade un nuevo punto al polígono temporal
    * si no, obtiene la información del punto pulsado y muestra su tarjeta
  */
  const handleMapClick = useCallback(
  async (lat, lng) => {
    if (isDrawingZone) {
      setTempZone((prev) => [...prev, { lat, lng }]);
    } else {
      const pointInfo = await getPointInfo(lat, lng);
      setSelectedPoint(pointInfo);
    }
  },
  [isDrawingZone]
);

  //muestra los horarios de un lugar
  const getPlaceHours = async (placeId) => {
  try {
    const data = await fetchApi(`/places/${placeId}/hours`, {}, true);
    
    return data;
  } catch (error) {
    console.error("Error al cargar horarios:", error);
    return [];
  }
};
  
//Guarda en estado la ruta o itinerario
  const handleRouteCalculated = (result, mode ) => {
    setRouteResult(result);
    setRouteMode(mode);
  };

  // Al pulsar place, se muestra en el mapa. Si se pulsa otra vez, se oculta.
  const visiblePlaces =
  selectedPlaceIds.length > 0
    ? places.filter((place) => selectedPlaceIds.includes(place.place_id))
    : [];


  // Pantalla carga mientras se valida el acceso del usuario
  if (accessLoading) {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Comprobando acceso...</p>
    </div>
  );
}

  // Si no tiene acceso, se muestra la pantalla de acceso denegado
  if (!hasAccess) {
    return <AccessDenied />;
  }
  if (!serviceType.includes("itinerarios")) {
    return <AccessDenied />;
  }

  const handleChangeCity = (city) => {
    // Invalida cualquier selección de itinerario que siga en curso.
    selectionRunRef.current += 1;
    setSelectedCity(city);
    setSelectedPlaceIds([]);
    setRouteResult(null);
    setItineraryStops([]);
    setItineraries([]);
    setItineraryLegs([]);
    setSelectedItineraryDetail(null);
  };

  const MODE_ICONS = {
    drive: Car,
    walk: Footprints,
    bike: Bike,
    drive_service: BusFront,
  };

  const MODE_COLORS = {
    drive: "text-verde-oscuro border-verde-oscuro",
    walk: "text-azul border-azul",
    bike: "text-orange-500 border-orange-500",
    drive_service: "text-purple-500 border-purple-500",
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      <Header />

      <div
        className="px-6 py-6 max-sm:px-4 max-sm:py-4"
        style={{
          background:
            "linear-gradient(180deg, hsl(218 70% 14% / 0.06) 0%, transparent 100%)",
        }}
      >
        <h2 className="text-xl font-bold text-foreground">Visualiza rutas y zonas urbanas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona una ubicación, calcula rutas y define zonas directamente sobre el mapa.
        </p>
      </div>

      <div className="px-6 pb-2 max-sm:px-4">
        {apiError && <p className="text-sm text-red-500">Error backend: {apiError}</p>}
      </div>

      <div className="flex-1 min-w-0 flex gap-4 p-4 overflow-hidden relative max-lg:flex-col max-sm:gap-3 max-sm:p-3">
        <aside className="w-[440px] shrink-0 bg-card border border-border rounded-lg p-5 flex flex-col gap-6 overflow-y-auto shadow-[var(--shadow-card)] max-lg:w-full max-sm:p-4">
        
          <RoutesPanel
            selectedCity={selectedCity}
            onChangeCity={handleChangeCity}
            allowedZones={allowedZones}
            itineraries={itineraries}
            itineraryLegs={itineraryLegs}
            itinerariesLoading={itinerariesLoading}
            itinerariesError={itinerariesError}
            onLoadItineraries={loadItineraries}
            onSelectItinerary={handleSelectItinerary}
            places={places}
            selectedPlaceIds={selectedPlaceIds}
            onChangeSelectedPlaceIds={setSelectedPlaceIds}
            onChangeRouteDate={setSelectedRouteDate}
            selectedItineraryId={selectedItineraryDetail?.itinerary_id}
          />
        </aside>

        <div
          ref={mapColumnRef}
          className="flex-1 min-h-0 min-w-0 flex flex-col gap-3 overflow-x-hidden overflow-y-auto max-lg:flex-none"
        >
          <div className="relative w-full min-w-0 flex-1 min-h-[220px] bg-card border border-border rounded-lg shadow-[var(--shadow-card)] overflow-hidden max-lg:flex-none max-lg:h-[420px] max-sm:h-[340px]">
          <MapView
            places={visiblePlaces}   
            routeResult={routeResult}
            routeMode={routeMode}       
            zones={zones}
            tempZone={tempZone}
            isDrawingZone={isDrawingZone}
            onMapClick={handleMapClick}
            onLoadPlaceHours={getPlaceHours}
            allowedZones={allowedZones} 
            itineraryStops={itineraryStops}
            selectedCity={selectedCity}
            selectedDate={selectedRouteDate}

          />
          {selectedPoint && !routeResult && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[60%] max-w-md bg-card border border-border rounded-xl shadow-lg p-4 flex items-center justify-between z-[100] max-sm:w-[calc(100%-1.5rem)]">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {selectedPoint.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedPoint.address}
              </span>
              <span className="text-xs text-azul mt-1">
                {selectedPoint.lat.toFixed(6)}, {selectedPoint.lng.toFixed(6)}
              </span>
            </div>

            <button
              onClick={() => {
                setSelectedPoint(null);
              }}
              className="ml-auto text-base text-muted-foreground hover:text-destructive transition-colors"
            >
              ✕
            </button>
          </div>
          )}
          </div>
        {/* tarjeta detalle itinerario horizontal */}
        {selectedItineraryDetail && (() => {
          const selectedLegs = itineraryLegs
            .filter((leg) => leg.itinerary_id === selectedItineraryDetail.itinerary_id)
            .sort((a, b) => (a.leg_seq || 0) - (b.leg_seq || 0));

            return (
          <div className="w-full min-w-0 shrink-0 bg-card border border-border rounded-2xl shadow-[var(--shadow-card)] p-3">

            {/* HEADER */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-verde-oscuro text-white flex items-center justify-center text-sm font-bold">
                    {selectedItineraryDetail.uiIndex || 1}
                  </div>

                  <h4 className="text-lg font-bold text-foreground">
                    Itinerario {selectedItineraryDetail.uiIndex || 1}
                  </h4>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>🕘 {(selectedItineraryDetail.start_datetime || "").slice(11, 16)} → {(selectedItineraryDetail.end_datetime || "").slice(11, 16)}</span>
                  <span>⏱ {Math.floor((selectedItineraryDetail.total_time_min || 0) / 60)} h {Math.round((selectedItineraryDetail.total_time_min || 0) % 60)} min</span>
                  <span>📍 {(selectedItineraryDetail.visit_order_names || "").split("→").filter(Boolean).length} paradas</span>
                  <span>{Math.round((selectedItineraryDetail.total_distance_m || 0) / 1000 * 10) / 10} km</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItineraryDetail(null)}
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                ✕
              </button>
            </div>

            {/* TIMELINE */}
            <div className="mt-3 flex w-full min-w-0 flex-wrap items-stretch gap-y-3">{(selectedItineraryDetail.visit_order_names || "")
                .split("→")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((stop, index) => {
                  const leg = selectedLegs[index];
                  const prevLeg = selectedLegs[index - 1];

                const travelMinutes =
                  prevLeg?.visit_end_time && leg?.arrival_time
                    ? Math.max(
                        0,
                        Math.round(
                          (new Date(leg.arrival_time) - new Date(prevLeg.visit_end_time)) / 60000
                        )
                      )
                    : 0;
                
                  const place = places.find(
                (p) => p.name?.toLowerCase().trim() === stop.toLowerCase().trim()
              );

              const mode = leg?.mode_selected || selectedItineraryDetail.modes_used?.[index - 1] || "bike";
              const Icon = MODE_ICONS[mode] || Bike;
              const colorClass = MODE_COLORS[mode] || "text-azul border-azul";

              return (
                <div key={index} className={`flex min-w-0 items-stretch max-sm:max-w-none max-sm:basis-full max-sm:flex-col ${index === 0 ? "max-w-[min(100%,220px)] flex-[1_1_180px]" : "max-w-[min(100%,284px)] flex-[1_1_244px]"}`}>

                  {index > 0 && (
                    <div className="flex w-16 shrink-0 flex-col items-center justify-center px-1 text-center text-[11px] leading-tight text-muted-foreground max-sm:w-full max-sm:flex-row max-sm:gap-2 max-sm:px-0 max-sm:py-1.5">
                      <Icon className={`mb-1 h-4 w-4 max-sm:mb-0 ${colorClass.split(" ")[0]}`} />
                      <span className={`mb-1 w-8 border-t-2 border-dotted max-sm:mb-0 ${colorClass.split(" ")[1]}`} />
                      <span>
                        {travelMinutes < 60
                          ? `${travelMinutes} min`
                          : `${Math.floor(travelMinutes / 60)} h ${travelMinutes % 60} min`}
                      </span>
                      <span>
                        {Math.round(((leg?.cost_distance_m || 0) / 1000) * 10) / 10} km
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1 rounded-xl border border-border bg-white p-2 shadow-sm">

                    <div className="relative">
                      <img
                        src={place?.img || "/placeholder-place.jpg"}
                        alt=""
                        className="h-12 w-full rounded-lg object-cover"
                      />

                      <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-verde-oscuro text-xs font-bold text-white">
                        {String.fromCharCode(65 + index)}
                      </div>
                    </div>

                    <p className="mt-2 line-clamp-2 break-words text-xs font-semibold text-foreground">
                      {stop}
                    </p>

                    <div className="mt-2 space-y-1.5 text-[11px]">

                      <div
                        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 ${
                          index === 0
                            ? "bg-green-50 text-verde-oscuro"
                            : "bg-blue-50 text-azul"
                        }`}
                      >
                        <span>🕘</span>
                        <span className="font-semibold">
                          Llegada {leg?.arrival_time?.slice(11, 16) || "--:--"}
                        </span>
                      </div>

                      <div className="flex flex-col items-center border-t border-border pt-1.5 text-center text-muted-foreground">
                        <span>👁 Tiempo de visita</span>
                        <span className="mt-0.5 font-semibold text-foreground">
                          {leg?.visit_start_time?.slice(11, 16) || "--:--"} - {leg?.visit_end_time?.slice(11, 16) || "--:--"}
                        </span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 ${
                          index === 0
                            ? "bg-green-50 text-verde-oscuro"
                            : "bg-blue-50 text-azul"
                        }`}
                      >
                        <span>🕘</span>
                        <span className="font-semibold">
                          Salida {leg?.visit_end_time?.slice(11, 16) || "--:--"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
                })}
              </div>

            {/* RESUMEN INFERIOR */}
            <div className="mt-1 grid grid-cols-2 gap-3 rounded-xl border border-verde-claro/40 bg-verde-claro/10 p-3 text-xs sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Hora de inicio</p>
                <p className="font-semibold">{(selectedItineraryDetail.start_datetime || "").slice(11, 16)}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Hora de fin</p>
                <p className="font-semibold">{(selectedItineraryDetail.end_datetime || "").slice(11, 16)}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Duración total</p>
                <p className="font-semibold">
                  {Math.floor((selectedItineraryDetail.total_time_min || 0) / 60)} h {Math.round((selectedItineraryDetail.total_time_min || 0) % 60)} min
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Distancia total</p>
                <p className="font-semibold">
                  {Math.round((selectedItineraryDetail.total_distance_m || 0) / 1000 * 10) / 10} km
                </p>
              </div>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  </div>
  );
};

export default HomePage;