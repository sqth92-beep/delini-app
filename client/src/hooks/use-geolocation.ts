import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionDenied: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    permissionDenied: false,
  });

  const getLocation = useCallback(async () => {
    // فقط لوظيفة طلب الإذن - تعمل على Android
    const requestAndroidPermission = () => {
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        // هذا يعمل في المتصفح فقط
        return Promise.resolve(false);
      }
      
      // في Android WebView، نستخدم طريقة بسيطة
      return new Promise<boolean>((resolve) => {
        if (!navigator.geolocation) {
          resolve(false);
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          (error) => resolve(error.code !== error.PERMISSION_DENIED),
          { timeout: 100, maximumAge: Infinity }
        );
      });
    };

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // أولاً: نجرب طلب الإذن على Android
      const hasPermission = await requestAndroidPermission();
      
      if (!hasPermission && navigator.geolocation) {
        // إذا ما عندنا إذن، نطلب بشكل مباشر
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setState({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
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
      } else if (!navigator.geolocation) {
        setState(prev => ({
          ...prev,
          error: "GPS not supported",
          loading: false,
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || "Failed to get location",
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const requestLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    // طريقة مباشرة لطلب الموقع
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
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
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } else {
      setState(prev => ({
        ...prev,
        error: "Geolocation not supported",
        loading: false,
      }));
    }
  }, []);

  return { ...state, requestLocation };
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
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
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return language === "ar" ? `${meters} متر` : `${meters}m`;
  }
  return language === "ar" ? `${km.toFixed(1)} كم` : `${km.toFixed(1)}km`;
}
