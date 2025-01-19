import { NextResponse } from 'next/server';
import type { LocationResponse } from '@/types/Location';
import sql from '@/lib/db';

export async function GET() {
  try {
    const locations = await sql<LocationResponse[]>`
      SELECT 
        l.location_id,
        l.name,
        l.address,
        l.latitude,
        l.longitude,
        ARRAY_AGG(DISTINCT lv.variant_name) as variants
      FROM locations l
      LEFT JOIN location_variants lv ON l.location_id = lv.location_id
      GROUP BY
        l.location_id,
        l.name,
        l.address,
        l.latitude,
        l.longitude
      ORDER BY name ASC
    `;

    return NextResponse.json(locations);
  } catch (error) {
    console.error('PostgreSQL query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}