export const predefinedRoutes = [
  {
    id: "alc-centro",
    nombre: "Ruta Alicante Centro",
    provincia: "Alicante",
    localidad: "Alicante",
    descripcion: "Recorrido por el centro histórico de Alicante, desde la Estación hasta el Puerto.",
    origen: { label: "Estación de Alicante", lat: 38.3453, lng: -0.4907 },
    destino: { label: "Puerto de Alicante", lat: 38.3380, lng: -0.4810 },
  },
  {
    id: "alc-playa",
    nombre: "Ruta Alicante Playa",
    provincia: "Alicante",
    localidad: "Alicante",
    descripcion: "Paseo costero desde la Playa del Postiguet hasta la Playa de San Juan.",
    origen: { label: "Playa del Postiguet", lat: 38.3440, lng: -0.4760 },
    destino: { label: "Playa de San Juan", lat: 38.3710, lng: -0.4100 },
  },
  {
    id: "alc-elche",
    nombre: "Ruta Alicante – Elche",
    provincia: "Alicante",
    localidad: "Elche",
    descripcion: "Conexión entre Alicante centro y el Palmeral de Elche.",
    origen: { label: "Plaza de los Luceros, Alicante", lat: 38.3460, lng: -0.4920 },
    destino: { label: "Palmeral de Elche", lat: 38.2660, lng: -0.6980 },
  },
  {
    id: "vlc-norte",
    nombre: "Ruta Valencia Norte",
    provincia: "Valencia",
    localidad: "Valencia",
    descripcion: "Desde la Estación del Norte hasta la Ciudad de las Artes y las Ciencias.",
    origen: { label: "Estación del Norte, Valencia", lat: 39.4660, lng: -0.3770 },
    destino: { label: "Ciudad de las Artes, Valencia", lat: 39.4536, lng: -0.3508 },
  },
  {
    id: "vlc-puerto",
    nombre: "Ruta Valencia Puerto",
    provincia: "Valencia",
    localidad: "Valencia",
    descripcion: "Recorrido desde el centro de Valencia hasta la zona portuaria y la Marina.",
    origen: { label: "Plaza del Ayuntamiento, Valencia", lat: 39.4699, lng: -0.3763 },
    destino: { label: "La Marina de Valencia", lat: 39.4590, lng: -0.3280 },
  },
  {
    id: "mur-industrial",
    nombre: "Ruta Murcia Industrial",
    provincia: "Murcia",
    localidad: "Murcia",
    descripcion: "Conexión entre el centro de Murcia y el polígono industrial Oeste.",
    origen: { label: "Catedral de Murcia", lat: 37.9839, lng: -1.1283 },
    destino: { label: "Polígono Industrial Oeste, Murcia", lat: 37.9770, lng: -1.1700 },
  },
  {
    id: "bcn-comercial",
    nombre: "Ruta Barcelona Comercial",
    provincia: "Barcelona",
    localidad: "Barcelona",
    descripcion: "Paseo comercial desde Plaza Cataluña hasta el Port Olímpic.",
    origen: { label: "Plaza Cataluña, Barcelona", lat: 41.3870, lng: 2.1700 },
    destino: { label: "Port Olímpic, Barcelona", lat: 41.3850, lng: 2.2010 },
  },
];

export const provincias = [...new Set(predefinedRoutes.map((r) => r.provincia))].sort();

export function getLocalidades(provincia) {
  return [
    ...new Set(
      predefinedRoutes.filter((r) => r.provincia === provincia).map((r) => r.localidad)
    ),
  ].sort();
}