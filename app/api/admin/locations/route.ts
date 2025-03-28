import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import sql from '@/lib/db';

async function verifyAdminToken(headersList: Headers) {
  const authHeader = headersList.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) throw new Error('No token provided');
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return true;
  } catch {
    throw new Error('Invalid token');
  }
}

export async function GET(request: Request) {
  try {
    await verifyAdminToken(headers());
    const locations = await sql`
      SELECT 
        l.*,
        ls.notes,
        ARRAY_AGG(DISTINCT lv.variant_name) as variants
      FROM locations l
      LEFT JOIN location_submissions ls ON l.location_id = ls.location_id
      LEFT JOIN location_variants lv ON l.location_id = lv.location_id
      GROUP BY l.location_id, ls.notes
      ORDER BY l.name ASC
    `;
    return NextResponse.json(locations);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
