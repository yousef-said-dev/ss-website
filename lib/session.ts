import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_key_123';

export async function createSession(userId: number, role: string) {
  const token = jwt.sign({ userId, role }, SECRET_KEY, { expiresIn: '1d' });
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session');
  if (!token) return null;
  try {
    return jwt.verify(token.value, SECRET_KEY) as { userId: number; role: string };
  } catch (e) {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
