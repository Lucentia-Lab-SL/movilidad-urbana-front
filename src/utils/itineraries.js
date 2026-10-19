// Ranking de itinerarios: duración total de menor a mayor.
// Se usa tanto para pintar el ranking como para saber cuál es el primero.
export const sortItinerariesByDuration = (itineraries) =>
  [...(itineraries || [])].sort(
    (a, b) => (a.total_time_min || 999999) - (b.total_time_min || 999999)
  );
