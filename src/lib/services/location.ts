// Types for location service
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface CachedLocation extends LocationCoordinates {
  name: string;
  timestamp: number;
}

export interface LocationPermissionState {
  state: 'granted' | 'denied' | 'prompt';
}

export interface GeolocationError {
  code: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
}

// Constants
const LOCATION_CACHE_KEY = 'workoutsync_cached_location';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const GEOLOCATION_TIMEOUT_MS = 10000; // 10 seconds
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/reverse';

// Location service class
export class LocationService {
  /**
   * Detects user's current location using browser geolocation API
   */
  static async detectLocation(): Promise<LocationCoordinates | null> {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return null;
    }

    return new Promise((resolve) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: 300000, // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        },
        options
      );
    });
  }

  /**
   * Reverse geocodes coordinates to a human-readable location
   */
  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Validate coordinates
      if (!this.isValidCoordinates(lat, lng)) {
        return 'Invalid location';
      }

      const url = new URL(NOMINATIM_BASE_URL);
      url.searchParams.set('lat', lat.toString());
      url.searchParams.set('lon', lng.toString());
      url.searchParams.set('format', 'json');
      url.searchParams.set('zoom', '10');
      url.searchParams.set('addressdetails', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'WorkoutSync/1.0 (PWA)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !data.address) {
        return 'Unknown location';
      }

      return this.formatLocationName(data.address);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Unknown location';
    }
  }

  /**
   * Checks current location permission status
   */
  static async requestLocationPermission(): Promise<PermissionState> {
    try {
      // Check if permissions API is supported
      if (!navigator.permissions) {
        // Fallback: try to get location to determine permission
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve('granted'),
            (error) => {
              if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
                resolve('denied');
              } else {
                resolve('prompt');
              }
            },
            { timeout: 1000 }
          );
        });
      }

      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return permission.state;
    } catch (error) {
      console.error('Permission check error:', error);
      return 'prompt';
    }
  }

  /**
   * Gets cached location if recent and valid
   */
  static getCachedLocation(): CachedLocation | null {
    try {
      if (typeof window === 'undefined') {
        return null; // SSR safety
      }

      const cached = localStorage.getItem(LOCATION_CACHE_KEY);
      if (!cached) {
        return null;
      }

      const parsedCache: CachedLocation = JSON.parse(cached);
      
      // Check if cache is still valid
      const now = Date.now();
      if (now - parsedCache.timestamp > CACHE_DURATION_MS) {
        localStorage.removeItem(LOCATION_CACHE_KEY);
        return null;
      }

      // Validate cached coordinates
      if (!this.isValidCoordinates(parsedCache.latitude, parsedCache.longitude)) {
        localStorage.removeItem(LOCATION_CACHE_KEY);
        return null;
      }

      return parsedCache;
    } catch (error) {
      console.error('Cache read error:', error);
      localStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }
  }

  /**
   * Caches location with timestamp
   */
  static cacheLocation(lat: number, lng: number, name: string): void {
    try {
      if (typeof window === 'undefined') {
        return; // SSR safety
      }

      if (!this.isValidCoordinates(lat, lng) || !name.trim()) {
        console.warn('Invalid coordinates or name for caching');
        return;
      }

      const cacheData: CachedLocation = {
        latitude: lat,
        longitude: lng,
        name: name.trim(),
        timestamp: Date.now(),
      };

      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Gets user's location with fallback to cache
   */
  static async getUserLocation(): Promise<{
    coordinates: LocationCoordinates;
    name: string;
    source: 'gps' | 'cache';
  } | null> {
    // First try to get cached location
    const cached = this.getCachedLocation();
    if (cached) {
      return {
        coordinates: {
          latitude: cached.latitude,
          longitude: cached.longitude,
        },
        name: cached.name,
        source: 'cache',
      };
    }

    // Try to get current location
    const coordinates = await this.detectLocation();
    if (!coordinates) {
      return null;
    }

    // Reverse geocode to get location name
    const name = await this.reverseGeocode(coordinates.latitude, coordinates.longitude);
    
    // Cache the result
    this.cacheLocation(coordinates.latitude, coordinates.longitude, name);

    return {
      coordinates,
      name,
      source: 'gps',
    };
  }

  /**
   * Validates if coordinates are valid
   */
  private static isValidCoordinates(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  /**
   * Formats location name from Nominatim address object
   */
  private static formatLocationName(address: Record<string, unknown>): string {
    try {
      // Priority order for location name
      const locationParts = [
        address.city as string,
        address.town as string,
        address.village as string,
        address.municipality as string,
        address.county as string,
        address.state as string,
        address.country as string,
      ];

      // Find the first non-empty part
      const primaryLocation = locationParts.find(part => part && part.trim());
      
      if (primaryLocation) {
        return `${primaryLocation.trim()} area`;
      }

      // Fallback to postal code or coordinates
      if (address.postcode) {
        return `${address.postcode as string} area`;
      }

      return 'Unknown location';
    } catch (error) {
      console.error('Location formatting error:', error);
      return 'Unknown location';
    }
  }

  /**
   * Clears cached location
   */
  static clearCache(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCATION_CACHE_KEY);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Gets distance between two coordinates in kilometers
   */
  static getDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Converts degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Checks if location services are available
   */
  static isLocationAvailable(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      'geolocation' in navigator
    );
  }

  /**
   * Gets location with user-friendly error messages
   */
  static async getLocationWithFallback(): Promise<{
    success: boolean;
    data?: {
      coordinates: LocationCoordinates;
      name: string;
      source: 'gps' | 'cache';
    };
    error?: string;
  }> {
    try {
      // Check if location is available
      if (!this.isLocationAvailable()) {
        return {
          success: false,
          error: 'Location services are not available on this device',
        };
      }

      // Check permission
      const permission = await this.requestLocationPermission();
      if (permission === 'denied') {
        return {
          success: false,
          error: 'Location access has been denied. Please enable location services in your browser settings.',
        };
      }

      // Try to get location
      const location = await this.getUserLocation();
      if (!location) {
        return {
          success: false,
          error: 'Unable to determine your location. Please check your location settings and try again.',
        };
      }

      return {
        success: true,
        data: location,
      };
    } catch (error) {
      console.error('Location service error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while getting your location.',
      };
    }
  }
}

// Export convenience functions
export const {
  detectLocation,
  reverseGeocode,
  requestLocationPermission,
  getCachedLocation,
  cacheLocation,
  getUserLocation,
  clearCache,
  getDistance,
  isLocationAvailable,
  getLocationWithFallback,
} = LocationService;
