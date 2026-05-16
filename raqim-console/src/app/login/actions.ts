'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function authenticateConsole(formData: FormData) {
  const licenseKey = formData.get('license_key') as string;

  if (!licenseKey) {
    return { error: 'License key is required' };
  }

  // Set as HttpOnly cookie valid for 24 hours
  const cookieStore = await cookies();
  cookieStore.set('raqim_license', licenseKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  redirect('/');
}

export async function bootOpenCore() {
  // Generate a mock JWT string that contains an empty features: [] array
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: 'open-core-user',
    features: [],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
  })).toString('base64url');
  const signature = 'mock_signature_open_core';
  
  const mockJwt = `${header}.${payload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set('raqim_license', mockJwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  redirect('/');
}
