import type { Language } from '../types';

const EARTH_RADIUS_KM = 6371;
const ROAD_DISTANCE_FACTOR = 1.25;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculates road-estimated distance in kilometers using the Haversine formula
 * multiplied by a 1.25 road-winding factor, rounded to 1 decimal place.
 */
export function calculateRoadDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lng1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lng2)
  ) {
    return 0;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = EARTH_RADIUS_KM * c;
  const roadKm = straightLineKm * ROAD_DISTANCE_FACTOR;
  return Number(roadKm.toFixed(1));
}

export function buildGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export interface GeoFixResult {
  lat: number;
  lng: number;
  accuracyMeters?: number;
}

export function requestCurrentPosition(lang: Language = 'bn'): Promise<GeoFixResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(
        new Error(
          lang === 'bn'
            ? 'আপনার ব্রাউজারে GPS লোকেশন সাপোর্ট নেই। নিচে ম্যাপে পিন বসিয়ে ঠিকানা দিন।'
            : 'GPS geolocation is not supported on this browser. You can drop a pin on the map instead.'
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracyMeters: position.coords.accuracy,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(
            new Error(
              lang === 'bn'
                ? 'লোকেশন পারমিশন দেওয়া হয়নি। অনুগ্রহ করে ব্রাউজারে Location চালু করুন অথবা ম্যাপে পিন টেনে বসান।'
                : 'Location permission was denied. Please enable Location access or drop your pin directly on the map.'
            )
          );
          return;
        }
        if (err.code === err.TIMEOUT) {
          reject(
            new Error(
              lang === 'bn'
                ? 'GPS সিগন্যাল পেতে সময় বেশি লাগছে। আবার চেষ্টা করুন অথবা ম্যাপে পিন বসান।'
                : 'Location request timed out. Please try again or pick your spot on the map.'
            )
          );
          return;
        }
        reject(
          new Error(
            lang === 'bn'
              ? 'বর্তমান লোকেশন শনাক্ত করা যায়নি। ম্যাপে ক্লিক করে আপনার লোকেশন পিন করুন।'
              : 'Unable to detect your location right now. Tap on the map to pin your doorstep.'
          )
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 15000,
      }
    );
  });
}
