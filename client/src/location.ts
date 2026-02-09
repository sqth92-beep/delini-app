// src/utils/location.ts
export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const LOCATION_KEY = 'delini_user_location';

// طلب إذن الموقع
export async function requestUserLocation(): Promise<UserLocation | null> {
  if (!navigator.geolocation) {
    console.warn('Geolocation غير مدعوم في هذا المتصفح');
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        };
        
        // حفظ في localStorage
        localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
        resolve(location);
      },
      (error) => {
        console.warn('لم يتم الحصول على الموقع:', error.message);
        
        // استخدام موقع افتراضي (البصرة) إذا لم يعمل
        const defaultLocation: UserLocation = {
          latitude: 30.5081, // البصرة
          longitude: 47.7835,
          timestamp: Date.now(),
        };
        
        localStorage.setItem(LOCATION_KEY, JSON.stringify(defaultLocation));
        resolve(defaultLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

// جلب الموقع المحفوظ
export function getSavedLocation(): UserLocation | null {
  const saved = localStorage.getItem(LOCATION_KEY);
  if (!saved) return null;
  
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

// حساب المسافة بين نقطتين (كيلومتر)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // تقريب لخانة عشرية واحدة
}

// حساب مسافة المحل عن المستخدم
export function calculateBusinessDistance(
  businessLat?: number,
  businessLon?: number
): string | null {
  const userLocation = getSavedLocation();
  
  if (!userLocation || !businessLat || !businessLon) {
    return null;
  }
  
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    businessLat,
    businessLon
  );
  
  return `${distance} كم`;
}
