import { useState, useEffect } from 'react';
import { Location, LocationResponse } from '@/types/Location';

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchLocations() {
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
        
        setLocations(transformedLocations);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch locations'));
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, []);

  return { locations, loading, error };
}