const earthRadiusKm = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineDistanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinRadius(
  origin: { latitude: number; longitude: number },
  location: { latitude: number | null; longitude: number | null },
  radiusKm: number,
) {
  if (location.latitude === null || location.longitude === null || radiusKm < 0) return false;
  return haversineDistanceKm(origin, {
    latitude: location.latitude,
    longitude: location.longitude,
  }) <= radiusKm;
}
