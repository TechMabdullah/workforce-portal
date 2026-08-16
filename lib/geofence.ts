// Haversine formula: distance in meters between two lat/lng points
export function distanceInMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

// Business location — replace with real coordinates, or fetch per-branch from Firestore later
export const BUSINESS_LOCATION = { lat: 24.8607, lng: 67.0011 }; // Karachi placeholder
export const GEOFENCE_RADIUS_METERS = 150;

export function isWithinGeofence(coords: { lat: number; lng: number }): boolean {
  return distanceInMeters(coords, BUSINESS_LOCATION) <= GEOFENCE_RADIUS_METERS;
}