import L from "leaflet";
import { renderLiveUserMarker } from "../live-user/LiveUserMarker";
import { routeStyles } from "../../utils/routeStyles";
/**
 * Icono verde para origen de la ruta.
 */
const originIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/**
 * Icono rojo para el destino de la ruta.
 */
const destIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/**
 * Dibuja una ruta en el mapa.
 *
 * Se encarga de:
 * - Dibujar marcador de origen
 * - Dibujar marcador de destino
 * - Dibujar la polyline de la ruta
 * - Centrar o ajustar el mapa
 */
export function renderRouteLayer(
  group,
  map,
  routeResult,
  originText,
  destText,
  isUserLocation,
  liveUserPosition,
  isRouteActive,
  mode
) {
  // Si no hay grupo, mapa o ruta, no hace nada
  if (!group || !map || !routeResult) return;

  /**
   * Texto que se mostrará en el popup del origen.
   */
  const originLabel = isUserLocation ? "Estás aquí" : (originText || "Origen");

  /**
   * Texto que se mostrará en el popup del destino.
   */
  const destinationLabel = destText || "Destino";

  /**
   * Si la ruta está activa y existe una posición en vivo,
   * el origen será la ubicación actual del usuario.
   * Si no, se usa el origen calculado inicialmente.
   */
  const currentOrigin =
    isRouteActive && liveUserPosition
      ? liveUserPosition
      : routeResult.originCoord;

  /**
   * Si la ruta está activa con ubicación en vivo,
   * se pinta el usuario en vez del marcador clásico de origen.
   */
  if (isRouteActive && liveUserPosition) {
    renderLiveUserMarker(group, liveUserPosition);
  } else {
    L.marker([currentOrigin.lat, currentOrigin.lng], { icon: originIcon })
      .bindPopup(originLabel)
      .addTo(group);
  }

  /**
   * Marker del destino.
   */
  L.marker([routeResult.destCoord.lat, routeResult.destCoord.lng], { icon: destIcon })
    .bindPopup(destinationLabel)
    .addTo(group);

  /**
   * Estilo visual de la ruta según el modo seleccionado.
   */
  const style = routeStyles[mode] || routeStyles.car;

  /**
   * Línea principal de la ruta.
   */
  const polyline = L.polyline(routeResult.geometry, style).addTo(group);

  /**
   * Ajuste automático de la vista:
   * - si la ruta está activa, centra el mapa en el usuario
   * - si no, ajusta el zoom para mostrar toda la ruta
   */
  if (isRouteActive && liveUserPosition) {
    map.setView([liveUserPosition.lat, liveUserPosition.lng], 16);
  } else {
    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
  }
}