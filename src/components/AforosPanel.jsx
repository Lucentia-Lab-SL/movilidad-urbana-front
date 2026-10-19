import { MapPin, CalendarDays, Clock, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import AforosMap from "@/components/AforosMap";
import { useApi } from "@/hooks/useApi";

const getAforoClass = (personas) => {
  if (personas > 10000) return "bg-red-950 text-white";
  if (personas > 5000) return "bg-red-700 text-white";
  if (personas > 2000) return "bg-red-500 text-white";
  if (personas > 1000) return "bg-orange-400 text-white";
  if (personas > 500) return "bg-orange-300 text-orange-950";
  if (personas > 200) return "bg-yellow-300 text-yellow-950";
  return "bg-yellow-100 text-yellow-950";
};

const districtLabel = (properties = {}) => {
  const name =
    properties.NOMBRE ||
    properties.nombre ||
    properties.NAME ||
    properties.name ||
    properties.DISTRITO;
  return name || properties.ID || "—";
};

const ALL_CITIES = [
  { value: "alicante", label: "Alicante" },
  { value: "valencia", label: "Valencia" },
  { value: "elche", label: "Elche" },
  { value: "peniscola", label: "Peñíscola" },
];

const normalizeCity = (text = "") =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const citiesFromAccess = (access) => {
  const distritos = access?.allowedDistritos || [];
  const zones = access?.allowedZones || [];
  const source = distritos.length > 0 ? distritos : zones;

  if (source.includes("*")) return ALL_CITIES;

  return ALL_CITIES.filter((city) =>
    source.some((zone) => {
      const normalized = normalizeCity(zone);
      return normalized === normalizeCity(city.value) || normalized === normalizeCity(city.label);
    })
  );
};

// Estados de los filtros seleccionados (ciudad, fecha, hora) y el botón para aplicar los filtros y mostrar el mapa con los datos correspondientes
const AforosPanel = () => {
  const { fetchApi } = useApi();
  const [availableCities, setAvailableCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedHour, setSelectedHour] = useState("");

  // Estado para guardar filtros aplicados y mostrar el mapa solo cuando se hayan aplicado los filtros
  const [appliedFilters, setAppliedFilters] = useState({
    city: "",
    date: "",
    hour: "",
  });
  const [predictionRows, setPredictionRows] = useState([]);

  const handleDistrictsLoaded = useCallback((geojson) => {
    const features = geojson?.features || [];
    const rows = features
      .map((feature, index) => {
        const properties = feature.properties || {};
        const personas = Number(properties.personas_estimadas) || 0;
        const distrito = String(districtLabel(properties));
        return {
          id: `${distrito}-${index}`,
          distrito,
          personas,
        };
      })
      .sort((a, b) => b.personas - a.personas || a.distrito.localeCompare(b.distrito, "es"));

    setPredictionRows(rows);
  }, []);

  useEffect(() => {
  const loadAccess = async () => {
    try {
      const access = await fetchApi("/me/access", {}, true);
      setAvailableCities(citiesFromAccess(access));
    } catch (error) {
      console.error("Error cargando ciudades de aforos:", error);
      setAvailableCities([]);
    }
  };

  loadAccess();
}, [fetchApi]);

  // boton "ver aforos"
  const handleViewAforos = () => {
    if (!selectedCity || !selectedDate || !selectedHour) {
      alert("Selecciona destino, fecha y hora antes de ver los aforos.");
      return;
    }

    // Aplicamos filtros y mostramos en el mapa
    setPredictionRows([]);
    setAppliedFilters({
      city: selectedCity,
      date: selectedDate,
      hour: selectedHour,
    });
  };

  return (
    <div className="flex flex-col gap-5 text-foreground">
      {/* TÍTULO */}
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-[#0E448F]" />
        <h2 className="text-xl font-bold text-[#0E448F]">
          Aforos en Tiempo Real
        </h2>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* CIUDAD */}
        <div className="rounded-xl bg-[#9ADE88]/30 border border-[#5B8B6C]/40 h-[48px] px-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#5B8B6C]" />
          <div className="flex-1 flex flex-col justify-center">
            <label className="text-xs text-[#5B8B6C]">Destino</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-transparent font-medium text-sm outline-none cursor-pointer text-[#0E448F]"
            >
              <option value="">Selecciona destino</option>
              {availableCities.map((city) => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* FECHA */}
        <div className="rounded-xl bg-[#9ADE88]/30 border border-[#5B8B6C]/40 h-[48px] px-3 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#5B8B6C]" />
          <div className="flex-1 flex flex-col justify-center">
            <label className="text-xs text-[#5B8B6C]">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-transparent font-medium text-sm outline-none cursor-pointer text-[#0E448F]"
            />
          </div>
        </div>

        {/* HORA */}
        <div className="rounded-xl bg-[#9ADE88]/30 border border-[#5B8B6C]/40 h-[48px] px-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#5B8B6C]" />
          <div className="flex-1 flex flex-col justify-center">
            <label className="text-xs text-[#5B8B6C]">Hora</label>
            <input
              type="time"
              value={selectedHour}
              onChange={(e) => setSelectedHour(e.target.value)}
              className="w-full bg-transparent font-medium text-sm outline-none cursor-pointer text-[#0E448F]"
            />
          </div>
        </div>

        {/* BOTÓN VER AFOROS */}
        <button
          onClick={handleViewAforos}
          className="h-[48px] px-4 rounded-xl bg-[#1A6BAB] hover:bg-[#0E448F] text-white text-sm font-semibold shadow-sm transition-colors"
        >
          Ver aforos
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        {/* MAPA */}
        <div className="min-h-[320px] rounded-2xl border border-[#D6E5DB] shadow-md bg-[#F3F8F4] relative overflow-hidden">
          <AforosMap
            city={appliedFilters.city}
            date={appliedFilters.date}
            hour={appliedFilters.hour}
            onLoaded={handleDistrictsLoaded}
          />
        </div>

        {/* LEYENDA + ALERTA */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[#9ADE88]/60 bg-[#DFF2D4] p-4 shadow-md">
            <h3 className="text-sm font-semibold mb-3 text-[#0E448F]">
              Nivel de Aforo (personas)
            </h3>

            <div className="flex flex-col gap-2 text-xs">
              {[
                ["bg-yellow-100", "0 – 200"],
                ["bg-yellow-300", "200 – 500"],
                ["bg-orange-300", "500 – 1000"],
                ["bg-orange-400", "1000 – 2000"],
                ["bg-red-500", "2000 – 5000"],
                ["bg-red-700", "5000 – 10000"],
                ["bg-red-950", "10000+"],
              ].map(([color, label]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full ${color}`} />
                  <span className="text-slate-700">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {predictionRows.some((row) => row.personas >= 2000) && (
            <div className="rounded-2xl border-l-4 border-yellow-500 bg-yellow-100/70 p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <h3 className="text-sm font-semibold text-yellow-800">
                  Zonas con alta afluencia
                </h3>
              </div>

              <p className="text-sm text-yellow-800/80">
                Existen zonas con niveles de aforo altos. Se recomienda extremar precauciones.
              </p>
            </div>
          )}
        </div>
      </div>

      <AforoTable
        rows={predictionRows}
        hour={appliedFilters.hour}
        searched={Boolean(appliedFilters.city)}
      />

      <p className="text-xs text-slate-500">
        Los datos son estimaciones y pueden variar. Última actualización general: 10/10/2026
      </p>
    </div>
  );
};

const AforoTable = ({ rows, hour, searched }) => (
  <div className="rounded-2xl border border-[#9ADE88]/60 bg-[#EEF8E9] overflow-hidden shadow-md">
    <div className="px-4 py-3 border-b border-[#9ADE88]/60 bg-[#DFF2D4] flex items-center gap-2">
      <TrendingUp className="w-4 h-4 text-[#1A6BAB]" />
      <h3 className="text-sm font-semibold text-[#0E448F]">Predicción de aforos</h3>
    </div>

    <div className="max-h-[420px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-[#CDEAC0] text-[#0E448F] sticky top-0">
          <tr>
            <th className="text-left px-4 py-3">Distrito</th>
            <th className="text-left px-4 py-3">Nivel de aforo</th>
            <th className="text-left px-4 py-3">Hora</th>
          </tr>
        </thead>

        <tbody>
          {!searched && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-slate-500">
                Selecciona destino, fecha y hora para ver la predicción.
              </td>
            </tr>
          )}

          {searched && rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-slate-500">
                No hay distritos para esa selección.
              </td>
            </tr>
          )}

          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-t border-[#D6E5DB]/70 hover:bg-[#9ADE88]/10 transition-colors"
            >
              <td className="px-4 py-3">{row.distrito}</td>
              <td className="px-4 py-3">
                <span className={`inline-block min-w-16 px-3 py-1 rounded-md text-xs font-semibold text-center ${getAforoClass(row.personas)}`}>
                  {Math.round(row.personas).toLocaleString("es-ES")}
                </span>
              </td>
              <td className="px-4 py-3">{hour}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AforosPanel;