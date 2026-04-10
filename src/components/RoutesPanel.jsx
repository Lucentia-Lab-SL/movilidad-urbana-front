import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Navigation, Clock, Route as RouteIcon, Car, Footprints, Bike, BusFront, Play, Square, Sparkles, X } from "lucide-react";
import { formatDuration } from "@/utils/formatDuration";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Velocidad media estimada (km/h) según el tipo de transporte
const SPEED_KMH = { car: 80, foot: 5, bike: 15 };

// Modulos de transporte disponibles (good y bus desahilitados por ahora)
const TRANSPORT_MODES = [
  { id: "good", label: "Mejor", icon: Sparkles, osrm: "", disabled: true },
  { id: "car", label: "Coche", icon: Car, osrm: "driving" },
  { id: "foot", label: "A pie", icon: Footprints, osrm: "walking" },
  { id: "bike", label: "Bicicleta", icon: Bike, osrm: "cycling"},
  { id: "bus", label: "Bus", icon: BusFront, osrm: "", disabled: true },
];

// Hook personalizado para buscar direcciones usando Nominatim
function useNominatimSearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef();

  // Realiza la búsqueda, limpia si resultado anterior o query es muy corto
  useEffect(() => {
    if (query.length < 3) { setResults([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        );
        const data = await res.json();
        setResults(data);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  return { results, loading };
}

// Nombre corto para mostrar en sugerencias (prioriza ciudad/pueblo/municipio)
function getShortPlaceName(place) {
  if (place.address?.city) return place.address.city;
  if (place.address?.town) return place.address.town;
  if (place.address?.village) return place.address.village;
  if (place.address?.municipality) return place.address.municipality;
  return place.display_name.split(",")[0]; // si no hay info, usa nombre completo pero recortado a la primera coma
}

// Componente input reutilizable para buscar y seleccionar direcciones
const AddressInput = ({ label, placeholder, value, onChange, onSelect, icon: Icon, allowCurrentLocation = false, onUseCurrentLocation, }) => {
  const [focused, setFocused] = useState(false); // input activo
  const { results, loading } = useNominatimSearch(value); // busca direccion
  const containerRef = useRef(null); 

  /*
  * Si click fuera del contenedor, cierra sugerencias
  * Limpia el evento al desmontar el componente 
  */
 useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /**
   * Input de dirección con etiqueta e icono, muestra sugerencias al escribir
   * Permite seleccionar una sugerencia o usar la ubicación actual (si se habilita)
   * Cierra las sugerencias al hacer clic fuera del componente  
   */
  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      
      {/* Etiqueta con el icono */}
      <label className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-azul" />{label}
      </label>
      
      {/* Input de texto para la dirección */}
      <input
        type="text" placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)}
        className="h-[44px] rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-accent transition-all duration-150"
      />

      {/* Lista desplegables de resultados */}
      {focused && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
          {/* Opción para usar la ubicación actual */}
          {allowCurrentLocation && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-accent/10 transition-colors duration-100 border-b border-border font-medium"
              onClick={() => {
                onUseCurrentLocation?.();
                setFocused(false);
              }}
            >
              Mi ubicación actual
            </button>
          )}

          {/* Mensaje Buscando... */}
          {value.length >= 3 && loading && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Buscando...</div>
          )}

          {/* Mensaje Sin resultados */}
          {value.length >= 3 && !loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</div>
          )}

          {/* Lista de resultados obtenidos */}
          {value.length >= 3 && results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors duration-100 border-b border-border last:border-b-0"
              onClick={() => {
                onSelect(r);
                setFocused(false);
              }}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Panel gestión de rutas: selección de origen/destino, modo transporte, cálculo y visualización de resultados
const RoutesPanel = ({ routeResult, onCalculate, isRouteActive, onStartRoute, onStopRoute }) => {
  const [originText, setOriginText] = useState("");
  const [originCoord, setOriginCoord] = useState(null);
  const [departureTime, setDepartureTime] = useState("");
  
  // Lista de destinos (permite múltiples)
  const [destinations, setDestinations] = useState([
  { text: "", coord: null }
  ]);
  const [mode, setMode] = useState("car");
  const [error, setError] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [isUserLocation, setIsUserLocation] = useState(false);  // si el origen es ubicación actual
  
  // Selección del origen 
  const handleOriginSelect = useCallback((r) => {
    setOriginText(getShortPlaceName(r));
    setOriginCoord({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
    setIsUserLocation(false); // desactiva ubicación actual
  }, []);

  // Cambio de texto en un destino (resetea coordenadas)
  const handleDestChange = useCallback((index, value) => {
    setDestinations((prev) =>
      prev.map((dest, i) =>
        i === index ? { ...dest, text: value, coord: null } : dest
      )
    );
  }, []);

  // Selección de una sugerencia para un destino específico
  const handleDestSelect = useCallback((index, r) => {
    setDestinations((prev) =>
      prev.map((dest, i) =>
        i === index
          ? {
              ...dest,
              text: getShortPlaceName(r),
              coord: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) },
            }
          : dest
      )
    );
  }, []);

  // Agrega un nuevo destino vacío al final de la lista
  const addDestination = useCallback(() => {
    setDestinations((prev) => [...prev, { text: "", coord: null }]);
  }, []);

  // Elimina un destino específico por su índice
  const removeDestination = useCallback((index) => {
    setDestinations((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Intercambia el origen actual con el primer destino de la lista
  const swapOriginAndFirstDestination = useCallback(() => {
  const firstDestination = destinations[0];

  // Si no hay destino o faltan coordenadas, no hace nada
  if (!firstDestination) return;
  if (!originCoord || !firstDestination.coord) return;

  // El primer destino pasa a ser el nuevo origen
  setOriginText(firstDestination.text);
  setOriginCoord(firstDestination.coord);

  // El origen anterior pasa a ocupar la primera posición de destinos
  setDestinations((prev) => [
    { text: originText, coord: originCoord },
    ...prev.slice(1),
  ]);
}, [destinations, originText, originCoord]);

// Usa la geolocalización del navegador para establecer el origen actual
  const handleUseCurrentLocation = useCallback(() => {
  if (!navigator.geolocation) {
    setError("La geolocalización no está disponible en este navegador");
    return;
  }

  setError("");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      // Guarda la ubicación actual como origen
      setOriginText("Mi ubicación actual");
      setOriginCoord({ lat: latitude, lng: longitude });
      setIsUserLocation(true);
    },
    () => {
      setError("No se pudo obtener tu ubicación");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}, [setError]);

  // Calcula la ruta usando OSRM API, solo para el primer destino por simplicidad
  const calculate = async () => {
    const validDestinations = destinations.filter((d) => d.coord);
    const firstDest = validDestinations[0];

    // Valida que exista un origen y al menos un destino seleccionado
    if (!originCoord || validDestinations.length === 0) {
      setError("Selecciona origen y al menos un destino de las sugerencias");
      return;
    }
    setError("");
    setCalculating(true);

    // Busca la configuración del modo de transporte seleccionado (car, foot, bike)
    const modeConfig = TRANSPORT_MODES.find((t) => t.id === mode);

    try {
      // Construye la Url para pedir la ruta a OSRM
      const url = `https://router.project-osrm.org/route/v1/${modeConfig.osrm}/${originCoord.lng},${originCoord.lat};${firstDest.coord.lng},${firstDest.coord.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      // Valida que la respuesta sea correcta y contenga rutas
      if (data.code !== "Ok" || !data.routes?.length) {
        setError("No se ha encontrado una ruta para ese modo");
        return;
      }

      const route = data.routes[0];
      // Calcula distancia en km y duración estimada en minutos según la velocidad media del modo de transporte
      const distKm = Math.round((route.distance / 1000) * 10) / 10;
      const durMin = Math.round((distKm / SPEED_KMH[mode]) * 60);
      const geometry = route.geometry.coordinates.map(
        (c) => [c[1], c[0]]
      );

      // Prepara el resultado con coordenadas, geometría, distancia y duración
      const result = { originCoord, destCoord: firstDest.coord, geometry, distance: distKm, duration: durMin };
      onCalculate(result, originText, firstDest.text, mode, departureTime, isUserLocation);
    } catch {
      setError("No se ha encontrado una ruta para ese modo");
    } finally {
      setCalculating(false);
    }
  };

  // Calcula Hora estimada de llegada a partir de la hora de salida y duración de la ruta
  const arrivalTime = (() => {
    if (!departureTime || !routeResult) return null;
    const [h, m] = departureTime.split(":").map(Number);
    const total = h * 60 + m + routeResult.duration;
    const ah = Math.floor(total / 60) % 24;
    const am = total % 60;
    return `${String(ah).padStart(2, "0")}:${String(am).padStart(2, "0")}`;
  })();

  // Panel de rutas
  return (
    <TooltipProvider>
      {/* Titulo */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
          <RouteIcon className="w-4 h-4 text-azul" />
          Rutas
        </h3>

        {/* Botones selección modo de transporte */}
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            {TRANSPORT_MODES.map((t) => {
              const IconComp = t.icon;
              const isActive = mode === t.id;
              const btn = (
                <button key={t.id} disabled={t.disabled}
                  onClick={() => !t.disabled && setMode(t.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-md text-[10px] font-medium transition-all duration-150 border ${
                    t.disabled ? "opacity-40 cursor-not-allowed border-border bg-secondary text-muted-foreground"
                    : isActive ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-card text-foreground hover:border-accent/50"
                  }`}
                >
                  <IconComp className="w-4 h-4" />{t.label}
                </button>
              );
              {/* Si el modo de transporte está deshabilitado, envuelve el botón en un tooltip explicativo */}
              if (t.disabled) {
                return (
                  <Tooltip key={t.id}>
                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                    <TooltipContent><p className="text-xs">Disponible en una fase futura</p></TooltipContent>
                  </Tooltip>
                );
              }
              return btn;
            })}
          </div>
        </div>

        {/* Campo origen y botón para intercambiar con el primer destino */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <AddressInput
              label="Origen"
              placeholder="Introduce una dirección o lugar"
              value={originText}
              onChange={(v) => {
                setOriginText(v);
                setOriginCoord(null);
                setIsUserLocation(false);
              }}
              onSelect={handleOriginSelect}
              onUseCurrentLocation={handleUseCurrentLocation}
              allowCurrentLocation={true}
              icon={MapPin}
            />
          </div>

          <button
            type="button"
            onClick={swapOriginAndFirstDestination}
            className="h-[44px] w-[44px] mt-5 rounded-md border border-border bg-card hover:bg-secondary text-foreground flex items-center justify-center transition-colors duration-150"
            title="Intercambiar origen y destino principal"
          >
            ⇅
          </button>
        </div>

        {/* Lista de destinos */}
        {destinations.map((dest, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <AddressInput
                label={index === 0 ? "Destino" : `Destino ${index + 1}`}
                placeholder="Introduce una dirección o lugar"
                value={dest.text}
                onChange={(value) => handleDestChange(index, value)}
                onSelect={(result) => handleDestSelect(index, result)}
                icon={Navigation}
              />
            </div>

            {/*  1ª destino no tiene botón de eliminar, pero los siguientes sí */}
            {index === 0 ? (
              <div className="h-[44px] w-[44px] shrink-0" />
            ) : (
            <button
              type="button"
              onClick={() => removeDestination(index)}
              className="h-[44px] w-[44px] mt-5 shrink-0 rounded-md border border-border bg-card hover:bg-destructive/10 text-destructive flex items-center justify-center transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      ))}

      {/* Añadir nuevo destino */}  
      <button
        type="button"
        onClick={addDestination}
        className="h-[40px] px-4 rounded-full border border-border bg-card text-foreground hover:bg-azul-claro transition-colors duration-150 flex items-center justify-center gap-2 text-sm font-medium self-start"
      >
        <span className="text-lg leading-none">+</span>
        <span>Añadir destino</span>
      </button>
        
      {/* Selección de hora de salida (opcional) y cálculo de ruta */}  
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-azul" />
          Hora de salida <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)}
          className="h-[44px] rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-accent transition-all duration-150" />
      </div>

      {/* Muestra un mensaje de error si falta información o falla el cálculo */}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Boton calcular ruta (cambiaremos mas a delane) */}
      <button onClick={calculate} disabled={calculating}
        className="h-[44px] rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {calculating ? <span className="animate-pulse">Calculando...</span> : <><RouteIcon className="w-4 h-4" />Calcular ruta</>}
      </button>

      {/* Panel de resultados de la ruta calculada, muestra distancia, duración y hora estimada de llegada, además de botones para iniciar o finalizar la ruta si ya está activa */}
      {routeResult && (
        <div className={`rounded-lg p-4 flex flex-col gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ${
          isRouteActive
            ? "bg-primary/10 border-2 border-primary shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
            : "bg-accent/5 border border-accent/20"
        }`}
        >
          {/* Cabecera del panel: estado de la ruta */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
              {isRouteActive ? "🟢 Ruta en curso" : "Información de la ruta"}
            </h4>
            {isRouteActive && (
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full animate-pulse">
                ACTIVA
              </span>
            )}
          </div>

          {/* Distancia total de la ruta */}
          <div className="flex items-center gap-2 text-sm text-foreground">
            <MapPin className="w-4 h-4 text-accent shrink-0" />
            <span>Distancia: <strong>{routeResult.distance} km</strong></span>
          </div>

          {/* Duración estimada del trayecto */}
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Clock className="w-4 h-4 text-accent shrink-0" />
            <span>Duración estimada: <strong>{formatDuration(routeResult.duration)}</strong></span>
          </div>
          
          {/* Hora estimada de llegada, si se indicó hora de salida */}
          {arrivalTime && (
            <div className="flex items-center gap-2 text-sm text-foreground pt-1 border-t border-accent/10">
              <Navigation className="w-4 h-4 text-accent shrink-0" />
              <span>Hora estimada de llegada: <strong>{arrivalTime}</strong></span>
            </div>
          )}

          {/* Iniciar / finalizar ruta */}
          {!isRouteActive ? (
            <button
              onClick={onStartRoute}
                className="h-[44px] rounded-md bg-verde-oscuro text-white text-sm font-medium hover:bg-verde transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"              >
              <Play className="w-4 h-4" />
              Iniciar ruta
            </button>
          ) : (
            <button
              onClick={onStopRoute}
              className="mt-2 h-[44px] rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-all duration-150 flex items-center justify-center gap-2"
            >
              <Square className="w-4 h-4" />
              Finalizar ruta
            </button>
          )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default RoutesPanel;