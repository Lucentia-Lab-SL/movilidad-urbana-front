import { useState, useRef, useCallback } from "react";

/**
 * Gestiona la ubicación del usuario en tiempo real.
 *
 * Se encarga de:
 * - Obtener la ubicación actual
 * - Escuchar cambios con watchPosition
 * - Manejar errores
 * - Iniciar / detener seguimiento
 */
export function useUserLocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  const watchIdRef = useRef(null);

  /**
   * Inicia el seguimiento en tiempo real
   */
  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setError("La geolocalización no está disponible");
      return;
    }

    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        setPosition({
          lat: latitude,
          lng: longitude,
          accuracy,
        });
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
  }, []);

  /**
   * Detiene el seguimiento
   */
  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setPosition(null);
  }, []);

  return { position, error, start, stop };
}