import { envConfig } from "@/envConfig";

/**
 * Ultra-fast geocode using Google Maps JS SDK (in-memory) with Google Geocode REST fallback.
 * Uses GOOGLE_MAPS_API_KEY from environment via envConfig.
 */
export async function fastGeocode(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || !address.trim()) return null;

  // 1. Try Google Maps JS SDK Geocoder (Client in-memory, ~30-50ms)
  if (typeof window !== "undefined" && (window as any).google?.maps?.Geocoder) {
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      const res = await geocoder.geocode({ address: address.trim() });
      if (res?.results?.[0]?.geometry?.location) {
        const loc = res.results[0].geometry.location;
        return {
          lat: typeof loc.lat === "function" ? loc.lat() : Number(loc.lat),
          lng: typeof loc.lng === "function" ? loc.lng() : Number(loc.lng),
        };
      }
    } catch {}
  }

  // 2. Try Google Maps Geocoding REST API with key from envConfig
  let key = process.env.GOOGLE_MAPS_API_KEY || "";
  if (!key) {
    try {
      const config = await envConfig();
      key = config.googleMapsApiKey || "";
    } catch {}
  }

  if (key) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address.trim())}&key=${key}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.results?.[0]?.geometry?.location) {
          return {
            lat: data.results[0].geometry.location.lat,
            lng: data.results[0].geometry.location.lng,
          };
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Fast reverse geocode to get a readable location name
 */
export async function fastReverseGeocode(lat: string | number, lng: string | number): Promise<string | null> {
  if (!lat || !lng) return null;

  // 1. Try Google Maps JS SDK Geocoder
  if (typeof window !== "undefined" && (window as any).google?.maps?.Geocoder) {
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      const res = await geocoder.geocode({ location: { lat: Number(lat), lng: Number(lng) } });
      if (res?.results?.[0]?.formatted_address) {
        return res.results[0].formatted_address;
      }
    } catch {}
  }

  // 2. Try Google Maps Geocoding REST API with key from envConfig
  let key = process.env.GOOGLE_MAPS_API_KEY || "";
  if (!key) {
    try {
      const config = await envConfig();
      key = config.googleMapsApiKey || "";
    } catch {}
  }

  if (key) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.results?.[0]?.formatted_address) {
          return data.results[0].formatted_address;
        }
      }
    } catch {}
  }

  return null;
}
