import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import sql from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET!;

async function verifyAdminToken(headersList: Headers) {
  const authHeader = headersList.get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (!token) throw new Error('No token provided');
  
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    throw new Error('Invalid token');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await verifyAdminToken(headers());
    
    await sql.begin(async (sql) => {
      await sql`DELETE FROM location_variants WHERE location_id = ${params.id}`;
      await sql`DELETE FROM location_submissions WHERE location_id = ${params.id}`;
      await sql`DELETE FROM locations WHERE location_id = ${params.id}`;
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}