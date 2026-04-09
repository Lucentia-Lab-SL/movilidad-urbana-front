/**
 * Configuración de estilos para las rutas del mapa.
 * 
 * Define:
 * - Colores
 * - Grosor de línea
 * - Tipo de línea
 * 
 * Se usa para diferenciar los modos de transporte:
 * - walk → a pie
 * - car → coche
 * - transit → transporte público
 */

export const routeStyles = {
  foot: {
    color: "#3B82F6",
    weight: 4,
    dashArray: "4 6", 
    opacity: 0.9,
  },

  car: {
    color: "#06B6D4",
    weight: 5,
    opacity: 0.9,
  },
    bike: {
    color: "#10B981",
    weight: 5,
    opacity: 0.9,
  },
  bus: {
    color: "#F59E0B",
    weight: 5,
    dashArray: "6 6",
    opacity: 0.9,
  },
  train: {
    color: "#EF4444",
    weight: 5,
    dashArray: "8 6",
    opacity: 0.9,
  },
};