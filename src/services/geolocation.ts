/**
 * Field Geolocation Service
 * Obtains device GPS coordinates with accuracy metrics, provides adaptive high-accuracy/standard fallback,
 * and supports manual checkpoint overrides for indoor forensic facilities.
 */

export interface FieldLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  description: string;
  source: 'DEVICE_GPS' | 'STATION_MANUAL' | 'FALLBACK';
  status: 'FIXED' | 'ACQUIRING' | 'FALLBACK' | 'PERMISSION_DENIED';
  timestamp?: string;
}

const CUSTOM_LOCATION_KEY = 'ftvc_custom_gps_fix_v1';

export function getSavedCustomLocation(): FieldLocation | null {
  try {
    const raw = localStorage.getItem(CUSTOM_LOCATION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveCustomLocation(loc: FieldLocation): void {
  try {
    localStorage.setItem(CUSTOM_LOCATION_KEY, JSON.stringify(loc));
  } catch {}
}

export function clearCustomLocation(): void {
  try {
    localStorage.removeItem(CUSTOM_LOCATION_KEY);
  } catch {}
}

/**
 * Acquire GPS location from device with automatic fallback to standard accuracy
 */
export async function getFieldLocation(forceFresh: boolean = false): Promise<FieldLocation> {
  // Check if manual checkpoint location is saved
  const custom = getSavedCustomLocation();
  if (custom && !forceFresh) {
    return custom;
  }

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: 28.613939,
        longitude: 77.209021,
        accuracyMeters: 25,
        description: 'New Delhi Narcotics Verification Post (Geolocation API Unsupported)',
        source: 'FALLBACK',
        status: 'FALLBACK',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Attempt 1: High Accuracy with 8s timeout
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracyMeters: Math.round(position.coords.accuracy || 12),
          description: `Device GPS Fix (±${Math.round(position.coords.accuracy || 12)}m accuracy)`,
          source: 'DEVICE_GPS',
          status: 'FIXED',
          timestamp: new Date(position.timestamp || Date.now()).toISOString()
        });
      },
      (err) => {
        console.warn('High accuracy GPS timed out or unavailable, attempting standard WiFi/network fix:', err.message);

        // Attempt 2: Standard accuracy (faster, works reliably on laptops and indoors)
        navigator.geolocation.getCurrentPosition(
          (stdPos) => {
            resolve({
              latitude: Number(stdPos.coords.latitude.toFixed(6)),
              longitude: Number(stdPos.coords.longitude.toFixed(6)),
              accuracyMeters: Math.round(stdPos.coords.accuracy || 35),
              description: `Network Station Fix (±${Math.round(stdPos.coords.accuracy || 35)}m accuracy)`,
              source: 'DEVICE_GPS',
              status: 'FIXED',
              timestamp: new Date(stdPos.timestamp || Date.now()).toISOString()
            });
          },
          (stdErr) => {
            console.warn('Standard geolocation failed or permission denied:', stdErr.message);
            const isDenied = stdErr.code === 1; // PERMISSION_DENIED

            resolve({
              latitude: 28.613939,
              longitude: 77.209021,
              accuracyMeters: 30,
              description: isDenied 
                ? 'Central Sector Post (Browser Location Permission Blocked)'
                : 'Checkpoint Baseline Coordinates (No Satellite Lock)',
              source: 'FALLBACK',
              status: isDenied ? 'PERMISSION_DENIED' : 'FALLBACK',
              timestamp: new Date().toISOString()
            });
          },
          {
            enableHighAccuracy: false,
            timeout: 7000,
            maximumAge: 120000
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000
      }
    );
  });
}

/**
 * Standard Forensic Checkpoint Presets for Demonstration & Indoor Facilities
 */
export const FIELD_STATION_PRESETS: Array<{
  name: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  description: string;
}> = [
  {
    name: 'New Delhi Central Narcotics Post',
    latitude: 28.613939,
    longitude: 77.209021,
    accuracyMeters: 8,
    description: 'NCB Northern Headquarters Sector, New Delhi'
  },
  {
    name: 'Mumbai Port Interdiction Checkpoint',
    latitude: 18.943802,
    longitude: 72.838707,
    accuracyMeters: 10,
    description: 'Cargo Screening Depot, Mumbai Port Area'
  },
  {
    name: 'Bengaluru Tech & Cargo Inspection Hub',
    latitude: 12.971599,
    longitude: 77.594566,
    accuracyMeters: 6,
    description: 'Customs Inland Cargo Depot, Bengaluru'
  },
  {
    name: 'Kolkata Border Enforcement Sector',
    latitude: 22.572646,
    longitude: 88.363895,
    accuracyMeters: 12,
    description: 'Eastern Regional Drug Enforcement Outpost'
  }
];
