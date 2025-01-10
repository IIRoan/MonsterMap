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
        SELECT 
          l.location_id,
          l.name,
          l.address,
          l.latitude,
          l.longitude,
          ls.variants
        FROM locations l
        LEFT JOIN location_submissions ls 
        ON l.location_id = ls.location_id
        ORDER BY ls.submission_time DESC
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