export interface SavedRoute {
  id: string;
  origen: { label: string; lat: number; lng: number };
  destino: { label: string; lat: number; lng: number };
  modo: "coche" | "apie" | "bici";
  distanciaKm: number;
  duracionMin: number;
  salidaHora?: string;
  llegadaHora?: string;
  geometry: [number, number][];
  fechaISO: string;
}

export interface SavedZone {
  id: string;
  nombre: string;
  points: { lat: number; lng: number }[];
  fechaISO: string;
}
