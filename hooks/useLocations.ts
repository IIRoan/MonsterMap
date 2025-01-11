import { useState, useEffect } from 'react';
import { Location, LocationResponse } from '@/types/Location';

// Create a cache to store the locations
let locationCache: Location[] | null = null;
let fetchPromise: Promise<Location[]> | null = null;

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchLocations() {
      // If we already have cached data, use it immediately
      if (locationCache) {
        setLocations(locationCache);
        setLoading(false);
        return;
      }

      // If there's an ongoing fetch, wait for it
      if (fetchPromise) {
        try {
          const data = await fetchPromise;
          setLocations(data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to fetch locations'));
        } finally {
          setLoading(false);
        }
        return;
      }

      // Start a new fetch
      fetchPromise = fetch('/api/locations')
        .then(response => response.json())
        .then((data: LocationResponse[]) => {
          const transformedLocations: Location[] = data.map(location => ({
            id: location.location_id,
            name: location.name,
            address: location.address,
            coordinates: [location.latitude, location.longitude],
            variants: location.variants || []
          }));
          
          locationCache = transformedLocations;
          return transformedLocations;
        });

      try {
        const data = await fetchPromise;
        setLocations(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch locations'));
      } finally {
        setLoading(false);
        fetchPromise = null;
      }
    }

    fetchLocations();
  }, []);

  const refetch = async () => {
    setLoading(true);
    locationCache = null;
    fetchPromise = null;
    
    try {
      const response = await fetch('/api/locations');
      const data = (await response.json()) as LocationResponse[];
      
      const transformedLocations: Location[] = data.map(location => ({
        id: location.location_id,
        name: location.name,
        address: location.address,
        coordinates: [location.latitude, location.longitude],
        variants: location.variants || []
      }));
      
      locationCache = transformedLocations;
      setLocations(transformedLocations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch locations'));
    } finally {
      setLoading(false);
    }
  };

  return { locations, loading, error, refetch };
}