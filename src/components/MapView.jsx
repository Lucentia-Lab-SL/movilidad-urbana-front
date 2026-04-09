import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderRouteLayer } from "@/components/routes/RouteLayer";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Formatea una hora tipo "07:30:00" → "7:30"
function formatHour(hour) {
  if (!hour) return "--";

  const [h, m] = hour.split(":");
  return `${parseInt(h, 10)}:${m}`;
}

// Convierte una hora "HH:mm:ss" a minutos totales
function timeToMinutes(hour) {
  if (!hour) return 0;
  const [h, m] = hour.split(":");
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

// Convierte minutos totales a formato "H:mm"
function minutesToHour(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

// Une tramos horarios que se solapan o son consecutivos
function mergeRanges(ranges) {
  if (!ranges.length) return [];

  const sorted = [...ranges].sort(
    (a, b) => timeToMinutes(a.open_time) - timeToMinutes(b.open_time)
  );

  const merged = [];
  // Inicializa con el primer tramo
  let current = {
    start: timeToMinutes(sorted[0].open_time),
    end: timeToMinutes(sorted[0].close_time),
  };

  for (let i = 1; i < sorted.length; i++) {
    const nextStart = timeToMinutes(sorted[i].open_time);
    const nextEnd = timeToMinutes(sorted[i].close_time);

    // Si se solapan o son continuos, los une
    if (nextStart <= current.end) {
      current.end = Math.max(current.end, nextEnd);
    } else {
      merged.push({
        start: minutesToHour(current.start),
        end: minutesToHour(current.end),
      });

      // Empieza un nuevo tramo
      current = {
        start: nextStart,
        end: nextEnd,
      };
    }
  }

  // Añade el último tramo
  merged.push({
    start: minutesToHour(current.start),
    end: minutesToHour(current.end),
  });

  return merged;
}

// Comprueba si un horario es válido para la fecha actual
function isDateInRange(validFrom, validTo) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Si no hay rango de fechas, se considera siempre válido
  if (!validFrom && !validTo) return true;

  const from = validFrom ? new Date(validFrom) : null;
  const to = validTo ? new Date(validTo) : null;

  // normaliza fechas
  if (from) from.setHours(0, 0, 0, 0);
  if (to) to.setHours(0, 0, 0, 0);

  // fuera de rango → no válido
  if (from && today < from) return false;
  if (to && today > to) return false;

  return true;
}

// Genera el HTML del horario SOLO para el día actual
function formatTodayPlaceHours(hours) {
  if (!hours || hours.length === 0) {
    return "<div>Sin horarios disponibles</div>";
  }

  const jsDay = new Date().getDay();
  const currentDow = jsDay === 0 ? 6 : jsDay - 1;

  // Filtra solo los horarios del día actual y válidos por fecha
  const todayHours = hours.filter(
    (h) => h.dow === currentDow && isDateInRange(h.valid_from, h.valid_to)
  );

  // no hay horarios para hoy
  if (todayHours.length === 0) {
    return "<div>Sin horarios disponibles</div>";
  }

  // marcados como cerrado
  if (todayHours.every((h) => h.closed)) {
    return "<div>Hoy: Cerrado</div>";
  }

  // Filtra solo los tramos abiertos válidos
  const ranges = todayHours
    .filter((h) => !h.closed && h.open_time && h.close_time)
    .map((h) => ({
      open_time: h.open_time,
      close_time: h.close_time,
    }));

  if (ranges.length === 0) {
    return "<div>Sin horarios disponibles</div>";
  }

  // Une tramos (mañana + tarde, etc.)
  const mergedRanges = mergeRanges(ranges);

  const text = mergedRanges
    .map((r) => `${formatHour(r.start)} - ${formatHour(r.end)}`)
    .join(", ");

  return `<div>Hoy: ${text}</div>`;
}

// Componente principal del mapa
const MapView = ({
  markers,
  places,
  routeResult,
  originText,
  destText,
  isUserLocation,
  liveUserPosition,
  isRouteActive,
  routeMode,
  zones,
  tempZone,
  isDrawingZone,
  onMapClick,
  onLoadPlaceHours,
}) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const layersRef = useRef(L.layerGroup());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Crea el mapa centrado inicialmente en Alicante
    const map = L.map(containerRef.current).setView([38.3452, -0.481], 13);

    // Añade la capa base de OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    layersRef.current.addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Detecta clicks en el mapa y los envía al componente padre
    const handler = (e) => onMapClick(e.latlng.lat, e.latlng.lng);
    map.on("click", handler);

    return () => {
      map.off("click", handler);
    };
  }, [onMapClick]);

  useEffect(() => {
    const group = layersRef.current;
    const map = mapRef.current;
  if (!group || !map) return;

    group.clearLayers();


    const hasActiveRoute = routeResult?.geometry?.length > 0;
    if (!hasActiveRoute) {
    // Marcadores creados manualmente por el usuario
    markers.forEach((marker, index) => {
      L.marker([marker.lat, marker.lng])
        .bindPopup(`Punto ${index + 1}`)
        .addTo(group);
    });

    // Lugares cargados desde backend
  places?.forEach((place) => {
    const marker = L.marker([place.lat, place.lon]).addTo(group);

    marker.bindPopup(`
      <div>
        <strong>${place.name || "Lugar"}</strong><br/>
        ${place.category || ""}<br/>
        <span style="color:#666;">Cargando horarios...</span>
      </div>
    `);

    marker.on("popupopen", async () => {
      const hours = await onLoadPlaceHours?.(place.place_id);
      const hoursHtml = formatTodayPlaceHours(hours);

      marker.setPopupContent(`
        <div>
          <strong>${place.name || "Lugar"}</strong><br/>
          ${place.category || ""}<br/><br/>
          <strong>Horarios:</strong>
          ${hoursHtml}
        </div>
      `);
    });
  });
}

  // Ruta calculada
  if (routeResult?.geometry?.length) {
    renderRouteLayer(
      group,
      map,
      routeResult,
      originText,
      destText,
      isUserLocation,
      liveUserPosition,
      isRouteActive,
      routeMode
    );
  }

  // Zonas guardadas
  zones.forEach((zone) => {
    L.polygon(
      zone.points.map((point) => [point.lat, point.lng]),
      {
        color: "#0B1B3A",
        fillColor: "#06B6D4",
        fillOpacity: 0.2,
        weight: 2,
      }
    ).addTo(group);
  });

  // Zona temporal mientras se está dibujando
  if (isDrawingZone && tempZone.length > 0) {
    L.polygon(
      tempZone.map((point) => [point.lat, point.lng]),
      {
        color: "#06B6D4",
        fillColor: "#06B6D4",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "6 4",
      }
    ).addTo(group);
  }
}, [markers, places, routeResult, originText, destText, isUserLocation, liveUserPosition, isRouteActive, routeMode, zones, tempZone, isDrawingZone, onLoadPlaceHours,]);
  return <div ref={containerRef} className="w-full h-full min-h-[400px] rounded-lg" />;
};

export default MapView;