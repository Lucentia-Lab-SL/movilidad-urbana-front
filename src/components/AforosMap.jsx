import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useApi } from "@/hooks/useApi";

/**
 * Ejemplo nº de personas por distrito (ID del GeoJSON)
 * Luego cambiar por datos de BD
 */
const mockAforos = {
  "03002_AM": 1250,
  "03005_AM": 420,
  "03014": 980,
};

// Convertimos nº de personas → color
const getColor = (personas) => {
  if (personas > 1000) return "#7f0000";
  if (personas > 500) return "#bd0026";
  if (personas > 200) return "#f03b20";
  if (personas > 100) return "#fd8d3c";
  if (personas > 50) return "#feb24c";
  if (personas > 20) return "#fed976";
  if (personas > 10) return "#ffeda0";
  return "#ffffcc";
};

const AforosMap = ({ city }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const { fetchApi } = useApi();

  // 1. Crear mapa 
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // cenralizamos en españa
    mapInstanceRef.current = L.map(mapRef.current).setView([40.4168, -3.7038], 5);

    // fonfo (openStreetMap )
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "Leaflet | © OpenStreetMap",
    }).addTo(mapInstanceRef.current);
  }, []);

  // 2. Cargar GeoJSON y pintar distritos cada vez que cambie la ciudad
  useEffect(() => {
    const loadDistricts = async () => {
        if (!city) return;
        if (!mapInstanceRef.current) return;

      // llamada a api para cargar geojson de distritos (según ciudad)
      const geojson = await fetchApi(`/distritos?city=${city}`);

      //elimina capa anterior (si existe) antes de añadir la nueva
      if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current.remove();
      }

      //crear capa distritos y pintar cada uno
      geoJsonLayerRef.current = L.geoJSON(geojson, {
        style: (feature) => {
          const id = feature.properties.ID;
          const personas = mockAforos[id] || 0;

          return {
            fillColor: getColor(personas),
            weight: 1,
            color: "#ffffff",
            fillOpacity: 0.7,
          };
        },
        // popup con info del distrito
        onEachFeature: (feature, layer) => {
          const id = feature.properties.ID;
          const personas = mockAforos[id] || 0;

          layer.bindPopup(`
            <strong>Distrito ${id}</strong><br/>
            Personas aprox.: ${personas}
          `);
        },
      }).addTo(mapInstanceRef.current);

      // zoom automático para ajustar a los distritos
      const bounds = geoJsonLayerRef.current.getBounds();

      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    };

    loadDistricts();
  }, [city, fetchApi]);

  return <div ref={mapRef} className="w-full h-full rounded-xl" />;
};

export default AforosMap;