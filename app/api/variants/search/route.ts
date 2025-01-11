export const runtime = 'edge'
import { createClient } from '@clickhouse/client';
import { NextResponse } from 'next/server';

const client = createClient({
  url: process.env.CLICKHOUSE_HOST!,
  username: process.env.CLICKHOUSE_USER!,
  password: process.env.CLICKHOUSE_PASSWORD!
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const result = await client.query({
      query: `
        SELECT DISTINCT variant_name
        FROM location_variants
        WHERE variant_name ILIKE {query:String}
        ORDER BY confirmation_count DESC
        LIMIT 5
      `,
      query_params: {
        query: `%${query}%`
      },
      format: 'JSONEachRow'
    });

    const variants = await result.json();
    return NextResponse.json(variants.map((v: any) => v.variant_name));
  } catch (error) {
    console.error('Error searching variants:', error);
    return NextResponse.json({ error: 'Failed to search variants' }, { status: 500 });
  }
}