import { useState, useEffect, useCallback } from 'react';
import type { Location, LocationResponse } from '@/types/Location';

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/locations', {
        cache: 'no-store',  // Disable caching
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as LocationResponse[];
      
      const transformedLocations: Location[] = data.map(location => ({
        id: location.location_id,
        name: location.name,
        address: location.address,
        coordinates: [location.latitude, location.longitude],
        variants: location.variants || []
      }));

      setLocations(transformedLocations);
      setError(null);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch locations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    loading,
    error,
    refetch: fetchLocations
  };
}