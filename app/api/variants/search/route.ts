import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const results = await sql<{ variant_name: string }[]>`
      SELECT DISTINCT variant_name, confirmation_count
      FROM location_variants
      WHERE variant_name ILIKE ${'%' + query + '%'}
      ORDER BY confirmation_count DESC
      LIMIT 5
    `;
    return NextResponse.json(results.map(v => v.variant_name));
  } catch (error) {
    console.error('Error searching variants:', error);
    return NextResponse.json({ error: 'Failed to search variants' }, { status: 500 });
  }
}