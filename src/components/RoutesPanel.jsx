import { useState } from "react";
import { Route as RouteIcon, Car, Footprints, Bike, BusFront, Sparkles, Bookmark } from "lucide-react";

// Modulos de transporte disponibles 
// automático: busca los mejores itinerarios sin filtrar por transporte.
const TRANSPORT_MODES = [
  { id: "good", label: "Mejor", icon: Sparkles }, 
  { id: "drive", label: "Coche", icon: Car },
  { id: "walk", label: "A pie", icon: Footprints },
  { id: "bike", label: "Bicicleta", icon: Bike},
  { id: "drive_service", label: "Bus", icon: BusFront },
];

// Traducción de los ids de modos a textos para mostrar en UI
const MODE_LABELS = {
  walk: "A pie",
  drive: "Coche",
  bike: "Bicicleta",
  drive_service: "Bus",
};

/**
 * Panel lateral de itinerarios:
  * permite elegir modos, fecha y hora
  * lanza la búsqueda de itinerarios
  * muestra el ranking o el detalle del itinerario seleccionado
 */
const RoutesPanel = ({ selectedCity, onChangeCity, itineraries, itineraryLegs, itinerariesLoading, itinerariesError, onLoadItineraries, onSelectItinerary }) => {
  const [modes, setModes] = useState(["good"]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [selectedItineraryDetail, setSelectedItineraryDetail] = useState(null);

  // Selección de modos de transporte.
  const toggleMode = (modeId) => {
    setModes((prev) => {
      // Si pulsa "good, desactivan los otros
      if (modeId === "good") {
        return ["good"];
      }

      // Si pulsa un modo normal y estaba "good", lo quita
      const withoutGood = prev.filter((m) => m !== "good");
      
      // Si el modo ya estaba activo, lo desactiva.
      if (withoutGood.includes(modeId)) {
        const updated = withoutGood.filter((m) => m !== modeId);
        return updated.length > 0 ? updated : withoutGood;
      }

      return [...withoutGood, modeId];
    });
  };

  // Extrae las paradas del itinerario a partir del string "A → B → C"
  const getItineraryStops = (itinerary) => {
  return (itinerary?.visit_order_names || "")
    .split("→")
    .map((item) => item.trim())
    .filter(Boolean);
  };

  // Obtiene y ordena los tramos (legs) de un itinerario concreto
  const getLegsForItinerary = (itineraryId) => {
  return (itineraryLegs || [])
    .filter((leg) => leg.itinerary_id === itineraryId)
    .sort((a, b) => (a.leg_seq || 0) - (b.leg_seq || 0));
  };

  // Formatea fechas tipo ISO a formato HH:mm para mostrar en UI
  const formatLegTime = (value) => {
    if (!value) return "--:--";

    const text = String(value);

    if (text.includes("T")) {
      return text.slice(11, 16);
    }

    if (text.includes(" ")) {
      return text.slice(11, 16);
    }

    return text.slice(0, 5);
  };

  // Formatea duración en segundos a "X h Y min"
  const formatDuration = (seconds) => {
    const totalMinutes = Math.round((seconds || 0) / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0
      ? `${hours} h ${minutes > 0 ? `${minutes} min` : ""}`
      : `${minutes} min`;
  };

  //ordenar ranking: duración total de menor a mayor
  const sortedItineraries = [...(itineraries || [])].sort(
    (a, b) => (a.total_time_min || 999999) - (b.total_time_min || 999999)
  );

  // itinerario seleccionado, muestra los detalles
  const detailLegs = selectedItineraryDetail
    ? getLegsForItinerary(selectedItineraryDetail.itinerary_id)
    : [];

  // Búsqueda solo si hay fecha y hora
  // No hay: botón desactivado
  const handleSearchItineraries = () => {
    if (!date || !time) {
      return;
    }

    onLoadItineraries(date, time, modes);
  };

    // Panel de itinerarios: filtros, hora de salida y ranking de resultados
    return (
      <>
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
              const isActive = modes.includes(t.id);

              return (
                <button key={t.id} type="button"
                  onClick={() => toggleMode(t.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-md text-[10px] font-medium transition-all duration-150 border ${
                    isActive ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-card text-foreground hover:border-accent/50"
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
              
        {/* DESTINO */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Destino
          </label>
          <select
            value={selectedCity}
            onChange={(e) => onChangeCity(e.target.value)}
            className="h-[44px] rounded-md border border-input bg-card pl-5 pr-1 text-sm text-foreground"          
          >
            <option value="alicante">Alicante</option>
            <option value="elche">Elche</option>
            <option value="valencia">Valencia</option>
            <option value="peñiscola">Peñíscola</option>          
          </select>
        </div>
      
        {/* Fecha */}
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-[44px] rounded-md border border-input bg-card px-3 text-sm text-foreground"
            />
          </div>
          

            {/* Hora */}
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Hora
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-[44px] rounded-md border border-input bg-card px-3 text-sm text-foreground"
              />
            </div>
          </div>

          {/* BOTON BUSQUEDA */}
          <button
            onClick={handleSearchItineraries}
            disabled={itinerariesLoading || !date || !time}
            className="h-[44px] rounded-md bg-verde text-white text-sm font-medium hover:bg-verde-oscuro transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {itinerariesLoading ? "Buscando..." : "Buscar itinerarios"}
          </button>

        
          {/* ITINERARIO SELECCIONADO */}
          {selectedItineraryDetail ? (
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4 shadow-sm">

              {/* HEADER */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 min-w-[28px] min-h-[28px] rounded-full flex items-center justify-center text-xs font-semibold text-white bg-verde-oscuro">
                    A
                  </div>

                  <div>
                    {/* uiIndex para que el título del detalle coincida con el número del ranking */}
                    <h4 className="text-base font-semibold text-foreground leading-tight">
                      Itinerario {selectedItineraryDetail.uiIndex || 1}
                    </h4>

                    <div className="text-xs text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        🕘 {(selectedItineraryDetail.start_datetime || "").slice(11, 16) || "--:--"} → {(selectedItineraryDetail.end_datetime || "").slice(11, 16) || "--:--"}
                      </span>
                      <span>
                        ⏱ {Math.floor((selectedItineraryDetail.total_time_min || 0) / 60)} h 
                        {Math.round((selectedItineraryDetail.total_time_min || 0) % 60)} min
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        {Array.isArray(selectedItineraryDetail.modes_used) &&
                          selectedItineraryDetail.modes_used.length > 0
                            ? [...new Set(selectedItineraryDetail.modes_used)]
                                .map((m) => MODE_LABELS[m] || m)
                                .join(", ")
                            : "Sin modo"}
                      </span>
                      <span>
                        {getItineraryStops(selectedItineraryDetail).length} paradas
                      </span>
                      <span>
                        {Math.round((selectedItineraryDetail.total_distance_m || 0) / 1000 * 10) / 10} km
                      </span>
                    </div>
                  </div>  
                </div>

                 {/* Acciones del panel de detalle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition"
                  >
                    <Bookmark className="w-4 h-4 text-foreground" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedItineraryDetail(null)}
                    className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* LISTA DE PARADAS */}
              <div className="flex flex-col gap-4 pt-3 border-t border-border">
                {getItineraryStops(selectedItineraryDetail).map((stop, index) => (
                  <div key={index} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-5 h-5 min-w-[20px] min-h-[20px] rounded-full flex items-center justify-center text-[10px] font-semibold text-white mt-0.5 bg-azul">
                        {String.fromCharCode(65 + index)}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {stop}
                        </p>

                        <p className="text-xs text-muted-foreground mt-1">
                          ⏱ {formatDuration(detailLegs[index]?.cost_time_s)}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-foreground whitespace-nowrap">
                      {formatLegTime(detailLegs[index]?.visit_start_time)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (

            /* Ranking de itinerarios disponibles ordenados por duración */
            <div className="rounded-lg p-4 border border-border bg-card flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase">Ranking de itinerarios</h4>

              <div className="max-h-[400px] overflow-y-auto flex flex-col gap-2">

                {itineraries?.length === 0 && !itinerariesLoading && (
                  <p className="text-sm text-muted-foreground">
                    No hay itinerarios cargados
                  </p>
                )}

                {sortedItineraries.map((it, index) => {                
                  const totalMinutes = Math.round(it.total_time_min || 0);
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;

                  const durationText =
                    hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;

                  const distanceKm = Math.round((it.total_distance_m || 0) / 1000 * 10) / 10;

                  const stopsCount = getItineraryStops(it).length;

                  // Se muestran todos los modos usados en el itinerario sin repetir valores.
                  const modesText =
                    Array.isArray(it.modes_used) && it.modes_used.length > 0
                      ? [...new Set(it.modes_used)]
                        .map((m) => MODE_LABELS[m] || m)
                        .join(", ")
                      : "Sin modo";

                  return (
                    <button
                      key={it.itinerary_id || index}
                      type="button"
                      onClick={() => {
                        setSelectedItineraryDetail({
                          ...it,
                          uiIndex: index + 1
                        });
                        onSelectItinerary?.(it);
                      }}
                      className={`w-full text-left rounded-xl border p-3 transition-all ${
                        index === 0
                          ? "border-verde-oscuro bg-verde-claro/20"
                          : "border-border bg-card hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Número visual del ranking */}
                        <div
                          className={`w-7 h-7 min-w-[28px] min-h-[28px] rounded-full flex items-center justify-center text-xs font-semibold text-white mt-0.5 ${
                            index === 0 ? "bg-verde-oscuro" : "bg-azul"
                          }`}
                        >
                          {index + 1}
                        </div>

                        {/* Resumen del itinerario */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h5 className="text-sm font-semibold text-foreground truncate">
                                Itinerario {index + 1}
                              </h5>

                              <div className="text-xs text-muted-foreground mt-1">
                                {(it.start_datetime || "").slice(11, 16) || "--:--"} → {(it.end_datetime || "").slice(11, 16) || "--:--"}
                              </div>

                              <div className="text-xs text-muted-foreground mt-1">
                                {durationText}
                              </div>

                              <div className="text-xs text-muted-foreground mt-1">
                                {modesText} · {stopsCount} paradas · {distanceKm} km
                              </div>
                            </div>

                            <div className="text-muted-foreground text-lg leading-none shrink-0">
                              ›
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </>  
      );
    };

export default RoutesPanel;