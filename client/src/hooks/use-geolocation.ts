import { useState, useEffect, useCallback } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionDenied: boolean;
  accuracy: number | null;
}

const LOCATION_PERMISSION_KEY = "delini_location_permission_asked";

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    permissionDenied: false,
    accuracy: null,
  });

  const checkPermissions = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await Geolocation.checkPermissions();
        return status.location === "granted";
      } catch (error) {
        console.warn("Permission check failed:", error);
        return false;
      }
    }
    return "geolocation" in navigator;
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check if we're on native platform
      if (Capacitor.isNativePlatform()) {
        const hasPermission = await checkPermissions();
        
        if (!hasPermission) {
          // Check if we've asked before
          const { value } = await Preferences.get({ key: LOCATION_PERMISSION_KEY });
          const hasAskedBefore = value === "true";
          
          if (!hasAskedBefore) {
            // Request permission for the first time
            const permission = await Geolocation.requestPermissions();
            
            if (permission.location !== "granted") {
              await Preferences.set({ key: LOCATION_PERMISSION_KEY, value: "true" });
              setState(prev => ({
                ...prev,
                error: "Location permission denied",
                loading: false,
                permissionDenied: true,
              }));
              return;
            }
            
            await Preferences.set({ key: LOCATION_PERMISSION_KEY, value: "true" });
          } else {
            setState(prev => ({
              ...prev,
              error: "Location permission was previously denied",
              loading: false,
              permissionDenied: true,
            }));
            return;
          }
        }

        // Get current position using Capacitor
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });

        setState({
          latitude: coordinates.coords.latitude,
          longitude: coordinates.coords.longitude,
          accuracy: coordinates.coords.accuracy,
          error: null,
          loading: false,
          permissionDenied: false,
        });

      } else {
        // Web platform (fallback)
        if (!navigator.geolocation) {
          setState(prev => ({
            ...prev,
            error: "Geolocation is not supported in your browser",
            loading: false,
          }));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setState({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              error: null,
              loading: false,
              permissionDenied: false,
            });
          },
          (error) => {
            setState(prev => ({
              ...prev,
              error: error.message,
              loading: false,
              permissionDenied: error.code === error.PERMISSION_DENIED,
            }));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          }
        );
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || "Failed to get location",
        loading: false,
        permissionDenied: error.message?.includes("permission") || false,
      }));
    }
  }, [checkPermissions]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const requestLocation = useCallback(async () => {
    await getCurrentLocation();
  }, [getCurrentLocation]);

  const clearPermissionMemory = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: LOCATION_PERMISSION_KEY });
    }
  }, []);

  const openSettings = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Geolocation.openSettings();
      } catch (error) {
        console.warn("Failed to open settings:", error);
      }
    }
  }, []);

  return { 
    ...state, 
    requestLocation, 
    clearPermissionMemory,
    openSettings,
    isNative: Capacitor.isNativePlatform()
  };
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(km: number, language: string = "ar"): string {
  if (km < 0.05) { // Less than 50 meters
    return language === "ar" ? "قريب جداً" : "Very close";
  }
  if (km < 0.1) { // Less than 100 meters
    const meters = Math.round(km * 1000);
    return language === "ar" ? `${meters} متر` : `${meters}m`;
  }
  if (km < 1) { // Less than 1 km
    const meters = Math.round(km * 1000);
    return language === "ar" ? `${meters} متر` : `${meters}m`;
  }
  if (km < 10) { // Less than 10 km
    return language === "ar" ? `${km.toFixed(1)} كم` : `${km.toFixed(1)}km`;
  }
  return language === "ar" ? `${Math.round(km)} كم` : `${Math.round(km)}km`;
}

// Helper function to sort businesses by distance
export function sortByDistance<T extends { latitude?: number | null; longitude?: number | null }>(
  items: T[],
  userLat: number,
  userLng: number
): T[] {
  return items
    .filter(item => item.latitude && item.longitude)
    .map(item => ({
      ...item,
      distance: calculateDistance(
        userLat,
        userLng,
        item.latitude!,
        item.longitude!
      )
    }))
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
}

// Helper function to get approximate city/area from coordinates
export async function getLocationName(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    
    if (data.address) {
      const { city, town, village, municipality, county, state, country } = data.address;
      return [city, town, village, municipality, county, state, country]
        .filter(Boolean)
        .join(", ");
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
