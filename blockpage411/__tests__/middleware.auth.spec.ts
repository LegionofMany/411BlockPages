/// <reference types="jest" />

import { middleware } from '../middleware';
import { NextRequest } from 'next/server';

function makeReq(url: string, cookie?: string) {
  return new NextRequest(new Request(url, {
    headers: cookie ? { cookie } : {},
  }));
}

describe('middleware auth guard', () => {
  test('redirects unauthenticated user from protected route', () => {
    const req = makeReq('http://localhost/profile');
    const res = middleware(req);

    expect(res).toBeTruthy();
    const location = res.headers.get('location') || '';
    expect(location).toContain('/login');
    expect(location).toContain('redirectTo=%2Fprofile');
  });

  test('allows authenticated user to access protected route', () => {
    const req = makeReq('http://localhost/profile', 'token=abc');
    const res = middleware(req);

    const location = res.headers.get('location');
    expect(location).toBeNull();
  });

  test('does not redirect on public route', () => {
    const req = makeReq('http://localhost/search');
    const res = middleware(req);

    const location = res.headers.get('location');
    expect(location).toBeNull();
  });
});
