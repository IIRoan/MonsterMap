import { createClient } from '@clickhouse/client';
import { NextResponse } from 'next/server';
import type { LocationResponse } from '@/types/Location';

const client = createClient({
  host: process.env.CLICKHOUSE_HOST!,
  username: process.env.CLICKHOUSE_USER!,
  password: process.env.CLICKHOUSE_PASSWORD!,
});

export async function GET() {
  try {
    const result = await client.query({
      query: `
        WITH variant_arrays AS (
          SELECT
            l.name,
            l.address,
            l.latitude,
            l.longitude,
            groupArray(DISTINCT lv.variant_name) as variants
          FROM locations l
          LEFT JOIN location_variants lv ON l.location_id = lv.location_id
          GROUP BY 
            l.name,
            l.address,
            l.latitude,
            l.longitude
        )
        SELECT
          generateUUIDv4() as location_id,
          name,
          address,
          latitude,
          longitude,
          variants
        FROM variant_arrays
        ORDER BY name ASC
      `,
      format: 'JSONEachRow'
    });
    
    const data = await result.json() as LocationResponse[];
    return NextResponse.json(data);
  } catch (error) {
    console.error('ClickHouse query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}