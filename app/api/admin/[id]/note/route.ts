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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await verifyAdminToken(headers());
    const { note } = await request.json();
    
    await sql`
      UPDATE location_submissions 
      SET notes = ${note}
      WHERE location_id = ${params.id}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}
