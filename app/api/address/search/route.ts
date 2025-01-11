export const runtime = 'edge';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface AddressSuggestion {
  address: string;
  lat: number;
  lng: number;
}

const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY;
const cache = new Map<string, { data: AddressSuggestion[], timestamp: number }>();

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query || query.length < 2) return NextResponse.json([]);

  const cached = cache.get(query);
  if (cached?.timestamp && Date.now() - cached.timestamp < 3600 * 1000) {
    return NextResponse.json(cached.data);
  }

  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=5&format=json&apiKey=${GEOAPIFY_KEY}`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    const data = await response.json();
    const suggestions = data.results.map((result: any) => ({
      address: formatAddress(result),
      lat: result.lat,
      lng: result.lon
    }));

    cache.set(query, { data: suggestions, timestamp: Date.now() });
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Geoapify Error:', error);
    return fallbackToOSM(query);
  }
}

function formatAddress(result: any): string {
  const parts = [];
  if (result.address_line1) parts.push(result.address_line1);
  if (result.address_line2) parts.push(result.address_line2);
  return parts.join(', ');
}

async function fallbackToOSM(query: string) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MonsterMap'
        }
      }
    );
    
    const data = await response.json();
    return NextResponse.json(data.map((result: any) => ({
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    })));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}