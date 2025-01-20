import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  const { password } = await request.json();
  if (password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({}, process.env.JWT_SECRET!, { expiresIn: '24h' });
    return NextResponse.json({ token });
  }
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}
